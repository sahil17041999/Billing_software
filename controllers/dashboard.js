// Dashboard Controller
const { sequelize } = require('../config/database');
const { Sale, Purchase, Stock, Product, Customer, Supplier, Expense, StockLedger } = require('../models');
const { Op } = require('sequelize');

// Get dashboard data
exports.getDashboard = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    // Sales Summary (Today, This Month, Last Month)
    const [todaySales] = await sequelize.query(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(grand_total), 0) as total,
        COALESCE(SUM(tax_amount), 0) as tax
      FROM sales
      WHERE company_id = ? AND DATE(invoice_date) = CURDATE()
      AND sales_status = 'completed'
    `, { replacements: [companyId] });

    const [monthSales] = await sequelize.query(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(grand_total), 0) as total,
        COALESCE(SUM(tax_amount), 0) as tax
      FROM sales
      WHERE company_id = ? AND MONTH(invoice_date) = MONTH(NOW())
      AND YEAR(invoice_date) = YEAR(NOW())
      AND sales_status = 'completed'
    `, { replacements: [companyId] });

    // Purchase Summary
    const [todayPurchase] = await sequelize.query(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(grand_total), 0) as total,
        COALESCE(SUM(tax_amount), 0) as tax
      FROM purchases
      WHERE company_id = ? AND DATE(purchase_date) = CURDATE()
      AND purchase_status = 'received'
    `, { replacements: [companyId] });

    const [monthPurchase] = await sequelize.query(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(grand_total), 0) as total,
        COALESCE(SUM(tax_amount), 0) as tax
      FROM purchases
      WHERE company_id = ? AND MONTH(purchase_date) = MONTH(NOW())
      AND YEAR(purchase_date) = YEAR(NOW())
      AND purchase_status = 'received'
    `, { replacements: [companyId] });

    // Stock Summary
    const [stockSummary] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT product_id) as total_products,
        COALESCE(SUM(quantity), 0) as total_quantity,
        COALESCE(SUM(value), 0) as total_value
      FROM stock
      WHERE company_id = ?
    `, { replacements: [companyId] });

    // Low Stock Alert
    const lowStockProducts = await sequelize.query(`
      SELECT 
        p.id, p.name, c.name as category,
        s.quantity, p.min_stock_level
      FROM stock s
      JOIN products p ON s.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE s.company_id = ? AND s.quantity <= p.min_stock_level
      ORDER BY s.quantity ASC
      LIMIT 10
    `, { replacements: [companyId], type: sequelize.QueryTypes.SELECT });

    // Expiry Alert
    const expiryProducts = await sequelize.query(`
      SELECT 
        p.id, p.name, c.name as category,
        s.batch_number, s.expiry_date, s.quantity
      FROM stock s
      JOIN products p ON s.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE s.company_id = ? 
      AND s.expiry_date IS NOT NULL
      AND s.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      AND s.quantity > 0
      ORDER BY s.expiry_date ASC
      LIMIT 10
    `, { replacements: [companyId], type: sequelize.QueryTypes.SELECT });

    // Customer Outstanding
    const customerOutstanding = await sequelize.query(`
      SELECT 
        c.id, c.name, c.outstanding_amount,
        COUNT(s.id) as total_invoices
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id
      WHERE c.company_id = ? AND c.outstanding_amount > 0
      GROUP BY c.id, c.name
      ORDER BY c.outstanding_amount DESC
      LIMIT 5
    `, { replacements: [companyId], type: sequelize.QueryTypes.SELECT });

    // Supplier Outstanding
    const supplierOutstanding = await sequelize.query(`
      SELECT 
        s.id, s.name, s.outstanding_amount,
        COUNT(p.id) as total_invoices
      FROM suppliers s
      LEFT JOIN purchases p ON s.id = p.supplier_id
      WHERE s.company_id = ? AND s.outstanding_amount > 0
      GROUP BY s.id, s.name
      ORDER BY s.outstanding_amount DESC
      LIMIT 5
    `, { replacements: [companyId], type: sequelize.QueryTypes.SELECT });

    // Profit Summary
    const [profitSummary] = await sequelize.query(`
      SELECT 
        COALESCE(SUM(s.grand_total), 0) as total_sales,
        COALESCE(SUM(p.grand_total), 0) as total_purchase,
        COALESCE(SUM(e.amount), 0) as total_expenses,
        COALESCE(SUM(s.grand_total), 0) - COALESCE(SUM(p.grand_total), 0) - COALESCE(SUM(e.amount), 0) as profit
      FROM sales s
      LEFT JOIN purchases p ON MONTH(p.purchase_date) = MONTH(NOW())
      LEFT JOIN expenses e ON MONTH(e.expense_date) = MONTH(NOW())
      WHERE s.company_id = ? AND MONTH(s.invoice_date) = MONTH(NOW())
      AND YEAR(s.invoice_date) = YEAR(NOW())
      AND s.sales_status = 'completed'
    `, { replacements: [companyId] });

    // Recent Transactions
    const recentSales = await sequelize.query(`
      SELECT 
        s.id, s.invoice_number, s.invoice_date, s.grand_total,
        c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.company_id = ?
      ORDER BY s.invoice_date DESC
      LIMIT 10
    `, { replacements: [companyId], type: sequelize.QueryTypes.SELECT });

    res.render('admin/dashboard', {
      user: req.user,
      todaySales: todaySales[0],
      monthSales: monthSales[0],
      todayPurchase: todayPurchase[0],
      monthPurchase: monthPurchase[0],
      stockSummary: stockSummary[0],
      lowStockProducts,
      expiryProducts,
      customerOutstanding,
      supplierOutstanding,
      profitSummary: profitSummary[0],
      recentSales
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { error: error.message });
  }
};

// API: Get dashboard data
exports.apiGetDashboard = async (req, res) => {
  try {
    const companyId = req.session.companyId;

    const [todaySales] = await sequelize.query(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(grand_total), 0) as total
      FROM sales
      WHERE company_id = ? AND DATE(invoice_date) = CURDATE()
    `, { replacements: [companyId] });

    const [monthSales] = await sequelize.query(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(grand_total), 0) as total
      FROM sales
      WHERE company_id = ? AND MONTH(invoice_date) = MONTH(NOW())
      AND YEAR(invoice_date) = YEAR(NOW())
    `, { replacements: [companyId] });

    const [stockSummary] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT product_id) as total_products,
        COALESCE(SUM(quantity), 0) as total_quantity,
        COALESCE(SUM(value), 0) as total_value
      FROM stock
      WHERE company_id = ?
    `, { replacements: [companyId] });

    res.json({
      todaySales: todaySales[0],
      monthSales: monthSales[0],
      stockSummary: stockSummary[0]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
