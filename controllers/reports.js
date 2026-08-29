// Reports Controller - All Reports
const { Sale, Purchase, Stock, Product, Customer, Supplier, Expense, DayEndClosing, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper to construct exact DATE-level filtering
const buildDateFilter = (colName, fromDate, toDate) => {
  const conditions = [];
  if (fromDate) {
    conditions.push(sequelize.where(sequelize.fn('DATE', sequelize.col(colName)), '>=', fromDate));
  }
  if (toDate) {
    conditions.push(sequelize.where(sequelize.fn('DATE', sequelize.col(colName)), '<=', toDate));
  }
  return conditions;
};

// Sales Report Page
exports.getSalesReport = async (req, res) => {
  try {
    // Check if API request
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      const { fromDate = '', toDate = '', groupBy = 'daily' } = req.query;
      const companyId = req.session.companyId;

      const andClauses = [{ company_id: companyId, sales_status: 'completed' }];
      const dateConds = buildDateFilter('created_at', fromDate, toDate);
      if (dateConds.length) andClauses.push(...dateConds);

      const where = { [Op.and]: andClauses };

      let groupAttribute;
      switch (groupBy) {
        case 'daily':
          groupAttribute = sequelize.fn('DATE', sequelize.col('created_at'));
          break;
        case 'weekly':
          groupAttribute = sequelize.fn('WEEK', sequelize.col('created_at'));
          break;
        case 'monthly':
          groupAttribute = sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m');
          break;
        default:
          groupAttribute = sequelize.fn('DATE', sequelize.col('created_at'));
      }

      const report = await Sale.findAll({
        where,
        attributes: [
          [groupAttribute, 'period'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('total_amount')), 'subtotal'],
          [sequelize.fn('SUM', sequelize.col('tax_amount')), 'tax'],
          [sequelize.fn('SUM', sequelize.col('discount_amount')), 'discount'],
          [sequelize.fn('SUM', sequelize.col('grand_total')), 'total']
        ],
        group: [groupAttribute],
        order: [[groupAttribute, 'DESC']],
        raw: true
      });

      return res.json({
        success: true,
        data: report
      });
    }
    
    res.render('admin/reports/sales', { user: req.user });
  } catch (error) {
    console.error('Sales Report Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Purchase Report Page
exports.getPurchaseReport = async (req, res) => {
  try {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      const { fromDate = '', toDate = '', groupBy = 'daily' } = req.query;
      const companyId = req.session.companyId;

      const andClauses = [{ company_id: companyId, purchase_status: { [Op.ne]: 'cancelled' } }];
      const dateConds = buildDateFilter('created_at', fromDate, toDate);
      if (dateConds.length) andClauses.push(...dateConds);

      const where = { [Op.and]: andClauses };

      let groupAttribute;
      switch (groupBy) {
        case 'daily':
          groupAttribute = sequelize.fn('DATE', sequelize.col('created_at'));
          break;
        case 'weekly':
          groupAttribute = sequelize.fn('WEEK', sequelize.col('created_at'));
          break;
        case 'monthly':
          groupAttribute = sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m');
          break;
        default:
          groupAttribute = sequelize.fn('DATE', sequelize.col('created_at'));
      }

      const report = await Purchase.findAll({
        where,
        attributes: [
          [groupAttribute, 'period'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('total_amount')), 'subtotal'],
          [sequelize.fn('SUM', sequelize.col('tax_amount')), 'tax'],
          [sequelize.fn('SUM', sequelize.col('discount_amount')), 'discount'],
          [sequelize.fn('SUM', sequelize.col('grand_total')), 'total']
        ],
        group: [groupAttribute],
        order: [[groupAttribute, 'DESC']],
        raw: true
      });

      return res.json({
        success: true,
        data: report
      });
    }
    
    res.render('admin/reports/purchase', { user: req.user });
  } catch (error) {
    console.error('Purchase Report Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Stock Report Page
exports.getStockReport = async (req, res) => {
  try {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      const companyId = req.session.companyId;

      const report = await Stock.findAll({
        where: { company_id: companyId },
        include: [
          {
            as: 'product',
            model: Product,
            attributes: ['id', 'name', 'sku', 'min_stock_level', 'purchase_price', 'selling_price']
          }
        ],
        attributes: [
          'id',
          'quantity',
          [sequelize.literal('quantity * product.purchase_price'), 'stock_value_cost'],
          [sequelize.literal('quantity * product.selling_price'), 'stock_value_retail']
        ],
        order: [['quantity', 'DESC']]
      });

      // Calculate summary
      const totalValue = await Stock.sum(
        sequelize.literal('quantity * (SELECT purchase_price FROM products WHERE products.id = stock.product_id)'),
        { where: { company_id: companyId } }
      );

      return res.json({
        success: true,
        data: report,
        summary: {
          totalProducts: report.length,
          totalValue: totalValue || 0
        }
      });
    }
    
    res.render('admin/reports/stock', { user: req.user });
  } catch (error) {
    console.error('Stock Report Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Profit & Loss Report Page
exports.getProfitLossReport = async (req, res) => {
  try {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      const { fromDate = '', toDate = '' } = req.query;
      const companyId = req.session.companyId;

      const saleConds = [{ company_id: companyId, sales_status: 'completed' }, ...buildDateFilter('created_at', fromDate, toDate)];
      const sales = await Sale.findOne({
        where: { [Op.and]: saleConds },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('grand_total')), 'total']
        ],
        raw: true
      });

      const purchaseConds = [{ company_id: companyId, purchase_status: { [Op.ne]: 'cancelled' } }, ...buildDateFilter('created_at', fromDate, toDate)];
      const purchases = await Purchase.findOne({
        where: { [Op.and]: purchaseConds },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('grand_total')), 'total']
        ],
        raw: true
      });

      const expenseConds = [{ company_id: companyId }, ...buildDateFilter('payment_date', fromDate, toDate)];
      const expenses = await Expense.sum('amount', { where: { [Op.and]: expenseConds } });

      const revenue = parseFloat(sales?.total || 0);
      const cost = parseFloat(purchases?.total || 0);
      const expenseAmount = parseFloat(expenses || 0);
      const profit = revenue - cost - expenseAmount;

      return res.json({
        success: true,
        data: {
          revenue,
          cost,
          expenses: expenseAmount,
          profit,
          profitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0
        }
      });
    }
    
    res.render('admin/reports/profit-loss', { user: req.user });
  } catch (error) {
    console.error('Profit Loss Report Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Expense Report Page
exports.getExpenseReport = async (req, res) => {
  try {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      const { fromDate = '', toDate = '', category = '' } = req.query;
      const companyId = req.session.companyId;

      const andClauses = [{ company_id: companyId }];
      if (category) andClauses.push({ category });
      const dateConds = buildDateFilter('payment_date', fromDate, toDate);
      if (dateConds.length) andClauses.push(...dateConds);

      const where = { [Op.and]: andClauses };

      const report = await Expense.findAll({
        where,
        attributes: [
          'category',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'total']
        ],
        group: ['category'],
        raw: true
      });

      const grandTotal = await Expense.sum('amount', { where });

      return res.json({
        success: true,
        data: report,
        summary: {
          grandTotal: grandTotal || 0
        }
      });
    }
    
    res.render('admin/reports/expense', { user: req.user });
  } catch (error) {
    console.error('Expense Report Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Cashier Report Page
exports.getCashierReport = async (req, res) => {
  try {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      const { fromDate = '', toDate = '', cashierId = '' } = req.query;
      const companyId = req.session.companyId;

      const andClauses = [{ company_id: companyId, sales_status: 'completed' }];
      if (cashierId) andClauses.push({ cashier_id: cashierId });
      const dateConds = buildDateFilter('created_at', fromDate, toDate);
      if (dateConds.length) andClauses.push(...dateConds);

      const where = { [Op.and]: andClauses };

      const report = await Sale.findAll({
        where,
        attributes: [
          'cashier_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'transactions'],
          [sequelize.fn('SUM', sequelize.col('grand_total')), 'total'],
          [sequelize.fn('SUM', sequelize.col('tax_amount')), 'tax']
        ],
        include: [
          {
            association: 'cashier',
            model: User,
            attributes: ['id', 'username', 'first_name', 'last_name'],
            required: false
          }
        ],
        group: ['cashier_id'],
        raw: true,
        nest: true
      });

      return res.json({
        success: true,
        data: report
      });
    }
    
    res.render('admin/reports/cashier', { user: req.user });
  } catch (error) {
    console.error('Cashier Report Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Day End Report Page
exports.getDayEndReport = async (req, res) => {
  try {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      const { fromDate = '', toDate = '' } = req.query;
      const companyId = req.session.companyId;

      const andClauses = [{ company_id: companyId }];
      const dateConds = buildDateFilter('closing_date', fromDate, toDate);
      if (dateConds.length) andClauses.push(...dateConds);

      const where = { [Op.and]: andClauses };

      const report = await DayEndClosing.findAll({
        where,
        include: [
          {
            association: 'closed_by_user',
            model: User,
            attributes: ['username', 'first_name', 'last_name']
          }
        ],
        order: [['closing_date', 'DESC']]
      });

      return res.json({
        success: true,
        data: report
      });
    }
    
    res.render('admin/reports/day-end', { user: req.user });
  } catch (error) {
    console.error('Day End Report Error:', error);
    res.status(500).json({ error: error.message });
  }
};