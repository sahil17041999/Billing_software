// routes/inquiry.js
const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiry');
const { isAuthenticated, isSuperAdmin } = require('../middleware/auth');

// Super Admin Only Guard
router.use(isAuthenticated, isSuperAdmin);

router.get('/', inquiryController.getInquiriesPage);
router.get('/:id', inquiryController.getInquiryDetailApi);
router.post('/:id/status', inquiryController.updateInquiryStatus);
router.post('/:id/delete', inquiryController.deleteInquiry);

module.exports = router;
