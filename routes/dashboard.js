// Dashboard Routes
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard');
const { isAuthenticated, requirePlatformAdmin } = require('../middleware/auth');

// Dashboard routes - Platform Administrators ONLY
router.get('/', isAuthenticated, requirePlatformAdmin, dashboardController.getDashboard);
router.get('/api/data', isAuthenticated, requirePlatformAdmin, dashboardController.apiGetDashboard);

module.exports = router;
