// Master Setup Controller
const { Product, Category, Brand, Unit, Tax, PaymentMode, Customer, Supplier, Stock, sequelize } = require('../models');
const { Op } = require('sequelize');

// ============================================
// VALIDATION HELPERS
// ============================================
const validateRequired = (value, fieldName) => {
  if (!value || String(value).trim() === '') return `${fieldName} is required`;
  return null;
};

const validateEmail = (value) => {
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) return 'Invalid email format';
  return null;
};

const validatePhone = (value) => {
  if (value && !/^[+\d][\d\s-]{7,14}$/.test(String(value).trim())) return 'Invalid phone number format';
  return null;
};

const validateGSTIN = (value) => {
  if (value && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(String(value).trim().toUpperCase())) return 'Invalid GSTIN format';
  return null;
};

const validatePAN = (value) => {
  if (value && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(value).trim().toUpperCase())) return 'Invalid PAN format';
  return null;
};

const validatePincode = (value) => {
  if (value && !/^[0-9]{6}$/.test(String(value).trim())) return 'Invalid PIN code';
  return null;
};

const validatePositive = (value, fieldName) => {
  if (value !== undefined && value !== null && value !== '' && parseFloat(value) <= 0) return `${fieldName} must be greater than 0`;
  return null;
};

const buildErrors = (validations) => {
  const errors = {};
  for (const { field, error } of validations) {
    if (error) {
      if (!errors[field]) errors[field] = [];
      errors[field].push(error);
    }
  }
  return Object.keys(errors).length > 0 ? errors : null;
};

// ============================================
// CATEGORY MANAGEMENT
// ============================================

