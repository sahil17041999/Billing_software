// Inventory Routes
const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory');
const { isAuthenticated } = require('../middleware/auth');

// Stock Summary
router.get('/stock', isAuthenticated, inventoryController.getStockSummary);
router.get('/stock/low', isAuthenticated, inventoryController.getLowStockProducts);
router.get('/stock/expiry', isAuthenticated, inventoryController.getExpiryAlerts);

// Stock Adjustments
router.post('/adjust', isAuthenticated, inventoryController.adjustStock);
router.post('/transfer', isAuthenticated, inventoryController.transferStock);
router.post('/damage', isAuthenticated, inventoryController.markAsDamaged);

// Stock Ledger
router.get('/ledger', isAuthenticated, inventoryController.getStockLedger);

module.exports = router;
