// Authentication Routes
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { isAuthenticated } = require('../middleware/auth');

// Login routes
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.post('/api/login', authController.apiLogin);

// Mobile OTP Authentication Routes
router.post('/auth/send-otp', authController.sendLoginOtp);
router.post('/auth/verify-otp', authController.verifyLoginOtp);
router.post('/send-otp', authController.sendLoginOtp);
router.post('/verify-otp', authController.verifyLoginOtp);

// Logout
router.get('/logout', isAuthenticated, authController.logout);

module.exports = router;
