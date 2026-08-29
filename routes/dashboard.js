// Dashboard Routes
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard');
const { isAuthenticated } = require('../middleware/auth');

// Dashboard routes - require authentication
router.get('/', isAuthenticated, dashboardController.getDashboard);
router.get('/api/data', isAuthenticated, dashboardController.apiGetDashboard);

module.exports = router;
