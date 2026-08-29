// Purchase Management Routes
const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchase');
const { isAuthenticated } = require('../middleware/auth');

// All purchase routes require authentication
router.use(isAuthenticated);

// Purchase list and form
router.get('/', purchaseController.getPurchases);
router.get('/new', purchaseController.getPurchaseForm);

// Create purchase
router.post('/', purchaseController.createPurchase);

// Purchase details
router.get('/:id', purchaseController.getPurchaseDetails);

// Receive purchase stock
router.post('/:id/receive', purchaseController.receivePurchaseStock);

// Update payment status
router.patch('/:id/payment', purchaseController.updatePurchasePayment);

module.exports = router;
