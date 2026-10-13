// Purchase Management Controller
const { Purchase, PurchaseDetail, Supplier, Product, Stock, StockLedger, sequelize } = require('../models');
const { Op } = require('sequelize');

// Generate unique purchase number
const generatePurchaseNumber = async (companyId) => {
  const lastPurchase = await Purchase.findOne({
    where: { company_id: companyId },
    order: [['id', 'DESC']]
  });

  const nextNumber = (lastPurchase?.id || 0) + 1;
  return `PO-${new Date().getFullYear()}-${String(nextNumber).padStart(6, '0')}`;
};

// Get all purchases
exports.getPurchases = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const { page = 1, limit = 20, status = '', search = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = { company_id: companyId };
    if (status) where.purchase_status = status;
    if (search) where.purchase_number = { [Op.like]: `%${search}%` };

    const purchases = await Purchase.findAndCountAll({
      where,
      include: [{ as: 'supplier', model: Supplier }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['purchase_date', 'DESC']]
    });

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(purchases);
    }

    res.render('admin/purchase/list', {
      purchases: purchases.rows,
      total: purchases.count,
      page: parseInt(page),
      limit: parseInt(limit),
      user: req.user
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).render('error', { error: error.message });
  }
};

// Get purchase form
exports.getPurchaseForm = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const suppliers = await Supplier.findAll({
      where: { company_id: companyId, is_active: 1 }
    });

    const products = await Product.findAll({
      where: { company_id: companyId, is_active: 1 },
      include: [
        { association: 'category', model: require('../models').Category },
        { association: 'tax', model: require('../models').Tax }
      ]
    });

    res.render('admin/purchase/form', {
      suppliers,
      products,
      user: req.user,
      purchaseData: null
    });
  } catch (error) {
    console.error('Error loading purchase form:', error);
    res.status(500).render('error', { error: error.message });
  }
};

// Create purchase
exports.createPurchase = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const companyId = req.session.companyId;
    const userId = req.session.userId;
    const { supplier_id, purchase_date, invoice_number, items } = req.body;

    // Server-side validation
    if (!supplier_id) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Supplier is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'At least one item is required' });
    }

    if (purchase_date && isNaN(Date.parse(purchase_date))) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid purchase date' });
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_id) {
        await transaction.rollback();
        return res.status(400).json({ error: `Item ${i + 1}: Product is required` });
      }
      const qty = parseInt(item.quantity);
      const price = parseFloat(item.unit_price);
      if (!qty || qty <= 0) {
        await transaction.rollback();
        return res.status(400).json({ error: `Item ${i + 1}: Quantity must be greater than 0` });
      }
      if (!price || price <= 0) {
        await transaction.rollback();
        return res.status(400).json({ error: `Item ${i + 1}: Unit price must be greater than 0` });
      }
    }

    // Calculate totals
    let totalAmount = 0;
    let totalTax = 0;
    let discountAmount = 0;

    items.forEach(item => {
      const lineTotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
      const itemDiscount = parseFloat(item.discount_amount || 0);
      const taxableAmount = lineTotal - itemDiscount;
      const taxAmount = (taxableAmount * parseFloat(item.tax_rate || 0)) / 100;

      totalAmount += taxableAmount;
      totalTax += taxAmount;
      discountAmount += itemDiscount;
    });

    const grandTotal = totalAmount + totalTax;

    // Create purchase order
    const purchaseNumber = await generatePurchaseNumber(companyId);

    const purchase = await Purchase.create({
      company_id: companyId,
      supplier_id,
      purchase_number: purchaseNumber,
      purchase_date: new Date(purchase_date),
      invoice_number,
      total_amount: totalAmount,
      tax_amount: totalTax,
      discount_amount: discountAmount,
      grand_total: grandTotal,
      purchase_status: 'confirmed',
      payment_status: 'pending',
      created_by: userId
    }, { transaction });

    // Create purchase details
    for (const item of items) {
      await PurchaseDetail.create({
        purchase_id: purchase.id,
        product_id: item.product_id,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price),
        discount_percent: parseFloat(item.discount_percent || 0),
        discount_amount: parseFloat(item.discount_amount || 0),
        tax_amount: (parseFloat(item.quantity) * parseFloat(item.unit_price) * parseFloat(item.tax_rate || 0)) / 100,
        line_total: parseFloat(item.quantity) * parseFloat(item.unit_price) * (1 + parseFloat(item.tax_rate || 0) / 100),
        batch_number: item.batch_number,
        expiry_date: item.expiry_date ? new Date(item.expiry_date) : null
      }, { transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Purchase created successfully',
      purchase_id: purchase.id,
      purchase_number: purchaseNumber
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error creating purchase:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get purchase details
exports.getPurchaseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.session.companyId;

    const purchase = await Purchase.findOne({
      where: { id, company_id: companyId },
      include: [
        { as: 'supplier', model: Supplier },
        {
          as: 'purchaseDetails',
          model: PurchaseDetail,
          include: [{ as: 'product', model: Product }]
        }
      ]
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    res.json(purchase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Receive purchase stock
exports.receivePurchaseStock = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { items } = req.body;
    const companyId = req.session.companyId;
    const userId = req.session.userId;

    const purchase = await Purchase.findOne({
      where: { id, company_id: companyId },
      include: [{ association: 'purchaseDetails', model: PurchaseDetail }],
      transaction
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    // Update stock for each item
    for (const item of items) {
      const detail = purchase.purchaseDetails.find(d => d.id === item.detail_id);

      if (!detail) continue;

      const receivedQty = parseInt(item.received_quantity || detail.quantity);

      // Find or create stock entry
      let stock = await Stock.findOne({
        where: {
          company_id: companyId,
          product_id: detail.product_id,
          batch_number: detail.batch_number
        },
        transaction
      });

      if (!stock) {
        stock = await Stock.create({
          company_id: companyId,
          product_id: detail.product_id,
          quantity: receivedQty,
          batch_number: detail.batch_number,
          expiry_date: detail.expiry_date,
          value: receivedQty * detail.unit_price
        }, { transaction });
      } else {
        await stock.update({
          quantity: stock.quantity + receivedQty,
          value: stock.value + (receivedQty * detail.unit_price)
        }, { transaction });
      }

      // Create stock ledger entry
      await StockLedger.create({
        company_id: companyId,
        product_id: detail.product_id,
        transaction_type: 'in',
        quantity: receivedQty,
        opening_stock: stock.quantity - receivedQty,
        closing_stock: stock.quantity,
        reference_type: 'purchase',
        reference_id: purchase.id,
        batch_number: detail.batch_number,
        created_by: userId
      }, { transaction });

      // Update received quantity
      await detail.update({ received_quantity: receivedQty }, { transaction });
    }

    // Update purchase status
    await purchase.update({
      purchase_status: 'received'
    }, { transaction });

    await transaction.commit();

    res.json({ success: true, message: 'Stock received successfully' });

  } catch (error) {
    await transaction.rollback();
    console.error('Error receiving stock:', error);
    res.status(400).json({ error: error.message });
  }
};

// Update purchase payment
exports.updatePurchasePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;
    const companyId = req.session.companyId;

    const purchase = await Purchase.findOne({
      where: { id, company_id: companyId }
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    await purchase.update({ payment_status });
    res.json({ success: true, purchase });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
