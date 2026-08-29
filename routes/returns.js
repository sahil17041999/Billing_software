// Returns Routes
const express = require('express');
const router = express.Router();
const returnsController = require('../controllers/returns');
const { isAuthenticated } = require('../middleware/auth');

// Sales Returns
router.get('/sales', isAuthenticated, returnsController.getSalesReturns);
router.get('/sales/form', isAuthenticated, returnsController.getSalesReturnForm);
router.post('/sales', isAuthenticated, returnsController.createSalesReturn);
router.post('/sales/:returnId/approve', isAuthenticated, returnsController.approveSalesReturn);

// Purchase Returns
router.get('/purchases', isAuthenticated, returnsController.getPurchaseReturns);
router.get('/purchases/form', isAuthenticated, returnsController.getPurchaseReturnForm);
router.post('/purchases', isAuthenticated, returnsController.createPurchaseReturn);
router.post('/purchases/:returnId/approve', isAuthenticated, returnsController.approvePurchaseReturn);

module.exports = router;
