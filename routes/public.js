// routes/public.js
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription');
const { createNotification } = require('../controllers/notification');
const { ContactInquiry } = require('../models');

// 1. Home page (if logged in, redirect to respective dashboard; else render full B2C homepage)
router.get('/', async (req, res) => {
  if (req.session && req.session.userId) {
    if (req.session.role === 'cashier') {
      return res.redirect('/admin/sales/pos');
    }
    if (req.session.companyId > 1) {
      return res.redirect('/subscriber/dashboard');
    }
    return res.redirect('/admin/dashboard');
  }

  try {
    const plans = await subscriptionController.ensurePlansAvailable();
    res.render('public/index', {
      currentPage: 'home',
      plans: plans || [],
      user: req.user || null
    });
  } catch (err) {
    console.error('Error loading homepage:', err);
    res.render('public/index', {
      currentPage: 'home',
      plans: [],
      user: null
    });
  }
});

router.get('/home', (req, res) => res.redirect('/'));

// 2. Features Page
router.get('/features', (req, res) => {
  res.render('public/features', {
    currentPage: 'features',
    user: req.user || null
  });
});

// 3. Pricing Storefront Page
router.get('/pricing', async (req, res) => {
  try {
    const plans = await subscriptionController.ensurePlansAvailable();
    res.render('public/pricing', {
      currentPage: 'pricing',
      plans: plans || [],
      user: req.user || null
    });
  } catch (err) {
    console.error('Error loading pricing page:', err);
    res.status(500).send('Error loading pricing plans');
  }
});

router.get('/plans', (req, res) => res.redirect('/pricing'));

// 4. About Us Page
router.get('/about', (req, res) => {
  res.render('public/about', {
    currentPage: 'about',
    user: req.user || null
  });
});

// 5. Contact Us Page
router.get('/contact', (req, res) => {
  res.render('public/contact', {
    currentPage: 'contact',
    user: req.user || null
  });
});

// 6. Contact Form Submission
router.post('/api/contact', async (req, res) => {
  try {
    const { name, store_name, phone, email, subject, message } = req.body;
    if (!name || !phone || !message) {
      return res.status(400).json({ success: false, error: 'Name, phone number, and message are required.' });
    }

    // Persist into database for Admin Panel tracking
    const inquiry = await ContactInquiry.create({
      name: name.trim(),
      store_name: (store_name || '').trim(),
      phone: phone.trim(),
      email: (email || '').trim(),
      subject: (subject || 'General Inquiry').trim(),
      message: message.trim(),
      status: 'new'
    });

    // Trigger alert notification to Super Admin linking to /admin/inquiries
    try {
      await createNotification({
        company_id: 1,
        type: 'system',
        title: `New Website Inquiry: ${name}`,
        message: `Store: ${store_name || 'N/A'} | Phone: ${phone} | Email: ${email || 'N/A'} | Subject: ${subject || 'General'}`,
        icon: 'ti-mail-forward',
        severity: 'info',
        link: '/admin/inquiries'
      });
    } catch (notifErr) {
      console.warn('Could not dispatch notification for contact inquiry:', notifErr.message);
    }

    return res.json({
      success: true,
      inquiry_id: inquiry.id,
      message: 'Thank you for reaching out! Your inquiry has been logged, and our retail specialist will contact you shortly.'
    });
  } catch (err) {
    console.error('Contact inquiry error:', err);
    return res.status(500).json({ success: false, error: 'Server error processing inquiry.' });
  }
});

// 7. Store Subscription Order API
router.post('/api/subscriptions/order', subscriptionController.orderSubscription);

module.exports = router;
