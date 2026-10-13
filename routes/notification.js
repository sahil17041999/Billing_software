// routes/notification.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification');
const { isAuthenticated } = require('../middleware/auth');

// All notification routes require authentication
router.use(isAuthenticated);

// API Endpoints
router.get('/', notificationController.getNotificationsApi);
router.get('/stats', notificationController.getNotificationStatsApi);
router.post('/mark-all-read', notificationController.markAllReadApi);
router.post('/clear', notificationController.clearNotificationsApi);
router.post('/bulk-action', notificationController.bulkActionApi);
router.post('/broadcast', notificationController.broadcastNotificationApi);
router.post('/test', notificationController.sendTestNotificationApi);

// Single notification operations
router.post('/:id/read', notificationController.markAsReadApi);
router.post('/:id/unread', notificationController.markAsUnreadApi);
router.delete('/:id', notificationController.deleteNotificationApi);

module.exports = router;
