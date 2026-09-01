// routes/notification.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification');
const { isAuthenticated } = require('../middleware/auth');

// All notification routes require authentication
router.use(isAuthenticated);

// API Endpoints
router.get('/', notificationController.getNotificationsApi);
router.post('/mark-all-read', notificationController.markAllReadApi);
router.post('/clear', notificationController.clearNotificationsApi);
router.post('/:id/read', notificationController.markAsReadApi);

module.exports = router;