exports.getCategories = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const categories = await Category.findAll({
      where: { company_id: companyId, is_active: 1 },
      order: [['name', 'ASC']]
    });
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(categories);
    }
    
    res.render('admin/master/categories', { categories, user: req.user });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const companyId = req.session.companyId;

    const category = await Category.create({
      company_id: companyId,
      name,
      description,
      is_active: 1
    });

    res.json({ success: true, category });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const companyId = req.session.companyId;

    const category = await Category.findOne({
      where: { id, company_id: companyId }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await category.update({ name, description });
    res.json({ success: true, category });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ============================================
// BRAND MANAGEMENT
// ============================================

exports.getBrands = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const brands = await Brand.findAll({
      where: { company_id: companyId, is_active: 1 },
      order: [['name', 'ASC']]
    });
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(brands);
    }
    
    res.render('admin/master/brands', { brands, user: req.user });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createBrand = async (req, res) => {
  try {
    const { name, description } = req.body;
    const companyId = req.session.companyId;

    const brand = await Brand.create({
      company_id: companyId,
      name,
      description,
      is_active: 1
    });

    res.json({ success: true, brand });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ============================================
// PRODUCT MANAGEMENT
// ============================================

exports.getProducts = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const products = await Product.findAndCountAll({
      where: {
        company_id: companyId,
        is_active: 1,
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { sku: { [Op.like]: `%${search}%` } },
          { barcode: { [Op.like]: `%${search}%` } }
        ]
      },
      include: [
        { association: 'category', model: Category },
        { association: 'brand', model: Brand },
        { association: 'unit', model: Unit },
        { association: 'tax', model: Tax }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(products);
    }

    // Fetch dropdown data for the form
    const [categories, brands, units, taxes] = await Promise.all([
      Category.findAll({ where: { company_id: companyId, is_active: 1 } }),
      Brand.findAll({ where: { company_id: companyId, is_active: 1 } }),
      Unit.findAll({ where: { company_id: companyId, is_active: 1 } }),
      Tax.findAll({ where: { company_id: companyId, is_active: 1 } })
    ]);

    res.render('admin/master/products', { 
      products: products.rows, 
      total: products.count,
      page: parseInt(page),
      limit: parseInt(limit),
      categories,
      brands,
      units,
      taxes,
      user: req.user 
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.session.companyId;

    const product = await Product.findOne({
      where: { id, company_id: companyId },
      include: [
        { association: 'category', model: Category },
        { association: 'brand', model: Brand },
        { association: 'unit', model: Unit },
        { association: 'tax', model: Tax }
      ]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      category_id, brand_id, unit_id, name, description,
      sku, barcode, tax_id, purchase_price, selling_price,
      min_stock_level, reorder_quantity
    } = req.body;
    const companyId = req.session.companyId;

    // Server-side validation
    const errors = buildErrors([
      { field: 'name', error: validateRequired(name, 'Product name') },
      { field: 'category_id', error: validateRequired(category_id, 'Category') },
      { field: 'unit_id', error: validateRequired(unit_id, 'Unit') },
      { field: 'purchase_price', error: validateRequired(purchase_price, 'Purchase price') },
      { field: 'purchase_price', error: validatePositive(purchase_price, 'Purchase price') },
      { field: 'selling_price', error: validateRequired(selling_price, 'Selling price') },
      { field: 'selling_price', error: validatePositive(selling_price, 'Selling price') },
      { field: 'sku', error: sku ? (String(sku).length > 100 ? 'SKU must be at most 100 characters' : null) : null },
      { field: 'barcode', error: barcode ? (String(barcode).length > 100 ? 'Barcode must be at most 100 characters' : null) : null }
    ]);

    if (errors) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    // Check duplicate SKU or Barcode in company
    if (sku && String(sku).trim() !== '') {
      const existingSku = await Product.findOne({
        where: { company_id: companyId, sku: String(sku).trim(), is_active: 1 }
      });
      if (existingSku) {
        return res.status(400).json({ error: `Product with SKU "${sku}" already exists.` });
      }
    }

    if (barcode && String(barcode).trim() !== '') {
      const existingBarcode = await Product.findOne({
        where: { company_id: companyId, barcode: String(barcode).trim(), is_active: 1 }
      });
      if (existingBarcode) {
        return res.status(400).json({ error: `Product with Barcode "${barcode}" already exists.` });
      }
    }

    // Resolve tax_id fallback
    let finalTaxId = tax_id ? parseInt(tax_id) : null;
    if (!finalTaxId) {
      let defaultTax = await Tax.findOne({ where: { company_id: companyId, rate: 0 } });
      if (!defaultTax) {
        defaultTax = await Tax.findOne({ where: { company_id: companyId } });
      }
      if (!defaultTax) {
        defaultTax = await Tax.create({
          company_id: companyId,
          name: 'GST 0% (Exempt)',
          rate: 0,
          is_active: 1
        });
      }
      finalTaxId = defaultTax.id;
    }

    const product = await Product.create({
      company_id: companyId,
      category_id: parseInt(category_id),
      brand_id: brand_id ? parseInt(brand_id) : null,
      unit_id: parseInt(unit_id),
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      sku: sku && String(sku).trim() !== '' ? String(sku).trim() : null,
      barcode: barcode && String(barcode).trim() !== '' ? String(barcode).trim() : null,
      tax_id: finalTaxId,
      purchase_price: parseFloat(purchase_price),
      selling_price: parseFloat(selling_price),
      min_stock_level: parseInt(min_stock_level) || 0,
      reorder_quantity: parseInt(reorder_quantity) || 0,
      is_active: 1
    });

    // Auto-create initial stock batch so product is immediately billable at POS
    const initialQty = parseInt(req.body.initial_stock) || 100;
    try {
      await Stock.create({
        company_id: companyId,
        product_id: product.id,
        batch_number: 'BATCH-001',
        quantity: initialQty,
        value: initialQty * parseFloat(purchase_price),
        reorder_flag: 0
      });
    } catch (stockErr) {
      console.warn('Initial stock creation note:', stockErr.message);
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(400).json({ error: error.message || 'Failed to create product' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.session.companyId;
    const updateData = req.body;

    // Server-side validation
    const errors = buildErrors([
      { field: 'name', error: updateData.name !== undefined ? validateRequired(updateData.name, 'Product name') : null },
      { field: 'purchase_price', error: updateData.purchase_price !== undefined ? validatePositive(updateData.purchase_price, 'Purchase price') : null },
      { field: 'selling_price', error: updateData.selling_price !== undefined ? validatePositive(updateData.selling_price, 'Selling price') : null }
    ]);

    if (errors) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    const product = await Product.findOne({
      where: { id, company_id: companyId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check duplicate SKU or Barcode excluding current product
    if (updateData.sku && String(updateData.sku).trim() !== '') {
      const existingSku = await Product.findOne({
        where: {
          company_id: companyId,
          sku: String(updateData.sku).trim(),
          id: { [Op.ne]: id },
          is_active: 1
        }
      });
      if (existingSku) {
        return res.status(400).json({ error: `Another product with SKU "${updateData.sku}" already exists.` });
      }
    }

    if (updateData.barcode && String(updateData.barcode).trim() !== '') {
      const existingBarcode = await Product.findOne({
        where: {
          company_id: companyId,
          barcode: String(updateData.barcode).trim(),
          id: { [Op.ne]: id },
          is_active: 1
        }
      });
      if (existingBarcode) {
        return res.status(400).json({ error: `Another product with Barcode "${updateData.barcode}" already exists.` });
      }
    }

    if (updateData.name) updateData.name = String(updateData.name).trim();
    if (updateData.sku !== undefined) updateData.sku = updateData.sku && String(updateData.sku).trim() !== '' ? String(updateData.sku).trim() : null;
    if (updateData.barcode !== undefined) updateData.barcode = updateData.barcode && String(updateData.barcode).trim() !== '' ? String(updateData.barcode).trim() : null;
    if (updateData.category_id) updateData.category_id = parseInt(updateData.category_id);
    if (updateData.brand_id !== undefined) updateData.brand_id = updateData.brand_id ? parseInt(updateData.brand_id) : null;
    if (updateData.unit_id) updateData.unit_id = parseInt(updateData.unit_id);
    if (updateData.tax_id !== undefined) updateData.tax_id = updateData.tax_id ? parseInt(updateData.tax_id) : product.tax_id;
    if (updateData.purchase_price !== undefined) updateData.purchase_price = parseFloat(updateData.purchase_price);
    if (updateData.selling_price !== undefined) updateData.selling_price = parseFloat(updateData.selling_price);
    if (updateData.min_stock_level !== undefined) updateData.min_stock_level = parseInt(updateData.min_stock_level) || 0;
    if (updateData.reorder_quantity !== undefined) updateData.reorder_quantity = parseInt(updateData.reorder_quantity) || 0;

    await product.update(updateData);
    res.json({ success: true, product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(400).json({ error: error.message || 'Failed to update product' });
  }
};

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

exports.getCustomers = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const customers = await Customer.findAndCountAll({
      where: {
        company_id: companyId,
        is_active: 1,
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } }
        ]
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(customers);
    }

    res.render('admin/master/customers', { 
      customers: customers.rows, 
      total: customers.count,
      page: parseInt(page),
      limit: parseInt(limit),
      user: req.user 
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const {
      name, phone, email, address, city, state, postal_code,
      gstin, credit_limit, customer_type
    } = req.body;
    const companyId = req.session.companyId;

    // Server-side validation
    const errors = buildErrors([
      { field: 'name', error: validateRequired(name, 'Customer name') },
      { field: 'email', error: validateEmail(email) },
      { field: 'phone', error: validatePhone(phone) },
      { field: 'gstin', error: validateGSTIN(gstin) },
      { field: 'postal_code', error: validatePincode(postal_code) },
      { field: 'credit_limit', error: credit_limit ? validatePositive(credit_limit, 'Credit limit') : null }
    ]);

    if (errors) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    const customer = await Customer.create({
      company_id: companyId,
      name,
      phone,
      email,
      address,
      city,
      state,
      postal_code,
      gstin,
      credit_limit: parseFloat(credit_limit || 0),
      customer_type: customer_type || 'retail',
      is_active: 1
    });

    res.json({ success: true, customer });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.session.companyId;
    const updateData = req.body;

    // Server-side validation
    const errors = buildErrors([
      { field: 'name', error: updateData.name !== undefined ? validateRequired(updateData.name, 'Customer name') : null },
      { field: 'email', error: validateEmail(updateData.email) },
      { field: 'phone', error: validatePhone(updateData.phone) },
      { field: 'gstin', error: validateGSTIN(updateData.gstin) },
      { field: 'postal_code', error: validatePincode(updateData.postal_code) },
      { field: 'credit_limit', error: updateData.credit_limit ? validatePositive(updateData.credit_limit, 'Credit limit') : null }
    ]);

    if (errors) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    const customer = await Customer.findOne({
      where: { id, company_id: companyId }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await customer.update(updateData);
    res.json({ success: true, customer });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ============================================
// SUPPLIER MANAGEMENT
// ============================================

exports.getSuppliers = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const suppliers = await Supplier.findAndCountAll({
      where: {
        company_id: companyId,
        is_active: 1,
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } }
        ]
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(suppliers);
    }

    res.render('admin/master/suppliers', { 
      suppliers: suppliers.rows, 
      total: suppliers.count,
      page: parseInt(page),
      limit: parseInt(limit),
      user: req.user 
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const {
      name, phone, email, address, city, state, postal_code,
      gstin, pan, bank_name, bank_account, ifsc_code, payment_terms
    } = req.body;
    const companyId = req.session.companyId;

    // Server-side validation
    const errors = buildErrors([
      { field: 'name', error: validateRequired(name, 'Supplier name') },
      { field: 'email', error: validateEmail(email) },
      { field: 'phone', error: validatePhone(phone) },
      { field: 'gstin', error: validateGSTIN(gstin) },
      { field: 'pan', error: validatePAN(pan) },
      { field: 'postal_code', error: validatePincode(postal_code) }
    ]);

    if (errors) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    const supplier = await Supplier.create({
      company_id: companyId,
      name,
      phone,
      email,
      address,
      city,
      state,
      postal_code,
      gstin,
      pan,
      bank_name,
      bank_account,
      ifsc_code,
      payment_terms,
      is_active: 1
    });

    res.json({ success: true, supplier });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.session.companyId;
    const updateData = req.body;

    // Server-side validation
    const errors = buildErrors([
      { field: 'name', error: updateData.name !== undefined ? validateRequired(updateData.name, 'Supplier name') : null },
      { field: 'email', error: validateEmail(updateData.email) },
      { field: 'phone', error: validatePhone(updateData.phone) },
      { field: 'gstin', error: validateGSTIN(updateData.gstin) },
      { field: 'pan', error: validatePAN(updateData.pan) },
      { field: 'postal_code', error: validatePincode(updateData.postal_code) }
    ]);

    if (errors) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    const supplier = await Supplier.findOne({
      where: { id, company_id: companyId }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    await supplier.update(updateData);
    res.json({ success: true, supplier });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ============================================
// UNIT MANAGEMENT
// ============================================

exports.getUnits = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const units = await Unit.findAll({
      where: { company_id: companyId, is_active: 1 }
    });
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(units);
    }
    
    res.render('admin/master/units', { units, user: req.user });
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// TAX MANAGEMENT
// ============================================

exports.getTaxes = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const taxes = await Tax.findAll({
      where: { company_id: companyId, is_active: 1 }
    });
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(taxes);
    }
    
    res.render('admin/master/taxes', { taxes, user: req.user });
  } catch (error) {
    console.error('Error fetching taxes:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// PAYMENT MODE MANAGEMENT
// ============================================

exports.getPaymentModes = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const paymentModes = await PaymentMode.findAll({
      where: { company_id: companyId, is_active: 1 }
    });
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(paymentModes);
    }
    
    res.render('admin/master/payment-modes', { paymentModes, user: req.user });
  } catch (error) {
    console.error('Error fetching payment modes:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// UNIT CREATE / UPDATE
// ============================================

exports.createUnit = async (req, res) => {
  try {
    const { name, abbreviation } = req.body;
    const companyId = req.session.companyId;

    const errors = buildErrors([
      { field: 'name', error: validateRequired(name, 'Unit name') }
    ]);
    if (errors) return res.status(400).json({ error: 'Validation failed', errors });

    const unit = await Unit.create({
      company_id: companyId,
      name: String(name).trim(),
      abbreviation: abbreviation ? String(abbreviation).trim() : null,
      is_active: 1
    });

    res.json({ success: true, unit });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, abbreviation } = req.body;
    const companyId = req.session.companyId;

    const errors = buildErrors([
      { field: 'name', error: name !== undefined ? validateRequired(name, 'Unit name') : null }
    ]);
    if (errors) return res.status(400).json({ error: 'Validation failed', errors });

    const unit = await Unit.findOne({ where: { id, company_id: companyId } });
    if (!unit) return res.status(404).json({ error: 'Unit not found' });

    await unit.update({ name: String(name).trim(), abbreviation: abbreviation ? String(abbreviation).trim() : null });
    res.json({ success: true, unit });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ============================================
// TAX CREATE / UPDATE
// ============================================

exports.createTax = async (req, res) => {
  try {
    const { name, rate } = req.body;
    const companyId = req.session.companyId;

    const errors = buildErrors([
      { field: 'name', error: validateRequired(name, 'Tax name') },
      { field: 'rate', error: validateRequired(rate, 'Tax rate') },
      { field: 'rate', error: rate !== undefined && (isNaN(parseFloat(rate)) || parseFloat(rate) < 0) ? 'Tax rate must be 0 or greater' : null }
    ]);
    if (errors) return res.status(400).json({ error: 'Validation failed', errors });

    const tax = await Tax.create({
      company_id: companyId,
      name: String(name).trim(),
      rate: parseFloat(rate),
      is_active: 1
    });

    res.json({ success: true, tax });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateTax = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rate } = req.body;
    const companyId = req.session.companyId;

    const errors = buildErrors([
      { field: 'name', error: name !== undefined ? validateRequired(name, 'Tax name') : null },
      { field: 'rate', error: rate !== undefined && (isNaN(parseFloat(rate)) || parseFloat(rate) < 0) ? 'Tax rate must be 0 or greater' : null }
    ]);
    if (errors) return res.status(400).json({ error: 'Validation failed', errors });

    const tax = await Tax.findOne({ where: { id, company_id: companyId } });
    if (!tax) return res.status(404).json({ error: 'Tax not found' });

    const updateData = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (rate !== undefined) updateData.rate = parseFloat(rate);

    await tax.update(updateData);
    res.json({ success: true, tax });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ============================================
// PAYMENT MODE CREATE / UPDATE
// ============================================

exports.createPaymentMode = async (req, res) => {
  try {
    const { name } = req.body;
    const companyId = req.session.companyId;

    const errors = buildErrors([
      { field: 'name', error: validateRequired(name, 'Payment mode name') }
    ]);
    if (errors) return res.status(400).json({ error: 'Validation failed', errors });

    const paymentMode = await PaymentMode.create({
      company_id: companyId,
      name: String(name).trim(),
      is_active: 1
    });

    res.json({ success: true, paymentMode });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updatePaymentMode = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body;
    const companyId = req.session.companyId;

    const errors = buildErrors([
      { field: 'name', error: name !== undefined ? validateRequired(name, 'Payment mode name') : null }
    ]);
    if (errors) return res.status(400).json({ error: 'Validation failed', errors });

    const paymentMode = await PaymentMode.findOne({ where: { id, company_id: companyId } });
    if (!paymentMode) return res.status(404).json({ error: 'Payment mode not found' });

    const updateData = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (is_active !== undefined) updateData.is_active = is_active ? 1 : 0;

    await paymentMode.update(updateData);
    res.json({ success: true, paymentMode });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
