// Expenses Routes
const express = require('express');
const router = express.Router();
const expensesController = require('../controllers/expenses');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, expensesController.getExpenses);
router.get('/form', isAuthenticated, expensesController.getExpenseForm);
router.post('/', isAuthenticated, expensesController.createExpense);
router.get('/:id', isAuthenticated, expensesController.getExpenseDetails);
router.put('/:id', isAuthenticated, expensesController.updateExpense);
router.post('/:id/approve', isAuthenticated, expensesController.approveExpense);
router.post('/:id/reject', isAuthenticated, expensesController.rejectExpense);
router.post('/:id/paid', isAuthenticated, expensesController.markAsPaid);
router.get('/api/summary', isAuthenticated, expensesController.getExpenseSummary);

module.exports = router;
