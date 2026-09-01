// Authentication Controller
const { User, Company, Role, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// Login GET - Display login form
exports.getLogin = (req, res) => {
  if (req.session.userId) {
    if (req.session.role === 'cashier') {
      return res.redirect('/admin/sales/pos');
    }
    if (req.session.companyId > 1) {
      return res.redirect('/subscriber/dashboard');
    }
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { message: null, error: null });
};

// Login POST - Process login (mobile number authentication)
exports.postLogin = async (req, res) => {
  try {
    const { phone, username } = req.body;
    const rawInput = phone || username;

    let cleanPhone = (rawInput || '').toString().trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) cleanPhone = cleanPhone.substring(2);
    else if (cleanPhone.length > 10 && cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);

    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.render('admin/login', { 
        error: 'Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)',
        message: null 
      });
    }

    // Find user by mobile number or username
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
      return res.render('admin/login', { 
        error: `No registered account found with mobile number: +91 ${cleanPhone}`,
        message: null 
      });
    }

    // Block subscribers from using admin panel login
    if (user.company_id > 1) {
      return res.render('admin/login', {
        error: 'Access Denied: You are a registered Store Subscriber. Please log in at the Subscriber Portal (/subscriber/login).',
        message: null
      });
    }

    // Check if store / company is pending admin approval
    if (user.company && (user.company.is_active === 0 || user.company.is_active === false || user.company.is_active === '0')) {
      return res.render('admin/login', { 
        error: 'Your store subscription is currently pending administrator verification. You will be able to sign in once approved by the admin.',
        message: null 
      });
    }

    // Check if user is active
    if (user.is_active === 0 || user.is_active === false || user.is_active === '0') {
      return res.render('admin/login', { 
        error: 'Your account has been disabled or is pending approval. Please contact administrator.',
        message: null 
      });
    }

    // Resolve Role Name
    let roleName = user.role ? user.role.name : 'staff';
    if (!user.role && user.role_id) {
      const r = await Role.findByPk(user.role_id);
      if (r) roleName = r.name;
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Set session variables
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = roleName;
    req.session.companyId = user.company_id || (user.company ? user.company.id : 1);

    // Role & Subscription-based redirection:
    if (req.session.role === 'cashier') {
      return res.redirect('/admin/sales/pos');
    }
    if (req.session.companyId > 1) {
      return res.redirect('/subscriber/dashboard');
    }

    return res.redirect('/admin/dashboard');

  } catch (error) {
    console.error('Login error:', error);
    res.render('admin/login', { 
      error: 'An error occurred during login',
      message: null 
    });
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.redirect('/admin/login');
  });
};

// API: Login endpoint for AJAX
exports.apiLogin = async (req, res) => {
  try {
    const { phone, username } = req.body;
    const rawInput = phone || username;
    let cleanPhone = (rawInput || '').toString().trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) cleanPhone = cleanPhone.substring(2);
    else if (cleanPhone.length > 10 && cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);

    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)' });
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

    if (user.company && (user.company.is_active === 0 || user.company.is_active === false)) {
      return res.status(403).json({ error: 'Your store subscription is currently pending administrator verification. Please wait for approval.' });
    }

    if (!user || user.is_active === 0 || user.is_active === false) {
      return res.status(401).json({ error: 'No active account found for this mobile number or account is pending approval' });
    }

    // Block subscribers from using admin panel login API
    if (user.company_id > 1) {
      return res.status(403).json({
        error: 'Access Denied: You are a registered Store Subscriber. Please use the Subscriber Portal (/subscriber/login) to access your store.'
      });
    }

    let roleName = user.role ? user.role.name : 'staff';
    if (!user.role && user.role_id) {
      const r = await Role.findByPk(user.role_id);
      if (r) roleName = r.name;
    }

    await user.update({ last_login: new Date() });

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = roleName;
    req.session.companyId = user.company_id || (user.company ? user.company.id : 1);

    res.json({ 
      success: true, 
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name || user.username,
        name: user.first_name || user.username,
        phone: user.phone,
        email: user.email,
        role: roleName,
        company: user.company ? user.company.name : 'Billing Store'
      }
    });

  } catch (error) {
    console.error('API login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// =============================================
// MOBILE NUMBER + OTP AUTHENTICATION
// =============================================

// Send Login OTP
exports.sendLoginOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    let cleanPhone = (phone || '').toString().trim().replace(/[^0-9]/g, '');

    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.substring(2);
    } else if (cleanPhone.length > 10 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }

    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)' 
      });
    }

    // Find user by phone or username
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
        error: `No registered account found with mobile number: ${cleanPhone}`
      });
    }

    // Block subscribers from requesting OTP on admin portal
    if (user.company_id > 1) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: You are a registered Store Subscriber. Please request your OTP on the Subscriber Portal at /subscriber/login.'
      });
    }

    // Check active store / user status
    if ((user.company && (user.company.is_active === 0 || user.company.is_active === false)) || user.is_active === 0) {
      return res.status(403).json({
        success: false,
        error: 'Your store subscription is currently pending administrator approval. Please wait for admin verification.'
      });
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    // Store in session
    req.session.loginOtp = {
      phone: cleanPhone,
      otp: otp,
      userId: user.id,
      expiresAt: expiresAt,
      attempts: 0
    };

    console.log(`\n========================================`);
    console.log(`🔑 [GROCERY POS - LOGIN OTP GENERATED]`);
    console.log(`👤 User: ${user.username} (${user.first_name || ''} ${user.last_name || ''})`);
    console.log(`📱 Mobile: +91 ${cleanPhone}`);
    console.log(`🔢 OTP Code: ${otp}`);
    console.log(`⏰ Valid For: 5 Minutes (Expires at ${new Date(expiresAt).toLocaleTimeString()})`);
    console.log(`========================================\n`);

    return res.json({
      success: true,
      message: `OTP sent successfully to +91 ${cleanPhone}`,
      phone: cleanPhone,
      otp: otp,
      expiresIn: 300
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate OTP. Please try again.'
    });
  }
};

