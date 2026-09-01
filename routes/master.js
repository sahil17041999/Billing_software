// Master Setup Routes
const express = require('express');
const router = express.Router();
const masterController = require('../controllers/master');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Require authentication for all routes
router.use(isAuthenticated);

// ============================================
// REALTIME DUPLICATE CHECK ROUTE (For jQuery Validate & AJAX)
// ============================================
router.get('/check-duplicate', masterController.checkDuplicate);
router.post('/check-duplicate', masterController.checkDuplicate);

// ============================================
// CATEGORY ROUTES
// ============================================
router.get('/categories', masterController.getCategories);
router.post('/categories', masterController.createCategory);
router.put('/categories/:id', masterController.updateCategory);

// ============================================
// BRAND ROUTES
// ============================================
router.get('/brands', masterController.getBrands);
router.post('/brands', masterController.createBrand);
router.put('/brands/:id', masterController.updateBrand);

// ============================================
// PRODUCT ROUTES
// ============================================
router.get('/products', masterController.getProducts);
router.get('/products/:id', masterController.getProductById);
router.post('/products', masterController.createProduct);
router.put('/products/:id', masterController.updateProduct);
router.post('/products/:id/barcode', masterController.quickSetProductBarcode);

// ============================================
// CUSTOMER ROUTES
// ============================================
router.get('/customers', masterController.getCustomers);
router.post('/customers', masterController.createCustomer);
router.put('/customers/:id', masterController.updateCustomer);

// ============================================
// SUPPLIER ROUTES
// ============================================
router.get('/suppliers', masterController.getSuppliers);
router.post('/suppliers', masterController.createSupplier);
router.put('/suppliers/:id', masterController.updateSupplier);

// ============================================
// UNIT ROUTES
// ============================================
router.get('/units', masterController.getUnits);
router.post('/units', masterController.createUnit);
router.put('/units/:id', masterController.updateUnit);

// ============================================
// TAX ROUTES
// ============================================
router.get('/taxes', masterController.getTaxes);
router.post('/taxes', masterController.createTax);
router.put('/taxes/:id', masterController.updateTax);

// ============================================
// PAYMENT MODE ROUTES
// ============================================
router.get('/payment-modes', masterController.getPaymentModes);
router.post('/payment-modes', masterController.createPaymentMode);
router.put('/payment-modes/:id', masterController.updatePaymentMode);

module.exports = router;
