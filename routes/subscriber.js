// routes/subscriber.js
const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriber');
const notificationController = require('../controllers/notification');
const { isAuthenticated, requireSubscriber } = require('../middleware/auth');

// Public Subscriber Authentication (Mobile + Password or OTP)
router.get('/login', subscriberController.getSubscriberLogin);
router.post('/login', subscriberController.postSubscriberLogin);
router.post('/send-otp', subscriberController.sendSubscriberOtp);
router.post('/verify-otp', subscriberController.verifySubscriberOtp);

// Protected Subscriber Store Management Panel (Subscribers ONLY - Company > 1)
router.get('/dashboard', isAuthenticated, requireSubscriber, subscriberController.getSubscriberDashboard);
router.get('/invoices', isAuthenticated, requireSubscriber, subscriberController.getSubscriberInvoices);
router.get('/profile', isAuthenticated, requireSubscriber, subscriberController.getSubscriberProfile);
router.post('/profile', isAuthenticated, requireSubscriber, subscriberController.updateSubscriberProfile);
router.get('/notifications', isAuthenticated, requireSubscriber, notificationController.getNotificationsPage);

module.exports = router;
