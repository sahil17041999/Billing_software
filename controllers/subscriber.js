// controllers/subscriber.js
const { User, Company, Role, CompanySubscription, SubscriptionPlan, SubscriptionInvoice, Sale, Product, Stock, Notification, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Subscriber Login Page GET
 */
exports.getSubscriberLogin = (req, res) => {
  if (req.session.userId) {
    const companyId = req.session.companyId || (req.user ? req.user.company_id : 1);
    if (companyId > 1) {
      return res.redirect('/subscriber/dashboard');
    } else {
      return res.redirect('/admin/dashboard');
    }
  }
  res.render('subscriber/login', { error: null, message: null });
};

/**
 * Subscriber Login POST
 * Supports mobile number / username authentication with store validation
 */
exports.postSubscriberLogin = async (req, res) => {
  try {
    const { phone, username } = req.body;
    const rawInput = phone || username;

    let cleanPhone = (rawInput || '').toString().trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) cleanPhone = cleanPhone.substring(2);
    else if (cleanPhone.length > 10 && cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);

    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      if (req.xhr || (req.headers['accept'] && req.headers['accept'].includes('application/json'))) {
        return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit Indian mobile number.' });
      }
      return res.render('subscriber/login', {
        error: 'Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).',
        message: null
      });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { phone: cleanPhone },
          { username: cleanPhone }
        ]
      },
      include: [
        { association: 'company', model: Company },
        { association: 'role', model: Role }
      ]
    });

    if (!user) {
      const errMsg = `No registered subscriber account found with mobile number +91 ${cleanPhone}. Please ensure you have purchased a plan or check your mobile number.`;
      if (req.xhr || (req.headers['accept'] && req.headers['accept'].includes('application/json'))) {
        return res.status(404).json({ success: false, error: errMsg });
      }
      return res.render('subscriber/login', { error: errMsg, message: null });
    }

    // Block Platform Super Admin / Founder from subscriber portal!
    if (user.company_id === 1 || user.id === 1) {
      const adminBlockMsg = 'Access Denied: Platform Administrators must sign in through the Admin Portal (/admin/login).';
      if (req.xhr || (req.headers['accept'] && req.headers['accept'].includes('application/json'))) {
        return res.status(403).json({ success: false, error: adminBlockMsg });
      }
      return res.render('subscriber/login', { error: adminBlockMsg, message: null });
    }

    // Check store approval status
    if (user.company && (user.company.is_active === 0 || user.company.is_active === false || user.company.is_active === '0')) {
      const pendingMsg = 'Your store subscription is currently pending administrator verification. You will be able to log in once your store license is approved by the admin.';
      if (req.xhr || (req.headers['accept'] && req.headers['accept'].includes('application/json'))) {
        return res.status(403).json({ success: false, error: pendingMsg });
      }
      return res.render('subscriber/login', { error: pendingMsg, message: null });
    }

    if (user.is_active === 0 || user.is_active === false || user.is_active === '0') {
      const disabledMsg = 'Your user account has been disabled. Please contact the store administrator.';
      if (req.xhr || (req.headers['accept'] && req.headers['accept'].includes('application/json'))) {
        return res.status(403).json({ success: false, error: disabledMsg });
      }
      return res.render('subscriber/login', { error: disabledMsg, message: null });
    }

    // Resolve Role
    let roleName = user.role ? user.role.name : 'admin';
    if (!user.role && user.role_id) {
      const r = await Role.findByPk(user.role_id);
      if (r) roleName = r.name;
    }

    await user.update({ last_login: new Date() });

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = roleName;
    req.session.companyId = user.company_id || (user.company ? user.company.id : 1);

    const redirectUrl = '/subscriber/dashboard';

    if (req.xhr || (req.headers['accept'] && req.headers['accept'].includes('application/json'))) {
      return res.json({
        success: true,
        message: 'Login successful! Redirecting to your Subscriber Store Panel...',
        redirectUrl: redirectUrl,
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          role: roleName,
          company: user.company ? user.company.name : 'Store'
        }
      });
    }

    return res.redirect(redirectUrl);

  } catch (error) {
    console.error('Subscriber login error:', error);
    if (req.xhr || (req.headers['accept'] && req.headers['accept'].includes('application/json'))) {
      return res.status(500).json({ success: false, error: 'An error occurred during login. Please try again.' });
    }
    return res.render('subscriber/login', { error: 'An error occurred during login. Please try again.', message: null });
  }
};

