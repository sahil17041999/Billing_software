// Expense Management Controller
const { Expense, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get Expenses
exports.getExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', category = '', status = '', fromDate = '', toDate = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = { company_id: req.session.companyId };
    
    if (search) {
      where[Op.or] = [
        { description: { [Op.like]: `%${search}%` } },
        { reference_number: { [Op.like]: `%${search}%` } },
        { invoice_number: { [Op.like]: `%${search}%` } }
      ];
    }
    if (category) where.category = category;
    if (status) where.status = status;
    
    if (fromDate || toDate) {
      where.expense_date = {};
      if (fromDate) where.expense_date[Op.gte] = new Date(fromDate);
      if (toDate) where.expense_date[Op.lte] = new Date(toDate);
    }

    const expenses = await Expense.findAndCountAll({
      where,
      include: [
        { association: 'creator', model: User, attributes: ['username', 'first_name', 'last_name'] },
        { association: 'approver', model: User, attributes: ['username'] }
      ],
      offset,
      limit: parseInt(limit),
      order: [['expense_date', 'DESC']]
    });

    if (req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        data: expenses.rows,
        total: expenses.count,
        page: parseInt(page),
        totalPages: Math.ceil(expenses.count / limit)
      });
    }

    res.render('admin/expenses', {
      expenses: expenses.rows,
      total: expenses.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(expenses.count / limit),
      categories: ['rent', 'electricity', 'salary', 'transport', 'maintenance', 'supplies', 'packaging', 'other'],
      user: req.user
    });
  } catch (error) {
    console.error('Get Expenses Error:', error);
    if (req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).render('error', { error: error.message });
  }
};

// Get Expense Form
exports.getExpenseForm = async (req, res) => {
  try {
    res.render('admin/expense-form', {
      categories: ['rent', 'electricity', 'salary', 'transport', 'maintenance', 'supplies', 'packaging', 'other'],
      paymentModes: ['cash', 'cheque', 'bank_transfer', 'upi', 'card'],
      user: req.user
    });
  } catch (error) {
    console.error('Get Expense Form Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create Expense
exports.createExpense = async (req, res) => {
  try {
    const { category, description, amount, payment_mode, reference_number, invoice_number, payment_date, notes } = req.body;
    const companyId = req.session.companyId;

    if (!category || !amount) {
      return res.status(400).json({ error: 'Category and amount are required' });
    }

    const expense = await Expense.create({
      company_id: companyId,
      category,
      description,
      amount: parseFloat(amount),
      payment_mode,
      reference_number,
      invoice_number,
      payment_date: payment_date || new Date(),
      notes,
      status: 'pending',
      created_by: req.session.userId
    });

    res.json({
      success: true,
      message: 'Expense created successfully',
      data: expense
    });
  } catch (error) {
    console.error('Create Expense Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Expense Details
exports.getExpenseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.session.companyId;

    const expense = await Expense.findOne({
      where: { id, company_id: companyId },
      include: [
        { association: 'creator', model: User, attributes: ['username', 'first_name', 'last_name'] },
        { association: 'approver', model: User, attributes: ['username'] }
      ]
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, data: expense });
    }

    res.render('admin/expense-details', { expense, user: req.user });
  } catch (error) {
    console.error('Get Expense Details Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update Expense
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, description, amount, payment_mode, reference_number, invoice_number, payment_date, notes } = req.body;
    const companyId = req.session.companyId;

    const expense = await Expense.findOne({
      where: { id, company_id: companyId }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (expense.status !== 'pending') {
      return res.status(400).json({ error: 'Can only edit pending expenses' });
    }

    await expense.update({
      category: category || expense.category,
      description: description || expense.description,
      amount: amount ? parseFloat(amount) : expense.amount,
      payment_mode: payment_mode || expense.payment_mode,
      reference_number: reference_number || expense.reference_number,
      invoice_number: invoice_number || expense.invoice_number,
      payment_date: payment_date || expense.payment_date,
      notes: notes || expense.notes
    });

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: expense
    });
  } catch (error) {
    console.error('Update Expense Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Approve Expense
exports.approveExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.session.companyId;

    const expense = await Expense.findOne({
      where: { id, company_id: companyId }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await expense.update({
      status: 'approved',
      approved_by: req.session.userId,
      approval_date: new Date()
    });

    res.json({
      success: true,
      message: 'Expense approved successfully',
      data: expense
    });
  } catch (error) {
    console.error('Approve Expense Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Reject Expense
exports.rejectExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const companyId = req.session.companyId;

    const expense = await Expense.findOne({
      where: { id, company_id: companyId }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await expense.update({
      status: 'rejected',
      notes: reason || expense.notes
    });

    res.json({
      success: true,
      message: 'Expense rejected successfully',
      data: expense
    });
  } catch (error) {
    console.error('Reject Expense Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mark as Paid
exports.markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.session.companyId;

    const expense = await Expense.findOne({
      where: { id, company_id: companyId }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (expense.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved expenses can be marked as paid' });
    }

    await expense.update({
      status: 'paid',
      payment_date: new Date()
    });

    res.json({
      success: true,
      message: 'Expense marked as paid',
      data: expense
    });
  } catch (error) {
    console.error('Mark as Paid Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Expense Summary
exports.getExpenseSummary = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const companyId = req.session.companyId;

    const where = { company_id: companyId, status: 'paid' };
    
    if (fromDate || toDate) {
      where.payment_date = {};
      if (fromDate) where.payment_date[Op.gte] = new Date(fromDate);
      if (toDate) where.payment_date[Op.lte] = new Date(toDate);
    }

    const summary = await Expense.findAll({
      where,
      attributes: ['category', [sequelize.fn('SUM', sequelize.col('amount')), 'total']],
      group: ['category'],
      raw: true
    });

    const totalExpense = await Expense.sum('amount', { where });

    res.json({
      success: true,
      data: {
        byCategory: summary,
        total: totalExpense || 0
      }
    });
  } catch (error) {
    console.error('Get Expense Summary Error:', error);
    res.status(500).json({ error: error.message });
  }
};
