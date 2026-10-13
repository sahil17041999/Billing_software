// Day End Closing Controller
const { DayEndClosing, Sale, Expense, User, Payment, PaymentMode, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get Day End Closings
exports.getClosings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = { company_id: req.session.companyId };
    if (status) where.status = status;

    const closings = await DayEndClosing.findAndCountAll({
      where,
      include: [
        { model: User, as: 'cashier', attributes: ['username', 'first_name', 'last_name'], required: false }
      ],
      offset,
      limit: parseInt(limit),
      order: [['closing_date', 'DESC']]
    });

    if (req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        data: closings.rows,
        total: closings.count,
        page: parseInt(page),
        totalPages: Math.ceil(closings.count / limit)
      });
    }

    res.render('admin/day-end/closings', {
      closings: closings.rows,
      total: closings.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(closings.count / limit),
      user: req.user
    });
  } catch (error) {
    console.error('Get Closings Error:', error);
    res.status(500).render('error', { error: error.message });
  }
};

// Start Day End Closing
exports.startClosing = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const cashierId = req.session.userId;

    // Check if a closing already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingClosing = await DayEndClosing.findOne({
      where: {
        company_id: companyId,
        closing_date: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    if (existingClosing && existingClosing.status === 'closed') {
      return res.status(400).json({ error: 'Closing has already been completed for today' });
    }

    if (existingClosing) {
      return res.json({
        success: true,
        message: 'Closing session already active',
        data: existingClosing
      });
    }

    // Get opening cash (from yesterday's closing or 0)
    let openingCash = 0;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);

    const lastClosing = await DayEndClosing.findOne({
      where: {
        company_id: companyId,
        closing_date: {
          [Op.gte]: yesterday,
          [Op.lt]: yesterdayEnd
        }
      },
      order: [['created_at', 'DESC']]
    });

    if (lastClosing) {
      openingCash = parseFloat(lastClosing.actual_cash || 0);
    }

    const closing = await DayEndClosing.create({
      company_id: companyId,
      closing_date: new Date(),
      closed_by: cashierId || null,
      opening_cash: openingCash,
      status: 'open'
    });

    res.json({
      success: true,
      message: 'Day end closing started',
      data: closing
    });
  } catch (error) {
    console.error('Start Closing Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Closing Form
exports.getClosingForm = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let closing = await DayEndClosing.findOne({
      where: {
        company_id: companyId,
        status: { [Op.ne]: 'closed' },
        closing_date: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    if (!closing) {
      let openingCash = 0;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);

      const lastClosing = await DayEndClosing.findOne({
        where: {
          company_id: companyId,
          closing_date: { [Op.gte]: yesterday, [Op.lt]: yesterdayEnd }
        },
        order: [['created_at', 'DESC']]
      });

      if (lastClosing) {
        openingCash = parseFloat(lastClosing.actual_cash || 0);
      }

      closing = await DayEndClosing.create({
        company_id: companyId,
        closing_date: new Date(),
        closed_by: req.session.userId || null,
        opening_cash: openingCash,
        status: 'open'
      });
    }

    // Calculate sales payments by mode
    const payments = await Payment.findAll({
      where: {
        company_id: companyId,
        transaction_type: 'sales_payment',
        payment_date: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      },
      include: [
        { model: PaymentMode, as: 'paymentMode', required: false }
      ]
    });

    const totalSalesSum = await Sale.sum('grand_total', {
      where: {
        company_id: companyId,
        sales_status: 'completed',
        invoice_date: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    }) || 0;

    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;
    let chequeSales = 0;
    let creditSales = 0;

    payments.forEach(p => {
      const modeName = (p.paymentMode?.name || '').toLowerCase();
      const amt = parseFloat(p.amount || 0);
      if (modeName.includes('cash')) {
        cashSales += amt;
      } else if (modeName.includes('upi') || modeName.includes('qr') || modeName.includes('gpay') || modeName.includes('phonepe')) {
        upiSales += amt;
      } else if (modeName.includes('card') || modeName.includes('debit') || modeName.includes('credit card')) {
        cardSales += amt;
      } else if (modeName.includes('cheque')) {
        chequeSales += amt;
      } else if (modeName.includes('credit') || modeName.includes('ledger')) {
        creditSales += amt;
      } else {
        cashSales += amt;
      }
    });

    const paymentsTotal = cashSales + upiSales + cardSales + chequeSales + creditSales;
    if (totalSalesSum > paymentsTotal && payments.length === 0) {
      cashSales = totalSalesSum;
    }

    // Expenses for today (using expense_date without invalid status column)
    const expenses = await Expense.sum('amount', {
      where: {
        company_id: companyId,
        expense_date: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    }) || 0;

    const breakdown = {
      cash_sales: cashSales,
      upi_sales: upiSales,
      card_sales: cardSales,
      cheque_sales: chequeSales,
      credit_sales: creditSales,
      total_sales: totalSalesSum,
      expenses: expenses
    };

    if (req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        data: {
          closing,
          breakdown,
          expenses
        }
      });
    }

    res.render('admin/day-end/closing-form', { closing, breakdown, expenses, user: req.user });
  } catch (error) {
    console.error('Get Closing Form Error:', error);
    res.status(500).render('error', { error: error.message });
  }
};

// Update Closing
exports.updateClosing = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cash_sales,
      upi_sales,
      card_sales,
      cash_expenses,
      cash_withdrawal,
      actual_cash,
      difference_reason,
      remarks
    } = req.body;
    const companyId = req.session.companyId;

    const closing = await DayEndClosing.findOne({
      where: { id, company_id: companyId }
    });

    if (!closing) {
      return res.status(404).json({ error: 'Closing record not found' });
    }

    const expectedCash = parseFloat(closing.opening_cash || 0) + parseFloat(cash_sales || 0) - parseFloat(cash_expenses || 0) - parseFloat(cash_withdrawal || 0);
    const cashDifference = parseFloat(actual_cash || 0) - expectedCash;

    await closing.update({
      cash_sales: parseFloat(cash_sales || 0),
      upi_sales: parseFloat(upi_sales || 0),
      card_sales: parseFloat(card_sales || 0),
      total_expenses: parseFloat(cash_expenses || 0),
      cash_withdrawal: parseFloat(cash_withdrawal || 0),
      expected_cash: expectedCash,
      actual_cash: parseFloat(actual_cash || 0),
      cash_difference: cashDifference,
      notes: [remarks, difference_reason].filter(Boolean).join(' | '),
      closed_by: req.session.userId || closing.closed_by
    });

    res.json({
      success: true,
      message: 'Closing updated successfully',
      data: closing
    });
  } catch (error) {
    console.error('Update Closing Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Complete Closing
exports.completeClosing = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.session.companyId;

    const closing = await DayEndClosing.findOne({
      where: { id, company_id: companyId }
    });

    if (!closing) {
      return res.status(404).json({ error: 'Closing not found' });
    }

    await closing.update({
      status: 'closed',
      closed_by: req.session.userId || closing.closed_by
    });

    res.json({
      success: true,
      message: 'Day end closing completed',
      data: closing
    });
  } catch (error) {
    console.error('Complete Closing Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Verify Closing
exports.verifyClosing = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.session.companyId;

    const closing = await DayEndClosing.findOne({
      where: { id, company_id: companyId }
    });

    if (!closing) {
      return res.status(404).json({ error: 'Closing not found' });
    }

    await closing.update({
      status: 'verified',
      closed_by: req.session.userId || closing.closed_by
    });

    res.json({
      success: true,
      message: 'Day end closing verified',
      data: closing
    });
  } catch (error) {
    console.error('Verify Closing Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Start Closing Page (renders the start day-end UI)
exports.getStartClosingPage = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's sales totals
    const [salesRows] = await sequelize.query(`
      SELECT
        COUNT(*) AS transaction_count,
        COALESCE(SUM(grand_total), 0) AS total_sales,
        COALESCE(SUM(tax_amount), 0) AS total_tax,
        COALESCE(SUM(discount_amount), 0) AS total_discount
      FROM sales
      WHERE company_id = :companyId
        AND sales_status = 'completed'
        AND DATE(invoice_date) = DATE(:today)
    `, {
      replacements: { companyId, today: new Date() },
      type: sequelize.QueryTypes.SELECT
    });

    // Today's expenses
    const [expenseRows] = await sequelize.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_expenses
      FROM expenses
      WHERE company_id = :companyId
        AND DATE(expense_date) = DATE(:today)
    `, {
      replacements: { companyId, today: new Date() },
      type: sequelize.QueryTypes.SELECT
    });

    // Check if already started today
    const existingClosing = await DayEndClosing.findOne({
      where: {
        company_id: companyId,
        closing_date: { [Op.gte]: today, [Op.lt]: tomorrow }
      }
    });

    const summary = salesRows || { transaction_count: 0, total_sales: 0, total_tax: 0, total_discount: 0 };
    const expenseSummary = expenseRows || { total_expenses: 0 };

    res.render('admin/day-end/start', {
      summary,
      expenses: expenseSummary.total_expenses,
      existingClosing,
      user: req.user
    });
  } catch (error) {
    console.error('Get Start Closing Page Error:', error);
    res.status(500).render('error', { error: error.message });
  }
};
