// routes/subscription.js
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription');
const { isAuthenticated, isSuperAdmin } = require('../middleware/auth');

// Public routes for subscription pricing storefront and client ordering
router.get('/public/pricing', subscriptionController.getPublicPricing);
router.post('/api/order', subscriptionController.orderSubscription);

// Admin-protected subscription management routes
router.use(isAuthenticated);

router.get('/', subscriptionController.getSubscription);
router.get('/entitlements', subscriptionController.getEntitlementsApi);
router.post('/upgrade', subscriptionController.upgradePlan);
router.post('/cancel', subscriptionController.cancelSubscription);
router.get('/invoices/:invoiceId/receipt', subscriptionController.getInvoiceReceipt);
router.get('/export', isSuperAdmin, subscriptionController.exportSubscriptionsReport);

// Admin Client Stores & License Approvals (Only Super Admin - Full Authority)
router.post('/clients/:companyId/approve', isSuperAdmin, subscriptionController.approveClientStore);
router.post('/clients/:companyId/toggle', isSuperAdmin, subscriptionController.toggleClientStore);
router.post('/clients/:companyId/extend', isSuperAdmin, subscriptionController.extendClientStore);
router.post('/clients/:companyId/change-plan', isSuperAdmin, subscriptionController.changeClientPlan);
router.post('/clients/:companyId/edit', isSuperAdmin, subscriptionController.editClientStore);
router.post('/clients/:companyId/delete', isSuperAdmin, subscriptionController.deleteClientStore);
router.post('/clients/:companyId/impersonate', isSuperAdmin, subscriptionController.impersonateClientStore);
router.post('/clients/:companyId/regenerate-license', isSuperAdmin, subscriptionController.regenerateLicenseKey);
router.get('/impersonate/exit', subscriptionController.exitImpersonation);

module.exports = router;
