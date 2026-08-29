// Day End Closing Routes
const express = require('express');
const router = express.Router();
const dayendController = require('../controllers/dayend');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, dayendController.getClosings);

// Start closing page (GET - renders start UI)
router.get('/start', isAuthenticated, dayendController.getStartClosingPage);

// Start closing (POST - creates DB record)
router.post('/start', isAuthenticated, dayendController.startClosing);

// Closing form
router.get('/form', isAuthenticated, dayendController.getClosingForm);

// Update closing
router.put('/:id', isAuthenticated, dayendController.updateClosing);

// Complete closing
router.post('/:id/complete', isAuthenticated, dayendController.completeClosing);

// Verify closing
router.post('/:id/verify', isAuthenticated, dayendController.verifyClosing);

module.exports = router;