/**
 * Send OTP for Subscriber Login
 */
exports.sendSubscriberOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    let cleanPhone = (phone || '').toString().trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) cleanPhone = cleanPhone.substring(2);
    else if (cleanPhone.length > 10 && cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);

    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).'
      });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { phone: cleanPhone },
          { username: cleanPhone }
        ]
      },
      include: [
        { association: 'company', model: Company },
        { association: 'role', model: Role }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: `No registered subscriber account found with mobile number +91 ${cleanPhone}. Please verify your number or purchase a plan on /pricing.`
      });
    }

    // Block Platform Super Admin / Founder from Subscriber OTP!
    if (user.company_id === 1 || user.id === 1) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Platform Administrators must sign in through the Admin Portal (/admin/login).'
      });
    }

    if (user.company && (user.company.is_active === 0 || user.company.is_active === false || user.company.is_active === '0')) {
      return res.status(403).json({
        success: false,
        error: 'Your store subscription is currently pending administrator verification. Please wait for admin approval.'
      });
    }

    if (user.is_active === 0 || user.is_active === false || user.is_active === '0') {
      return res.status(403).json({
        success: false,
        error: 'Your account has been disabled. Please contact the administrator.'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    req.session.subscriberOtp = {
      phone: cleanPhone,
      otp: otp,
      userId: user.id,
      expiresAt: expiresAt,
      attempts: 0
    };

    console.log(`\n========================================`);
    console.log(`🔑 [STORE SUBSCRIBER LOGIN OTP GENERATED]`);
    console.log(`👤 Store: ${user.company ? user.company.name : 'Store'} (${user.first_name || user.username})`);
    console.log(`📱 Mobile: +91 ${cleanPhone}`);
    console.log(`🔢 OTP Code: ${otp}`);
    console.log(`⏰ Valid for 5 minutes`);
    console.log(`========================================\n`);

    return res.json({
      success: true,
      message: `OTP sent successfully to +91 ${cleanPhone}`,
      phone: cleanPhone,
      otp: otp,
      expiresIn: 300
    });

  } catch (error) {
    console.error('Send subscriber OTP error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate OTP. Please try again.' });
  }
};

/**
 * Verify OTP for Subscriber Login
 */
