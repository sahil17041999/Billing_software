// Ledger Routes
const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledger');
const { isAuthenticated } = require('../middleware/auth');

// Customer Ledger
router.get('/customer', isAuthenticated, ledgerController.getCustomerLedger);
router.get('/customer/summary', isAuthenticated, ledgerController.getCustomerLedgerSummary);
router.get('/customer/outstanding', isAuthenticated, ledgerController.getCustomerOutstanding);

// Supplier Ledger
router.get('/supplier', isAuthenticated, ledgerController.getSupplierLedger);
router.get('/supplier/summary', isAuthenticated, ledgerController.getSupplierLedgerSummary);
router.get('/supplier/outstanding', isAuthenticated, ledgerController.getSupplierOutstanding);

module.exports = router;
