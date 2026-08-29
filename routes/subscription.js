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
router.post('/upgrade', subscriptionController.upgradePlan);
router.post('/cancel', subscriptionController.cancelSubscription);

// Admin Client Stores & License Approvals (Only Super Admin)
router.post('/clients/:companyId/approve', isSuperAdmin, subscriptionController.approveClientStore);
router.post('/clients/:companyId/toggle', isSuperAdmin, subscriptionController.toggleClientStore);
router.post('/clients/:companyId/extend', isSuperAdmin, subscriptionController.extendClientStore);

module.exports = router;
