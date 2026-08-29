// Sales/POS Routes
const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales');
const { isAuthenticated } = require('../middleware/auth');

// All sales routes require authentication
router.use(isAuthenticated);

// POS interface
router.get('/pos', salesController.getPOS);

// Sales list
router.get('/', salesController.getSales);

// Create sale
router.post('/', salesController.createSale);

// Search product by barcode (must be before /:id)
router.get('/search/barcode', salesController.searchProductByBarcode);

// Get sales summary (must be before /:id)
router.get('/api/summary', salesController.getSalesSummary);

// Printable invoice view (must be before /:id)
router.get('/invoice/:id', salesController.getInvoice);
router.post('/invoice/:id/email', salesController.emailInvoice);

// Get product batches
router.get('/product/:product_id/batches', salesController.getProductBatches);

// Get sale details (JSON)
router.get('/:id', salesController.getSaleDetails);

module.exports = router;