exports.verifySubscriberOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    let cleanPhone = (phone || '').toString().trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) cleanPhone = cleanPhone.substring(2);
    const cleanOtp = (otp || '').toString().trim();

    if (!cleanPhone || !cleanOtp) {
      return res.status(400).json({
        success: false,
        error: 'Mobile number and 6-digit OTP are required.'
      });
    }

    const sessionOtp = req.session.subscriberOtp;
    if (!sessionOtp || !sessionOtp.otp) {
      return res.status(400).json({
        success: false,
        error: 'No OTP requested. Please request an OTP first.'
      });
    }

    if (Date.now() > sessionOtp.expiresAt) {
      delete req.session.subscriberOtp;
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new one.'
      });
    }

    if (sessionOtp.phone !== cleanPhone) {
      return res.status(400).json({
        success: false,
        error: 'Mobile number mismatch. Please request a new OTP.'
      });
    }

    if (sessionOtp.otp !== cleanOtp) {
      sessionOtp.attempts = (sessionOtp.attempts || 0) + 1;
      if (sessionOtp.attempts >= 5) {
        delete req.session.subscriberOtp;
        return res.status(400).json({
          success: false,
          error: 'Too many incorrect attempts. Please request a new OTP.'
        });
      }
      return res.status(400).json({
        success: false,
        error: 'Incorrect OTP. Please enter the 6-digit code again.'
      });
    }

    const user = await User.findByPk(sessionOtp.userId, {
      include: [
        { association: 'company', model: Company },
        { association: 'role', model: Role }
      ]
    });

    if (!user || user.is_active === 0 || user.is_active === false) {
      delete req.session.subscriberOtp;
      return res.status(403).json({ success: false, error: 'User account disabled' });
    }

    if (user.company_id === 1 || user.id === 1) {
      delete req.session.subscriberOtp;
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Platform Administrators must sign in through the Admin Portal (/admin/login).'
      });
    }

    let roleName = user.role ? user.role.name : 'admin';
    if (!user.role && user.role_id) {
      const r = await Role.findByPk(user.role_id);
      if (r) roleName = r.name;
    }

    await user.update({ last_login: new Date() });

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = roleName;
    req.session.companyId = user.company_id || (user.company ? user.company.id : 2);

    delete req.session.subscriberOtp;

    return res.json({
      success: true,
      message: 'OTP verified successfully! Redirecting to your Subscriber Store Dashboard...',
      redirectUrl: '/subscriber/dashboard',
      user: {
        id: user.id,
        username: user.username,
        role: roleName,
        phone: user.phone,
        company: user.company ? user.company.name : 'Store'
      }
    });

  } catch (error) {
    console.error('Verify subscriber OTP error:', error);
    return res.status(500).json({ success: false, error: 'Error during OTP verification' });
  }
};

/**
 * Subscriber Dashboard GET
 * Store KPIs, License details, Quotas, Quick POS launcher, and Notifications
 */
