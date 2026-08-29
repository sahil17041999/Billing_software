// middleware/validate.js
// Reusable Joi validation middleware for all routes

const Joi = require('joi');

// ============================================================
// MIDDLEWARE FACTORY
// ============================================================
// Usage: router.post('/route', validate(schemas.createUser), controller)
// Errors are returned as JSON (for AJAX) or redirect with flash-style query params

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : (source === 'query' ? req.query : req.params);

    const { error, value } = schema.validate(data, {
      abortEarly: false,      // collect ALL errors
      stripUnknown: true,     // strip unknown keys
      convert: true           // coerce strings to numbers etc.
    });

    if (error) {
      const messages = error.details.map(d => d.message.replace(/['"]/g, ''));

      if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
        return res.status(422).json({
          error: messages[0],
          errors: messages
        });
      }

      // For HTML form submissions, redirect back with error
      return res.status(422).json({
        error: messages[0],
        errors: messages
      });
    }

    // Attach cleaned value back to request
    if (source === 'body') req.body = value;
    next();
  };
};


// ============================================================
// SCHEMAS
// ============================================================

const schemas = {

  // ----------------------------------------------------------
  // Auth / User Management
  // ----------------------------------------------------------

  createUser: Joi.object({
    phone: Joi.string().required().custom((value, helpers) => {
      let clean = (value || '').toString().trim().replace(/[^0-9]/g, '');
      if (clean.length > 10 && clean.startsWith('91')) clean = clean.substring(2);
      else if (clean.length > 10 && clean.startsWith('0')) clean = clean.substring(1);
      if (!/^[6-9]\d{9}$/.test(clean)) {
        return helpers.message('Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)');
      }
      return clean;
    }).messages({
      'any.required': 'Mobile number is required',
      'string.empty': 'Mobile number is required'
    }),
    username: Joi.string().max(50).allow('', null).optional(),
    password: Joi.string().allow('', null).optional(),
    email: Joi.string().email({ tlds: { allow: false } }).max(255).allow('', null).optional(),
    first_name: Joi.string().max(100).allow('', null).optional(),
    last_name: Joi.string().max(100).allow('', null).optional(),
    role_id: Joi.number().integer().positive().required()
      .messages({ 'any.required': 'Role is required' }),
    is_active: Joi.number().integer().valid(0, 1).default(1)
  }),

  editUser: Joi.object({
    phone: Joi.string().required().custom((value, helpers) => {
      let clean = (value || '').toString().trim().replace(/[^0-9]/g, '');
      if (clean.length > 10 && clean.startsWith('91')) clean = clean.substring(2);
      else if (clean.length > 10 && clean.startsWith('0')) clean = clean.substring(1);
      if (!/^[6-9]\d{9}$/.test(clean)) {
        return helpers.message('Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)');
      }
      return clean;
    }).messages({
      'any.required': 'Mobile number is required',
      'string.empty': 'Mobile number is required'
    }),
    email: Joi.string().email({ tlds: { allow: false } }).max(255).allow('', null).optional(),
    first_name: Joi.string().max(100).allow('', null).optional(),
    last_name: Joi.string().max(100).allow('', null).optional(),
    role_id: Joi.number().integer().positive().required()
      .messages({ 'any.required': 'Role is required' }),
    is_active: Joi.number().integer().valid(0, 1).default(1)
  }),

  changePassword: Joi.object({
    new_password: Joi.string().min(6).max(100).required()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'New password is required'
      }),
    confirm_password: Joi.any().valid(Joi.ref('new_password')).required()
      .messages({ 'any.only': 'Passwords do not match' })
  }),

  changeOwnPassword: Joi.object({
    current_password: Joi.string().required()
      .messages({ 'any.required': 'Current password is required' }),
    new_password: Joi.string().min(6).max(100).required()
      .messages({ 'string.min': 'New password must be at least 6 characters' }),
    confirm_password: Joi.any().valid(Joi.ref('new_password')).required()
      .messages({ 'any.only': 'Passwords do not match' })
  }),

  // ----------------------------------------------------------
  // Sales
  // ----------------------------------------------------------

  createSale: Joi.object({
    customer_id: Joi.number().integer().positive().allow(null, '').optional(),
    payment_mode_id: Joi.number().integer().positive().allow(null, '').optional(),
    discount_amount: Joi.number().min(0).default(0),
    items: Joi.array().items(
      Joi.object({
        product_id: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().min(1).required(),
        unit_price: Joi.number().min(0).required(),
        tax_rate: Joi.number().min(0).max(100).default(0),
        discount_amount: Joi.number().min(0).default(0),
        discount_percent: Joi.number().min(0).max(100).default(0),
        batch_number: Joi.string().allow('', null).optional()
      })
    ).min(1).required()
      .messages({ 'array.min': 'At least one item is required in the cart' })
  }),

  // ----------------------------------------------------------
  // Purchase
  // ----------------------------------------------------------

  createPurchase: Joi.object({
    supplier_id: Joi.number().integer().positive().allow(null, '').optional(),
    purchase_date: Joi.date().iso().required()
      .messages({ 'any.required': 'Purchase date is required' }),
    invoice_number: Joi.string().max(100).allow('', null).optional(),
    notes: Joi.string().max(500).allow('', null).optional(),
    items: Joi.array().items(
      Joi.object({
        product_id: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().min(1).required(),
        unit_cost: Joi.number().min(0).required(),
        tax_rate: Joi.number().min(0).max(100).default(0),
        batch_number: Joi.string().max(100).allow('', null).optional(),
        expiry_date: Joi.date().iso().allow(null, '').optional()
      })
    ).min(1).required()
      .messages({ 'array.min': 'At least one item is required' })
  }),

  // ----------------------------------------------------------
  // Expense
  // ----------------------------------------------------------

  createExpense: Joi.object({
    expense_date: Joi.date().iso().required()
      .messages({ 'any.required': 'Expense date is required' }),
    category: Joi.string().max(100).required()
      .messages({ 'any.required': 'Category is required' }),
    description: Joi.string().max(500).allow('', null).optional(),
    amount: Joi.number().min(0.01).required()
      .messages({ 'number.min': 'Amount must be greater than 0' }),
    payment_mode: Joi.string().max(50).allow('', null).optional(),
    reference: Joi.string().max(100).allow('', null).optional()
  }),

  // ----------------------------------------------------------
  // Sales Return
  // ----------------------------------------------------------

  createSalesReturn: Joi.object({
    sale_id: Joi.number().integer().positive().required()
      .messages({ 'any.required': 'Original sale is required' }),
    reason: Joi.string().max(500).allow('', null).optional(),
    items: Joi.array().items(
      Joi.object({
        sales_detail_id: Joi.number().integer().positive().required(),
        product_id: Joi.number().integer().positive().required(),
        return_quantity: Joi.number().integer().min(1).required(),
        unit_price: Joi.number().min(0).required()
      })
    ).min(1).required()
  }),

  // ----------------------------------------------------------
  // Purchase Return
  // ----------------------------------------------------------

  createPurchaseReturn: Joi.object({
    purchase_id: Joi.number().integer().positive().required()
      .messages({ 'any.required': 'Original purchase is required' }),
    reason: Joi.string().max(500).allow('', null).optional(),
    items: Joi.array().items(
      Joi.object({
        purchase_detail_id: Joi.number().integer().positive().required(),
        product_id: Joi.number().integer().positive().required(),
        return_quantity: Joi.number().integer().min(1).required(),
        unit_cost: Joi.number().min(0).required()
      })
    ).min(1).required()
  })
};

module.exports = { validate, schemas };
