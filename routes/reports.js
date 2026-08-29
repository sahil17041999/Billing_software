// Reports Routes
const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports');
const { isAuthenticated } = require('../middleware/auth');

// Reports
router.get('/', isAuthenticated, reportsController.getSalesReport);
router.get('/gst', isAuthenticated, reportsController.getSalesReport);
router.get('/sales', isAuthenticated, reportsController.getSalesReport);
router.get('/purchase', isAuthenticated, reportsController.getPurchaseReport);
router.get('/stock', isAuthenticated, reportsController.getStockReport);
router.get('/profit-loss', isAuthenticated, reportsController.getProfitLossReport);
router.get('/expense', isAuthenticated, reportsController.getExpenseReport);
router.get('/cashier', isAuthenticated, reportsController.getCashierReport);
router.get('/day-end', isAuthenticated, reportsController.getDayEndReport);

module.exports = router;
