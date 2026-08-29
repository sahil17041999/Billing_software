// Ledger Controllers - Customer and Supplier Ledger Reports
const { CustomerLedger, SupplierLedger, Customer, Supplier, Sale, Purchase, Payment, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get Customer Ledger
exports.getCustomerLedger = async (req, res) => {
  try {
    const { customerId, page = 1, limit = 50, fromDate = '', toDate = '' } = req.query;
    const offset = (page - 1) * limit;
    const companyId = req.session.companyId;

    if (!customerId) {
      return res.render('admin/ledger/customer-ledger', {
        ledger: [],
        total: 0,
        page: 1,
        totalPages: 1,
        currentBalance: 0,
        user: req.user
      });
    }

    const where = { company_id: companyId, customer_id: customerId };

    if (fromDate || toDate) {
      where.transaction_date = {};
      if (fromDate) where.transaction_date[Op.gte] = new Date(fromDate);
      if (toDate) where.transaction_date[Op.lte] = new Date(toDate);
    }

    const ledger = await CustomerLedger.findAndCountAll({
      where,
      include: [
        { association: 'customer', model: Customer, attributes: ['name', 'email', 'phone'] },
        { association: 'creator', model: User, attributes: ['username'] }
      ],
      offset,
      limit: parseInt(limit),
      order: [['transaction_date', 'DESC']]
    });

    // Calculate running balance
    const allLedgers = await CustomerLedger.findAll({
      where: { company_id: companyId, customer_id: customerId },
      order: [['transaction_date', 'ASC']]
    });

    let runningBalance = 0;
    const enrichedLedgers = allLedgers.map(entry => {
      runningBalance += parseFloat(entry.debit_amount) - parseFloat(entry.credit_amount);
      return {
        ...entry.toJSON(),
        runningBalance
      };
    });

    if (req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        data: ledger.rows,
        total: ledger.count,
        page: parseInt(page),
        totalPages: Math.ceil(ledger.count / limit),
        currentBalance: runningBalance
      });
    }

    res.render('admin/ledger/customer-ledger', {
      ledger: ledger.rows,
      total: ledger.count,
      page: parseInt(page),
      totalPages: Math.ceil(ledger.count / limit),
      currentBalance: runningBalance,
      user: req.user
    });
  } catch (error) {
    console.error('Get Customer Ledger Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Customer Ledger Summary
exports.getCustomerLedgerSummary = async (req, res) => {
  try {
    const { customerId } = req.query;
    const companyId = req.session.companyId;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const ledger = await CustomerLedger.findAll({
      where: { company_id: companyId, customer_id: customerId },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('debit_amount')), 'totalDebit'],
        [sequelize.fn('SUM', sequelize.col('credit_amount')), 'totalCredit']
      ],
      raw: true
    });

    const totalDebit = parseFloat(ledger[0]?.totalDebit || 0);
    const totalCredit = parseFloat(ledger[0]?.totalCredit || 0);
    const balance = totalDebit - totalCredit;

    res.json({
      success: true,
      data: {
        totalDebit,
        totalCredit,
        balance
      }
    });
  } catch (error) {
    console.error('Get Customer Ledger Summary Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Supplier Ledger
exports.getSupplierLedger = async (req, res) => {
  try {
    const { supplierId, page = 1, limit = 50, fromDate = '', toDate = '' } = req.query;
    const offset = (page - 1) * limit;
    const companyId = req.session.companyId;

    if (!supplierId) {
      return res.render('admin/ledger/supplier-ledger', {
        ledger: [],
        total: 0,
        page: 1,
        totalPages: 1,
        currentBalance: 0,
        user: req.user
      });
    }

    const where = { company_id: companyId, supplier_id: supplierId };

    if (fromDate || toDate) {
      where.transaction_date = {};
      if (fromDate) where.transaction_date[Op.gte] = new Date(fromDate);
      if (toDate) where.transaction_date[Op.lte] = new Date(toDate);
    }

    const ledger = await SupplierLedger.findAndCountAll({
      where,
      include: [
        { association: 'supplier', model: Supplier, attributes: ['name', 'email', 'phone'] },
        { association: 'creator', model: User, attributes: ['username'] }
      ],
      offset,
      limit: parseInt(limit),
      order: [['transaction_date', 'DESC']]
    });

    // Calculate running balance
    const allLedgers = await SupplierLedger.findAll({
      where: { company_id: companyId, supplier_id: supplierId },
      order: [['transaction_date', 'ASC']]
    });

    let runningBalance = 0;
    const enrichedLedgers = allLedgers.map(entry => {
      runningBalance += parseFloat(entry.debit_amount) - parseFloat(entry.credit_amount);
      return {
        ...entry.toJSON(),
        runningBalance
      };
    });

    if (req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        data: ledger.rows,
        total: ledger.count,
        page: parseInt(page),
        totalPages: Math.ceil(ledger.count / limit),
        currentBalance: runningBalance
      });
    }

    res.render('admin/ledger/supplier-ledger', {
      ledger: ledger.rows,
      total: ledger.count,
      page: parseInt(page),
      totalPages: Math.ceil(ledger.count / limit),
      currentBalance: runningBalance,
      user: req.user
    });
  } catch (error) {
    console.error('Get Supplier Ledger Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Supplier Ledger Summary
exports.getSupplierLedgerSummary = async (req, res) => {
  try {
    const { supplierId } = req.query;
    const companyId = req.session.companyId;

    if (!supplierId) {
      return res.status(400).json({ error: 'Supplier ID is required' });
    }

    const ledger = await SupplierLedger.findAll({
      where: { company_id: companyId, supplier_id: supplierId },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('debit_amount')), 'totalDebit'],
        [sequelize.fn('SUM', sequelize.col('credit_amount')), 'totalCredit']
      ],
      raw: true
    });

    const totalDebit = parseFloat(ledger[0]?.totalDebit || 0);
    const totalCredit = parseFloat(ledger[0]?.totalCredit || 0);
    const balance = totalDebit - totalCredit;

    res.json({
      success: true,
      data: {
        totalDebit,
        totalCredit,
        balance
      }
    });
  } catch (error) {
    console.error('Get Supplier Ledger Summary Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get All Customer Outstanding
exports.getCustomerOutstanding = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const companyId = req.session.companyId;

    const outstandings = await Customer.findAll({
      where: { company_id: companyId, outstanding_amount: { [Op.gt]: 0 } },
      attributes: [
        'id',
        'name',
        'email',
        'phone',
        'outstanding_amount',
        'credit_limit',
        [sequelize.literal('(credit_limit - outstanding_amount)'), 'available_credit']
      ],
      offset,
      limit: parseInt(limit),
      order: [['outstanding_amount', 'DESC']]
    });

    const count = await Customer.count({
      where: { company_id: companyId, outstanding_amount: { [Op.gt]: 0 } }
    });

    res.json({
      success: true,
      data: outstandings,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Get Customer Outstanding Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get All Supplier Outstanding
exports.getSupplierOutstanding = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const companyId = req.session.companyId;

    const outstandings = await Supplier.findAll({
      where: { company_id: companyId, outstanding_amount: { [Op.gt]: 0 } },
      attributes: [
        'id',
        'name',
        'email',
        'phone',
        'outstanding_amount'
      ],
      offset,
      limit: parseInt(limit),
      order: [['outstanding_amount', 'DESC']]
    });

    const count = await Supplier.count({
      where: { company_id: companyId, outstanding_amount: { [Op.gt]: 0 } }
    });

    res.json({
      success: true,
      data: outstandings,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Get Supplier Outstanding Error:', error);
    res.status(500).json({ error: error.message });
  }
};