exports.getSubscriberDashboard = async (req, res) => {
  try {
    const companyId = req.session.companyId || (req.user ? req.user.company_id : 2);
    const company = await Company.findByPk(companyId);

    // Fetch subscription details
    let subscription = await CompanySubscription.findOne({
      where: { company_id: companyId },
      include: [{ model: SubscriptionPlan, as: 'plan' }]
    });

    if (!subscription) {
      // Fallback: fetch Pro or default plan
      const defaultPlan = await SubscriptionPlan.findOne({ where: { code: 'pro' } }) || await SubscriptionPlan.findOne();
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setDate(nextMonth.getDate() + 30);

      subscription = await CompanySubscription.create({
        company_id: companyId,
        plan_id: defaultPlan ? defaultPlan.id : 1,
        billing_cycle: 'monthly',
        status: 'active',
        start_date: now,
        end_date: nextMonth,
        next_billing_date: nextMonth,
        amount_paid: defaultPlan ? defaultPlan.price_monthly : 999.00,
        license_key: `GROC-${Date.now().toString().slice(-8)}-PRO`,
        payment_method: 'UPI'
      });

      subscription = await CompanySubscription.findOne({
        where: { id: subscription.id },
        include: [{ model: SubscriptionPlan, as: 'plan' }]
      });
    }

    // Usage metrics
    const userCount = await User.count({ where: { company_id: companyId } });
    const productCount = await Product.count({ where: { company_id: companyId } });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyInvoiceCount = await Sale.count({
      where: {
        company_id: companyId,
        created_at: { [Op.gte]: startOfMonth }
      }
    });

    const maxUsers = (subscription && subscription.plan && subscription.plan.max_users) ? subscription.plan.max_users : 6;
    const maxProducts = (subscription && subscription.plan && subscription.plan.max_products) ? subscription.plan.max_products : 10000;
    const maxInvoices = (subscription && subscription.plan && subscription.plan.max_invoices_per_month) ? subscription.plan.max_invoices_per_month : 15000;

    const quotas = {
      users: { current: userCount, max: maxUsers, percent: Math.min(100, Math.round((userCount / maxUsers) * 100)) },
      products: { current: productCount, max: maxProducts, percent: Math.min(100, Math.round((productCount / maxProducts) * 100)) },
      invoices: { current: monthlyInvoiceCount, max: maxInvoices, percent: Math.min(100, Math.round((monthlyInvoiceCount / maxInvoices) * 100)) }
    };

    // Remaining days calculation
    const today = new Date();
    const endDate = subscription && subscription.end_date ? new Date(subscription.end_date) : new Date(Date.now() + 30 * 86400000);
    const diffTime = endDate.getTime() - today.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Store Financials: Today's sales
    const [todaySales] = await sequelize.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total
      FROM sales
      WHERE company_id = ? AND DATE(invoice_date) = CURDATE() AND sales_status = 'completed'
    `, { replacements: [companyId] });

    // This month's sales
    const [monthSales] = await sequelize.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total
      FROM sales
      WHERE company_id = ? AND MONTH(invoice_date) = MONTH(NOW()) AND YEAR(invoice_date) = YEAR(NOW()) AND sales_status = 'completed'
    `, { replacements: [companyId] });

    // Recent store sales (last 5)
    const recentSales = await Sale.findAll({
      where: { company_id: companyId },
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // Recent store notifications (last 5)
    const notifications = await Notification.findAll({
      where: {
        [Op.or]: [
          { company_id: companyId },
          { company_id: null }
        ]
      },
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // Available plans for quick upgrade
    const allPlans = await SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [['price_monthly', 'ASC']]
    });

    res.render('subscriber/dashboard', {
      company,
      subscription,
      quotas,
      daysRemaining,
      todaySales: todaySales[0] || { count: 0, total: 0 },
      monthSales: monthSales[0] || { count: 0, total: 0 },
      recentSales,
      notifications,
      allPlans,
      currentPage: 'subscriber-dashboard'
    });

  } catch (error) {
    console.error('Error rendering subscriber dashboard:', error);
    res.status(500).render('error', { error: 'Error loading Subscriber Dashboard' });
  }
};

/**
 * Subscriber Invoices & Tax Receipts GET
 */
exports.getSubscriberInvoices = async (req, res) => {
  try {
    const companyId = req.session.companyId || (req.user ? req.user.company_id : 2);
    const company = await Company.findByPk(companyId);

    const invoices = await SubscriptionInvoice.findAll({
      where: { company_id: companyId },
      include: [{ model: SubscriptionPlan, as: 'plan' }],
      order: [['paid_at', 'DESC'], ['created_at', 'DESC']]
    });

    res.render('subscriber/invoices', {
      company,
      invoices,
      currentPage: 'subscriber-invoices'
    });
  } catch (error) {
    console.error('Error fetching subscriber invoices:', error);
    res.status(500).render('error', { error: 'Error loading Subscription Invoices' });
  }
};

/**
 * Subscriber Store Profile GET
 */
exports.getSubscriberProfile = async (req, res) => {
  try {
    const companyId = req.session.companyId || (req.user ? req.user.company_id : 2);
    const company = await Company.findByPk(companyId);
    const user = req.user || await User.findByPk(req.session.userId);

    res.render('subscriber/profile', {
      company,
      user,
      currentPage: 'subscriber-profile'
    });
  } catch (error) {
    console.error('Error loading subscriber profile:', error);
    res.status(500).render('error', { error: 'Error loading Store Profile' });
  }
};

/**
 * Subscriber Store Profile POST / Update
 */
exports.updateSubscriberProfile = async (req, res) => {
  try {
    const companyId = req.session.companyId || (req.user ? req.user.company_id : 2);
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    const { name, email, phone, address, city, state, postal_code, gstin, pan } = req.body;

    await company.update({
      name: (name || company.name).trim(),
      email: (email || company.email || '').trim(),
      phone: (phone || company.phone || '').trim(),
      address: (address || company.address || '').trim(),
      city: (city || company.city || '').trim(),
      state: (state || company.state || '').trim(),
      postal_code: (postal_code || company.postal_code || '').trim(),
      gstin: (gstin || company.gstin || '').trim(),
      pan: (pan || company.pan || '').trim()
    });

    return res.json({ success: true, message: 'Store profile updated successfully!' });
  } catch (error) {
    console.error('Error updating subscriber profile:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
