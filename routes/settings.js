const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings');
const { isAuthenticated } = require('../middleware/auth');

// All settings routes require authentication
router.use(isAuthenticated);

// SMTP Gateway Settings
router.get('/smtp', settingsController.getSmtpSettings);
router.post('/smtp', settingsController.saveSmtpSettings);
router.post('/smtp/test', settingsController.testSmtpConnection);

// Company Logo
router.post('/logo', settingsController.uploadLogo);
router.delete('/logo', settingsController.removeLogo);

// Default redirect /admin/settings to /admin/settings/smtp
router.get('/', (req, res) => {
  res.redirect('/admin/settings/smtp');
});

module.exports = router;
