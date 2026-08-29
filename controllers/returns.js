// Returns Management Controller
const { SalesReturn, SalesReturnDetail, Sale, SalesDetail, Product, Stock, StockLedger, User, Customer, Supplier, Purchase, PurchaseReturn, PurchaseReturnDetail, PurchaseDetail, sequelize } = require('../models');
const { Op } = require('sequelize');

// Generate Return Number
const generateReturnNumber = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 100000);
  return `RET-${year}-${randomNum.toString().padStart(6, '0')}`;
};

// Get Sales Returns
exports.getSalesReturns = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = { company_id: req.session.companyId };
    if (search) {
      where[Op.or] = [
        { return_number: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status) where.return_status = status;

    const returns = await SalesReturn.findAndCountAll({
      where,
      include: [
        { association: 'creator', model: User, attributes: ['username'] },
        { 
          association: 'sale', 
          model: Sale, 
          attributes: ['id', 'invoice_number'],
          include: [{ association: 'customer', model: Customer, attributes: ['id', 'name', 'phone'] }]
        }
      ],
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    // Populate customer property for template compatibility
    const formattedRows = returns.rows.map(r => {
      const plain = r.get({ plain: true });
      plain.customer = plain.sale && plain.sale.customer ? plain.sale.customer : null;
      plain.status = plain.return_status || 'completed';
      plain.net_amount = plain.total_amount || 0;
      return plain;
    });

    if (req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        data: formattedRows,
        total: returns.count,
        page: parseInt(page),
        totalPages: Math.ceil(returns.count / limit)
      });
    }

    res.render('admin/returns/sales-returns', {
      returns: formattedRows,
      total: returns.count,
      page: parseInt(page),
      totalPages: Math.ceil(returns.count / limit),
      user: req.user
    });
  } catch (error) {
    console.error('Get Sales Returns Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Sales Return Form
exports.getSalesReturnForm = async (req, res) => {
  try {
    const { saleId } = req.query;
    
    let sale = null;
    if (saleId) {
      sale = await Sale.findByPk(saleId, {
        include: [
          { association: 'customer', model: Customer },
          { association: 'salesDetails', model: SalesDetail, include: [
            { association: 'product', model: Product }
          ]}
        ]
      });
    }

    res.render('admin/returns/sales-return-form', { sale, user: req.user });
  } catch (error) {
    console.error('Get Sales Return Form Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create Sales Return
exports.createSalesReturn = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { sale_id, return_details } = req.body;
    const companyId = req.session.companyId;

    // Validate sale exists
    const sale = await Sale.findOne({
      where: { id: sale_id, company_id: companyId }
    });

    if (!sale) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Sale not found' });
    }

    // Calculate totals
    let totalAmount = 0, totalTax = 0;
    for (const detail of return_details) {
      const qty = parseFloat(detail.return_quantity) || 0;
      const price = parseFloat(detail.unit_price) || 0;
      const taxRate = parseFloat(detail.tax_percent) || 0;
      const subtotal = qty * price;
      const taxAmt = (subtotal * taxRate) / 100;
      totalAmount += (subtotal + taxAmt);
      totalTax += taxAmt;
    }
    
    // Create return record
    const salesReturn = await SalesReturn.create({
      company_id: companyId,
      sales_id: sale.id,
      return_number: generateReturnNumber(),
      return_date: new Date(),
      total_amount: totalAmount,
      tax_amount: totalTax,
      return_reason: req.body.reason || 'Customer Return',
      return_status: 'completed',
      created_by: req.session.userId
    }, { transaction });

    // Create return details and restore stock
    for (const detail of return_details) {
      const qty = parseFloat(detail.return_quantity) || 0;
      const price = parseFloat(detail.unit_price) || 0;

      await SalesReturnDetail.create({
        return_id: salesReturn.id,
        product_id: detail.product_id,
        quantity: qty,
        unit_price: price,
        reason_code: 'customer_return'
      }, { transaction });

      // Add stock back
      await Stock.increment('quantity', {
        by: qty,
        where: { product_id: detail.product_id, company_id: companyId },
        transaction
      });

      // Stock ledger entry
      await StockLedger.create({
        company_id: companyId,
        product_id: detail.product_id,
        transaction_type: 'in',
        reference_type: 'sales_return',
        reference_id: salesReturn.id,
        opening_stock: 0,
        transaction_quantity: qty,
        closing_stock: 0,
        batch_number: detail.batch_number || null,
        notes: `Sales Return - ${salesReturn.return_number}`,
        created_by: req.session.userId
      }, { transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Sales return created successfully and stock updated',
      data: salesReturn
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create Sales Return Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Approve Sales Return
exports.approveSalesReturn = async (req, res) => {
  try {
    const { returnId } = req.params;
    const companyId = req.session.companyId;

    const salesReturn = await SalesReturn.findOne({
      where: { id: returnId, company_id: companyId }
    });

    if (!salesReturn) {
      return res.status(400).json({ error: 'Return not found' });
    }

    await salesReturn.update({
      return_status: 'approved'
    });

    res.json({
      success: true,
      message: 'Sales return approved',
      data: salesReturn
    });
  } catch (error) {
    console.error('Approve Sales Return Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Purchase Returns
exports.getPurchaseReturns = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = { company_id: req.session.companyId };
    if (search) {
      where[Op.or] = [
        { return_number: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status) where.return_status = status;

    const returns = await PurchaseReturn.findAndCountAll({
      where,
      include: [
        { association: 'creator', model: User, attributes: ['username'] },
        { 
          association: 'purchase', 
          model: Purchase, 
          attributes: ['id', 'purchase_number'],
          include: [{ association: 'supplier', model: Supplier, attributes: ['id', 'name', 'phone'] }]
        }
      ],
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    // Populate supplier property for template compatibility
    const formattedRows = returns.rows.map(r => {
      const plain = r.get({ plain: true });
      plain.supplier = plain.purchase && plain.purchase.supplier ? plain.purchase.supplier : null;
      plain.status = plain.return_status || 'completed';
      plain.net_amount = plain.total_amount || 0;
      return plain;
    });

    if (req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        data: formattedRows,
        total: returns.count,
        page: parseInt(page),
        totalPages: Math.ceil(returns.count / limit)
      });
    }

    res.render('admin/returns/purchase-returns', {
      returns: formattedRows,
      total: returns.count,
      page: parseInt(page),
      totalPages: Math.ceil(returns.count / limit),
      user: req.user
    });
  } catch (error) {
    console.error('Get Purchase Returns Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Purchase Return Form
exports.getPurchaseReturnForm = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const { purchaseId } = req.query;

    let purchase = null;
    if (purchaseId) {
      purchase = await Purchase.findOne({
        where: { id: purchaseId, company_id: companyId },
        include: [
          { association: 'supplier', model: Supplier },
          {
            association: 'purchaseDetails',
            model: PurchaseDetail,
            include: [{ association: 'product', model: Product }]
          }
        ]
      });
    }

    // Load recent purchases for selection
    const recentPurchases = await Purchase.findAll({
      where: { company_id: companyId },
      include: [{ association: 'supplier', model: Supplier }],
      order: [['created_at', 'DESC']],
      limit: 50
    });

    res.render('admin/returns/purchase-return-form', {
      purchase,
      recentPurchases,
      user: req.user
    });
  } catch (error) {
    console.error('Get Purchase Return Form Error:', error);
    res.status(500).render('error', { error: error.message });
  }
};

// Create Purchase Return
exports.createPurchaseReturn = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { purchase_id, return_details } = req.body;
    const companyId = req.session.companyId;

    const purchase = await Purchase.findOne({
      where: { id: purchase_id, company_id: companyId }
    });

    if (!purchase) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Purchase not found' });
    }

    let totalAmount = 0, totalTax = 0;
    for (const detail of return_details) {
      const qty = parseFloat(detail.return_quantity) || 0;
      const cost = parseFloat(detail.unit_cost || detail.unit_price) || 0;
      const subtotal = qty * cost;
      totalAmount += subtotal;
    }
    
    const purchaseReturn = await PurchaseReturn.create({
      company_id: companyId,
      purchase_id: purchase.id,
      return_number: generateReturnNumber(),
      return_date: new Date(),
      total_amount: totalAmount,
      tax_amount: totalTax,
      return_reason: req.body.reason || 'Supplier Return',
      return_status: 'completed',
      created_by: req.session.userId
    }, { transaction });

    for (const detail of return_details) {
      const qty = parseFloat(detail.return_quantity) || 0;
      const cost = parseFloat(detail.unit_cost || detail.unit_price) || 0;

      await PurchaseReturnDetail.create({
        return_id: purchaseReturn.id,
        product_id: detail.product_id,
        quantity: qty,
        unit_price: cost,
        reason_code: 'supplier_return'
      }, { transaction });

      // Deduct stock
      await Stock.decrement('quantity', {
        by: qty,
        where: { product_id: detail.product_id, company_id: companyId },
        transaction
      });

      await StockLedger.create({
        company_id: companyId,
        product_id: detail.product_id,
        transaction_type: 'out',
        reference_type: 'purchase_return',
        reference_id: purchaseReturn.id,
        opening_stock: 0,
        transaction_quantity: qty,
        closing_stock: 0,
        batch_number: detail.batch_number || null,
        notes: `Purchase Return - ${purchaseReturn.return_number}`,
        created_by: req.session.userId
      }, { transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Purchase return created successfully and stock updated',
      data: purchaseReturn
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create Purchase Return Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Approve Purchase Return
exports.approvePurchaseReturn = async (req, res) => {
  try {
    const { returnId } = req.params;
    const companyId = req.session.companyId;

    const purchaseReturn = await PurchaseReturn.findOne({
      where: { id: returnId, company_id: companyId }
    });

    if (!purchaseReturn) {
      return res.status(400).json({ error: 'Return not found' });
    }

    await purchaseReturn.update({
      return_status: 'approved'
    });

    res.json({
      success: true,
      message: 'Purchase return approved',
      data: purchaseReturn
    });
  } catch (error) {
    console.error('Approve Purchase Return Error:', error);
    res.status(500).json({ error: error.message });
  }
};