// Verify Login OTP
exports.verifyLoginOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    let cleanPhone = (phone || '').toString().trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) cleanPhone = cleanPhone.substring(2);
    const cleanOtp = (otp || '').toString().trim();

    if (!cleanPhone || !cleanOtp) {
      return res.status(400).json({
        success: false,
        error: 'Mobile number and 6-digit OTP are required'
      });
    }

    const sessionOtp = req.session.loginOtp;

    if (!sessionOtp || !sessionOtp.otp) {
      return res.status(400).json({
        success: false,
        error: 'No OTP requested. Please enter your mobile number and request an OTP first.'
      });
    }

    if (Date.now() > sessionOtp.expiresAt) {
      delete req.session.loginOtp;
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
        delete req.session.loginOtp;
        return res.status(400).json({
          success: false,
          error: 'Too many incorrect attempts. Please request a new OTP.'
        });
      }
      return res.status(400).json({
        success: false,
        error: 'Incorrect OTP. Please check and enter the 6-digit code again.'
      });
    }

    // OTP Verified! Fetch user
    const user = await User.findByPk(sessionOtp.userId, {
      include: [
        { association: 'company', model: Company },
        { association: 'role', model: Role }
      ]
    });

    if (!user || user.is_active === 0 || user.is_active === false) {
      delete req.session.loginOtp;
      return res.status(403).json({
        success: false,
        error: 'User account is disabled or inactive'
      });
    }

    // Block subscribers from verifying OTP on admin login
    if (user.company_id > 1) {
      delete req.session.loginOtp;
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Store Subscribers must log in at the Subscriber Portal (/subscriber/login).'
      });
    }

    let roleName = user.role ? user.role.name : 'staff';
    if (!user.role && user.role_id) {
      const r = await Role.findByPk(user.role_id);
      if (r) roleName = r.name;
    }

    await user.update({ last_login: new Date() });

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = roleName;
    req.session.companyId = user.company_id || (user.company ? user.company.id : 1);

    delete req.session.loginOtp;

    let redirectUrl = '/admin/dashboard';
    if (roleName === 'cashier') {
      redirectUrl = '/admin/sales/pos';
    } else if (req.session.companyId > 1) {
      redirectUrl = '/subscriber/dashboard';
    }

    console.log(`✅ [LOGIN SUCCESS] ${user.username} (${roleName}) logged in via Mobile OTP! Redirecting: ${redirectUrl}`);

    return res.json({
      success: true,
      message: 'OTP verified successfully! Logging you in...',
      redirectUrl: redirectUrl,
      user: {
        id: user.id,
        username: user.username,
        role: roleName,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during OTP verification'
    });
  }
};

