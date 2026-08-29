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
// CENTRALIZED DUPLICATE CHECK API (For jQuery Validation & Realtime Checks)
// ============================================
exports.checkDuplicate = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const q = req.query || {};
    const b = req.body || {};
    const entity = (q.entity || b.entity || '').toLowerCase().trim();
    const field = (q.field || b.field || '').toLowerCase().trim();
    const id = q.id || b.id || null;

    let value = q.value !== undefined ? q.value : b.value;
    if (value === undefined && field && q[field] !== undefined) {
      value = q[field];
    } else if (value === undefined && field && b[field] !== undefined) {
      value = b[field];
    }

    if (!value || String(value).trim() === '') {
      return res.json(true);
    }
    const cleanValue = String(value).trim();

    let model = null;
    let fieldCol = field;
    let entityLabel = entity;
    let fieldLabel = field;

    switch (entity) {
      case 'category':
        model = Category;
        entityLabel = 'Category';
        fieldLabel = 'name';
        fieldCol = 'name';
        break;
      case 'brand':
        model = Brand;
        entityLabel = 'Brand';
        fieldLabel = 'name';
        fieldCol = 'name';
        break;
      case 'unit':
        model = Unit;
        entityLabel = 'Unit';
        if (field === 'abbreviation' || field === 'short_name') {
          fieldCol = 'short_name';
          fieldLabel = 'symbol / abbreviation';
        } else {
          fieldCol = 'name';
          fieldLabel = 'name';
        }
        break;
      case 'product':
        model = Product;
        entityLabel = 'Product';
        if (field === 'barcode') { fieldCol = 'barcode'; fieldLabel = 'barcode'; }
        else if (field === 'sku') { fieldCol = 'sku'; fieldLabel = 'SKU'; }
        else { fieldCol = 'name'; fieldLabel = 'name'; }
        break;
      case 'customer':
        model = Customer;
        entityLabel = 'Customer';
        if (field === 'phone') { fieldCol = 'phone'; fieldLabel = 'phone number'; }
        else if (field === 'email') { fieldCol = 'email'; fieldLabel = 'email address'; }
        else { fieldCol = 'name'; fieldLabel = 'name'; }
        break;
      case 'supplier':
        model = Supplier;
        entityLabel = 'Supplier';
        if (field === 'phone') { fieldCol = 'phone'; fieldLabel = 'phone number'; }
        else if (field === 'email') { fieldCol = 'email'; fieldLabel = 'email address'; }
        else if (field === 'gstin') { fieldCol = 'gstin'; fieldLabel = 'GSTIN'; }
        else { fieldCol = 'name'; fieldLabel = 'name'; }
        break;
      case 'tax':
        model = Tax;
        entityLabel = 'Tax rate';
        fieldLabel = 'label/name';
        fieldCol = 'name';
        break;
      case 'payment_mode':
      case 'paymentmode':
      case 'payment-mode':
        model = PaymentMode;
        entityLabel = 'Payment mode';
        fieldLabel = 'name';
        fieldCol = 'name';
        break;
      default:
        return res.json(true);
    }

    const whereClause = {
      company_id: companyId
    };
    whereClause[fieldCol] = { [Op.like]: cleanValue };
    if (model.rawAttributes && model.rawAttributes.is_active) {
      whereClause.is_active = 1;
    }

    if (id) {
      whereClause.id = { [Op.ne]: id };
    }

    const existing = await model.findOne({ where: whereClause });
    if (existing) {
      return res.json(`${entityLabel} with this ${fieldLabel} "${cleanValue}" already exists in the database.`);
    }

    return res.json(true);
  } catch (error) {
    console.error('Check duplicate error:', error);
    return res.json(true);
  }
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

    const trimmedName = String(name || '').trim();
    if (!trimmedName) return res.status(400).json({ error: 'Category name is required' });

    // Enforce uniqueness within company
    const existingCategory = await Category.findOne({
      where: {
        company_id: companyId,
        name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmedName.toLowerCase())
      }
    });
    if (existingCategory) {
      return res.status(400).json({ error: `Category with name "${trimmedName}" already exists in the database.` });
    }

    const category = await Category.create({
      company_id: companyId,
      name: trimmedName,
      description: description ? String(description).trim() : null,
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

    const updatePayload = {};
    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) return res.status(400).json({ error: 'Category name cannot be empty' });

      const existingCategory = await Category.findOne({
        where: {
          company_id: companyId,
          id: { [Op.ne]: id },
          name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmedName.toLowerCase())
        }
      });
      if (existingCategory) {
        return res.status(400).json({ error: `Another category with name "${trimmedName}" already exists in the database.` });
      }
      updatePayload.name = trimmedName;
    }
    if (description !== undefined) {
      updatePayload.description = description ? String(description).trim() : null;
    }

    await category.update(updatePayload);
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

    const trimmedName = String(name || '').trim();
    if (!trimmedName) return res.status(400).json({ error: 'Brand name is required' });

    // Enforce uniqueness within company
    const existingBrand = await Brand.findOne({
      where: {
        company_id: companyId,
        name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmedName.toLowerCase())
      }
    });
    if (existingBrand) {
      return res.status(400).json({ error: `Brand with name "${trimmedName}" already exists in the database.` });
    }

    const brand = await Brand.create({
      company_id: companyId,
      name: trimmedName,
      description: description ? String(description).trim() : null,
      is_active: 1
    });

    res.json({ success: true, brand });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const companyId = req.session.companyId;

    const brand = await Brand.findOne({ where: { id, company_id: companyId } });
    if (!brand) return res.status(404).json({ error: 'Brand not found' });

    const updatePayload = {};
    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) return res.status(400).json({ error: 'Brand name cannot be empty' });

      const existingBrand = await Brand.findOne({
        where: {
          company_id: companyId,
          id: { [Op.ne]: id },
          name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmedName.toLowerCase())
        }
      });
      if (existingBrand) {
        return res.status(400).json({ error: `Another brand with name "${trimmedName}" already exists in the database.` });
      }
      updatePayload.name = trimmedName;
    }
    if (description !== undefined) {
      updatePayload.description = description ? String(description).trim() : null;
    }

    await brand.update(updatePayload);
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
        return res.status(400).json({ error: `Product with SKU "${sku}" already exists in the database.` });
      }
    }

    if (barcode && String(barcode).trim() !== '') {
      const existingBarcode = await Product.findOne({
        where: { company_id: companyId, barcode: String(barcode).trim(), is_active: 1 }
      });
      if (existingBarcode) {
        return res.status(400).json({ error: `Product with Barcode "${barcode}" already exists in the database.` });
      }
    }

    const trimmedProductName = String(name).trim();
    const existingName = await Product.findOne({
      where: {
        company_id: companyId,
        name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmedProductName.toLowerCase()),
        is_active: 1
      }
    });
    if (existingName) {
      return res.status(400).json({ error: `Product with title "${trimmedProductName}" already exists in the database.` });
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
      name: trimmedProductName,
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

    // Check duplicate SKU or Barcode or Name excluding current product
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
        return res.status(400).json({ error: `Another product with SKU "${updateData.sku}" already exists in the database.` });
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
        return res.status(400).json({ error: `Another product with Barcode "${updateData.barcode}" already exists in the database.` });
      }
    }

    if (updateData.name && String(updateData.name).trim() !== '') {
      const trimmedUpdateName = String(updateData.name).trim();
      const existingName = await Product.findOne({
        where: {
          company_id: companyId,
          name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmedUpdateName.toLowerCase()),
          id: { [Op.ne]: id },
          is_active: 1
        }
      });
      if (existingName) {
        return res.status(400).json({ error: `Another product with title "${trimmedUpdateName}" already exists in the database.` });
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

    // Check duplicate phone or email in company
    const cleanPhone = phone ? String(phone).trim() : null;
    if (cleanPhone) {
      const existingPhone = await Customer.findOne({
        where: { company_id: companyId, phone: cleanPhone, is_active: 1 }
      });
      if (existingPhone) {
        return res.status(400).json({ error: `Customer with mobile number "${cleanPhone}" already exists in the database.` });
      }
    }

    const cleanEmail = email ? String(email).trim() : null;
    if (cleanEmail) {
      const existingEmail = await Customer.findOne({
        where: {
          company_id: companyId,
          email: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), cleanEmail.toLowerCase()),
          is_active: 1
        }
      });
      if (existingEmail) {
        return res.status(400).json({ error: `Customer with email "${cleanEmail}" already exists in the database.` });
      }
    }

    const customer = await Customer.create({
      company_id: companyId,
      name: String(name).trim(),
      phone: cleanPhone,
      email: cleanEmail,
      address: address ? String(address).trim() : null,
      city: city ? String(city).trim() : null,
      state: state ? String(state).trim() : null,
      postal_code: postal_code ? String(postal_code).trim() : null,
      gstin: gstin ? String(gstin).trim().toUpperCase() : null,
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

    // Check duplicate phone or email excluding current customer
    if (updateData.phone && String(updateData.phone).trim() !== '') {
      const cleanPhone = String(updateData.phone).trim();
      const existingPhone = await Customer.findOne({
        where: {
          company_id: companyId,
          phone: cleanPhone,
          id: { [Op.ne]: id },
          is_active: 1
        }
      });
      if (existingPhone) {
        return res.status(400).json({ error: `Another customer with mobile number "${cleanPhone}" already exists in the database.` });
      }
    }

    if (updateData.email && String(updateData.email).trim() !== '') {
      const cleanEmail = String(updateData.email).trim();
      const existingEmail = await Customer.findOne({
        where: {
          company_id: companyId,
          email: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), cleanEmail.toLowerCase()),
          id: { [Op.ne]: id },
          is_active: 1
        }
      });
      if (existingEmail) {
        return res.status(400).json({ error: `Another customer with email "${cleanEmail}" already exists in the database.` });
      }
    }

    if (updateData.name) updateData.name = String(updateData.name).trim();
    if (updateData.phone !== undefined) updateData.phone = updateData.phone ? String(updateData.phone).trim() : null;
    if (updateData.email !== undefined) updateData.email = updateData.email ? String(updateData.email).trim() : null;
    if (updateData.gstin !== undefined) updateData.gstin = updateData.gstin ? String(updateData.gstin).trim().toUpperCase() : null;

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

    // Check duplicate phone, email, gstin, or name in company
    const trimmedName = String(name || '').trim();
    if (trimmedName) {
      const existingName = await Supplier.findOne({
        where: {
          company_id: companyId,
          name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmedName.toLowerCase()),
          is_active: 1
        }
      });
      if (existingName) {
        return res.status(400).json({ error: `Supplier with name "${trimmedName}" already exists in the database.` });
      }
    }

    const cleanPhone = phone ? String(phone).trim() : null;
    if (cleanPhone) {
      const existingPhone = await Supplier.findOne({
        where: { company_id: companyId, phone: cleanPhone, is_active: 1 }
      });
      if (existingPhone) {
        return res.status(400).json({ error: `Supplier with phone number "${cleanPhone}" already exists in the database.` });
      }
    }

    const cleanEmail = email ? String(email).trim() : null;
    if (cleanEmail) {
      const existingEmail = await Supplier.findOne({
        where: {
          company_id: companyId,
          email: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), cleanEmail.toLowerCase()),
          is_active: 1
        }
      });
      if (existingEmail) {
        return res.status(400).json({ error: `Supplier with email "${cleanEmail}" already exists in the database.` });
      }
    }

    const cleanGstin = gstin ? String(gstin).trim().toUpperCase() : null;
    if (cleanGstin) {
      const existingGstin = await Supplier.findOne({
        where: { company_id: companyId, gstin: cleanGstin, is_active: 1 }
      });
      if (existingGstin) {
        return res.status(400).json({ error: `Supplier with GSTIN "${cleanGstin}" already exists in the database.` });
      }
    }

    const supplier = await Supplier.create({
      company_id: companyId,
      name: trimmedName,
      phone: cleanPhone,
      email: cleanEmail,
      address: address ? String(address).trim() : null,
      city: city ? String(city).trim() : null,
      state: state ? String(state).trim() : null,
      postal_code: postal_code ? String(postal_code).trim() : null,
      gstin: cleanGstin,
      pan: pan ? String(pan).trim().toUpperCase() : null,
      bank_name: bank_name ? String(bank_name).trim() : null,
      bank_account: bank_account ? String(bank_account).trim() : null,
      ifsc_code: ifsc_code ? String(ifsc_code).trim() : null,
      payment_terms: payment_terms ? String(payment_terms).trim() : null,
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

    // Check duplicate name, phone, email, or gstin excluding current supplier
    if (updateData.name && String(updateData.name).trim() !== '') {
      const trimmedName = String(updateData.name).trim();
      const existingName = await Supplier.findOne({
        where: {
          company_id: companyId,
          name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmedName.toLowerCase()),
          id: { [Op.ne]: id },
          is_active: 1
        }
      });
      if (existingName) {
        return res.status(400).json({ error: `Another supplier with name "${trimmedName}" already exists in the database.` });
      }
    }

    if (updateData.phone && String(updateData.phone).trim() !== '') {
      const cleanPhone = String(updateData.phone).trim();
      const existingPhone = await Supplier.findOne({
        where: {
          company_id: companyId,
          phone: cleanPhone,
          id: { [Op.ne]: id },
          is_active: 1
        }
      });
      if (existingPhone) {
        return res.status(400).json({ error: `Another supplier with phone number "${cleanPhone}" already exists in the database.` });
      }
    }

    if (updateData.email && String(updateData.email).trim() !== '') {
      const cleanEmail = String(updateData.email).trim();
      const existingEmail = await Supplier.findOne({
        where: {
          company_id: companyId,
          email: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), cleanEmail.toLowerCase()),
          id: { [Op.ne]: id },
          is_active: 1
        }
      });
      if (existingEmail) {
        return res.status(400).json({ error: `Another supplier with email "${cleanEmail}" already exists in the database.` });
      }
    }

    if (updateData.gstin && String(updateData.gstin).trim() !== '') {
      const cleanGstin = String(updateData.gstin).trim().toUpperCase();
      const existingGstin = await Supplier.findOne({
        where: {
          company_id: companyId,
          gstin: cleanGstin,
          id: { [Op.ne]: id },
          is_active: 1
        }
      });
      if (existingGstin) {
        return res.status(400).json({ error: `Another supplier with GSTIN "${cleanGstin}" already exists in the database.` });
      }
    }

    if (updateData.name) updateData.name = String(updateData.name).trim();
    if (updateData.phone !== undefined) updateData.phone = updateData.phone ? String(updateData.phone).trim() : null;
    if (updateData.email !== undefined) updateData.email = updateData.email ? String(updateData.email).trim() : null;
    if (updateData.gstin !== undefined) updateData.gstin = updateData.gstin ? String(updateData.gstin).trim().toUpperCase() : null;
    if (updateData.pan !== undefined) updateData.pan = updateData.pan ? String(updateData.pan).trim().toUpperCase() : null;

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
    const { name, abbreviation, short_name } = req.body;
    const companyId = req.session.companyId;

    const errors = buildErrors([
      { field: 'name', error: validateRequired(name, 'Unit name') }
    ]);
    if (errors) return res.status(400).json({ error: 'Validation failed', errors });

    const trimmedName = String(name).trim();
    const finalShortName = (short_name || abbreviation || trimmedName).toString().trim().slice(0, 10);

    // Check duplicate name or short_name in company
    const existingName = await Unit.findOne({
      where: {
        company_id: companyId,
        name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmedName.toLowerCase())
      }
    });
    if (existingName) {
      return res.status(400).json({ error: `Unit with name "${trimmedName}" already exists in the database.` });
    }

    const existingShort = await Unit.findOne({
      where: {
        company_id: companyId,
        short_name: sequelize.where(sequelize.fn('LOWER', sequelize.col('short_name')), finalShortName.toLowerCase())
      }
    });
    if (existingShort) {
      return res.status(400).json({ error: `Unit with symbol / abbreviation "${finalShortName}" already exists in the database.` });
    }

    const unit = await Unit.create({
      company_id: companyId,
      name: trimmedName,
      short_name: finalShortName,
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
    const { name, abbreviation, short_name } = req.body;
    const companyId = req.session.companyId;

    const errors = buildErrors([
      { field: 'name', error: name !== undefined ? validateRequired(name, 'Unit name') : null }
    ]);
    if (errors) return res.status(400).json({ error: 'Validation failed', errors });

    const unit = await Unit.findOne({ where: { id, company_id: companyId } });
    if (!unit) return res.status(404).json({ error: 'Unit not found' });

    const updatePayload = {};
    if (name !== undefined) {
      const trimmedName = String(name).trim();
      const existingName = await Unit.findOne({
        where: {
          company_id: companyId,
          id: { [Op.ne]: id },
          name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmedName.toLowerCase())
        }
      });
      if (existingName) {
        return res.status(400).json({ error: `Another unit with name "${trimmedName}" already exists in the database.` });
      }
      updatePayload.name = trimmedName;
    }
    if (short_name !== undefined || abbreviation !== undefined) {
      const source = short_name || abbreviation || updatePayload.name || unit.name;
      const targetShort = source.toString().trim().slice(0, 10);
      const existingShort = await Unit.findOne({
        where: {
          company_id: companyId,
          id: { [Op.ne]: id },
          short_name: sequelize.where(sequelize.fn('LOWER', sequelize.col('short_name')), targetShort.toLowerCase())
        }
      });
      if (existingShort) {
        return res.status(400).json({ error: `Another unit with symbol / abbreviation "${targetShort}" already exists in the database.` });
      }
      updatePayload.short_name = targetShort;
    }

    await unit.update(updatePayload);
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

    const trimmedName = String(name).trim();
    const existingTax = await Tax.findOne({
      where: {
        company_id: companyId,
        name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmedName.toLowerCase())
      }
    });
    if (existingTax) {
      return res.status(400).json({ error: `Tax rate with label "${trimmedName}" already exists in the database.` });
    }

    const tax = await Tax.create({
      company_id: companyId,
      name: trimmedName,
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
    if (name !== undefined) {
      const trimmedName = String(name).trim();
      const existingTax = await Tax.findOne({
        where: {
          company_id: companyId,
          id: { [Op.ne]: id },
          name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmedName.toLowerCase())
        }
      });
      if (existingTax) {
        return res.status(400).json({ error: `Another tax rate with label "${trimmedName}" already exists in the database.` });
      }
      updateData.name = trimmedName;
    }
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

    const trimmedName = String(name).trim();
    const existingMode = await PaymentMode.findOne({
      where: {
        company_id: companyId,
        name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmedName.toLowerCase())
      }
    });
    if (existingMode) {
      return res.status(400).json({ error: `Payment mode with name "${trimmedName}" already exists in the database.` });
    }

    const paymentMode = await PaymentMode.create({
      company_id: companyId,
      name: trimmedName,
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
    if (name !== undefined) {
      const trimmedName = String(name).trim();
      const existingMode = await PaymentMode.findOne({
        where: {
          company_id: companyId,
          id: { [Op.ne]: id },
          name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmedName.toLowerCase())
        }
      });
      if (existingMode) {
        return res.status(400).json({ error: `Another payment mode with name "${trimmedName}" already exists in the database.` });
      }
      updateData.name = trimmedName;
    }
    if (is_active !== undefined) updateData.is_active = is_active ? 1 : 0;

    await paymentMode.update(updateData);
    res.json({ success: true, paymentMode });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
