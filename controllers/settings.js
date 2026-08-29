const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { SmtpSetting, Company } = require('../models');

// Ensure upload directory exists
const LOGO_UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'logos');
if (!fs.existsSync(LOGO_UPLOAD_DIR)) {
  fs.mkdirSync(LOGO_UPLOAD_DIR, { recursive: true });
}

/**
 * Get SMTP Settings page
 */
exports.getSmtpSettings = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    if (!companyId) {
      return res.redirect('/admin/login');
    }

    const company = await Company.findByPk(companyId);
    let [smtp] = await SmtpSetting.findOrCreate({
      where: { company_id: companyId },
      defaults: {
        company_id: companyId,
        is_enabled: false,
        host: '',
        port: 587,
        from_email: company?.email || '',
        from_name: company?.name || 'Cloud Point of Sale',
        password: '',
        use_ssl: false,
        require_auth: true
      }
    });

    res.render('admin/settings/smtp', {
      pageTitle: 'SMTP Settings',
      currentPage: 'settings',
      subPage: 'smtp',
      company,
      smtp,
      user: req.user,
      successMsg: req.query.saved === 'true' ? 'SMTP configuration saved successfully.' : null
    });
  } catch (error) {
    console.error('Error fetching SMTP settings:', error);
    res.status(500).render('error', { error: 'Failed to load SMTP settings: ' + error.message });
  }
};

/**
 * Save SMTP Settings
 */
exports.saveSmtpSettings = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Company session not found' });
    }

    const {
      is_enabled,
      host,
      port,
      from_email,
      from_name,
      password,
      use_ssl,
      require_auth
    } = req.body;

    let smtp = await SmtpSetting.findOne({ where: { company_id: companyId } });
    if (!smtp) {
      smtp = await SmtpSetting.create({
        company_id: companyId,
        is_enabled: false
      });
    }

    const isEnabled = is_enabled === true || is_enabled === 'true' || is_enabled === 'on' || is_enabled === 1 || is_enabled === '1';
    const useSsl = use_ssl === true || use_ssl === 'true' || use_ssl === 'on' || use_ssl === 1 || use_ssl === '1';
    const reqAuth = require_auth === true || require_auth === 'true' || require_auth === 'on' || require_auth === 1 || require_auth === '1';

    const updateData = {
      is_enabled: isEnabled,
      host: (host || '').trim(),
      port: port ? parseInt(port, 10) : 587,
      from_email: (from_email || '').trim(),
      from_name: (from_name || '').trim(),
      use_ssl: useSsl,
      require_auth: reqAuth
    };

    // Only update password if a new one is provided (allows keeping existing masked password)
    if (password !== undefined && password !== null && password.trim() !== '') {
      updateData.password = password.trim();
    }

    await smtp.update(updateData);

    if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
      return res.json({
        success: true,
        message: 'SMTP configuration updated successfully!',
        smtp
      });
    }

    return res.redirect('/admin/settings/smtp?saved=true');
  } catch (error) {
    console.error('Error saving SMTP settings:', error);
    if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).render('error', { error: 'Failed to save SMTP settings: ' + error.message });
  }
};

/**
 * Test SMTP Connection & Send Test Email
 */
exports.testSmtpConnection = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const {
      host,
      port,
      from_email,
      from_name,
      password,
      use_ssl,
      require_auth,
      test_email
    } = req.body;

    // Load existing settings if some fields are omitted in test payload
    const existing = await SmtpSetting.findOne({ where: { company_id: companyId } });

    const finalHost = (host || existing?.host || '').trim();
    const finalPort = port ? parseInt(port, 10) : (existing?.port || 587);
    const finalFrom = (from_email || existing?.from_email || '').trim();
    const finalName = (from_name || existing?.from_name || 'Cloud Point of Sale').trim();
    const finalPass = (password !== undefined && password !== null && password !== '') ? password.trim() : (existing?.password || '');
    const finalSsl = use_ssl !== undefined ? (use_ssl === true || use_ssl === 'true' || use_ssl === 1) : !!existing?.use_ssl;
    const finalAuth = require_auth !== undefined ? (require_auth === true || require_auth === 'true' || require_auth === 1) : (existing?.require_auth !== false);

    if (!finalHost) {
      return res.status(400).json({ success: false, error: 'SMTP Host is required for testing connection.' });
    }
    if (!finalFrom) {
      return res.status(400).json({ success: false, error: 'From Email is required for testing connection.' });
    }

    const transportOpts = {
      host: finalHost,
      port: finalPort,
      secure: finalSsl || finalPort === 465,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    };

    if (finalAuth && finalPass) {
      transportOpts.auth = {
        user: finalFrom,
        pass: finalPass
      };
    }

    const transporter = nodemailer.createTransport(transportOpts);

    // Verify SMTP connection
    await transporter.verify();

    // If a recipient test email is specified, dispatch a real test email
    if (test_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(test_email.trim())) {
      const recipient = test_email.trim();
      await transporter.sendMail({
        from: `"${finalName}" <${finalFrom}>`,
        to: recipient,
        subject: `[Verified] SMTP Gateway Test - ${finalName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 20px; border-radius: 8px; text-align: center;">
              <h2 style="margin: 0; font-size: 20px;">✓ SMTP Connection Successful!</h2>
            </div>
            <div style="padding: 20px 0; color: #334155; line-height: 1.6;">
              <p>Congratulations! Your outgoing email gateway is configured properly and successfully dispatched this test verification message.</p>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0; background: #f8fafc; border-radius: 6px;">
                <tr><td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">SMTP Host:</td><td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${finalHost}</td></tr>
                <tr><td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Port:</td><td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${finalPort} (SSL: ${finalSsl ? 'Yes' : 'No'})</td></tr>
                <tr><td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Sender:</td><td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${finalFrom}</td></tr>
                <tr><td style="padding: 8px 12px; font-weight: bold;">Timestamp:</td><td style="padding: 8px 12px;">${new Date().toLocaleString('en-IN')}</td></tr>
              </table>
              <p style="font-size: 12px; color: #64748b; margin: 0;">Automated invoice delivery and POS receipt emailing are ready for live use.</p>
            </div>
          </div>
        `
      });

      return res.json({
        success: true,
        message: `SMTP connection established and test email successfully delivered to ${recipient}!`
      });
    }

    return res.json({
      success: true,
      message: 'SMTP handshake and credentials verified successfully!'
    });

  } catch (error) {
    console.error('SMTP test error:', error);
    let hint = '';
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      hint = ' Authentication failed. For Gmail, make sure you use an "App Password" rather than your regular login password.';
    } else if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT') {
      hint = ' Connection timed out. Please check if the Host and Port are correct, or toggle SSL setting.';
    }
    return res.status(400).json({
      success: false,
      error: (error.message || 'Failed to connect to SMTP server.') + hint
    });
  }
};

/**
 * Upload or Update Company Logo
 */
exports.uploadLogo = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { logoData, logoUrl } = req.body;

    let savedPath = '';

    if (logoData && logoData.startsWith('data:image/')) {
      // Decode base64 image data
      const matches = logoData.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ success: false, error: 'Invalid image format' });
      }

      let ext = matches[1].toLowerCase();
      if (ext === 'svg+xml') ext = 'svg';
      if (ext === 'jpeg') ext = 'jpg';

      const buffer = Buffer.from(matches[2], 'base64');
      const filename = `company-logo-${companyId}-${Date.now()}.${ext}`;
      const fullPath = path.join(LOGO_UPLOAD_DIR, filename);

      fs.writeFileSync(fullPath, buffer);
      savedPath = `/uploads/logos/${filename}`;
    } else if (logoUrl && (logoUrl.startsWith('/') || logoUrl.startsWith('http'))) {
      savedPath = logoUrl.trim();
    } else {
      return res.status(400).json({ success: false, error: 'Please provide a valid image file or URL.' });
    }

    const company = await Company.findByPk(companyId);
    if (company) {
      // Optional: Clean up older custom logo file if it exists in uploads/logos
      if (company.logo_path && company.logo_path.startsWith('/uploads/logos/')) {
        const oldFile = path.join(__dirname, '..', 'public', company.logo_path);
        if (fs.existsSync(oldFile)) {
          try { fs.unlinkSync(oldFile); } catch (e) { /* ignore */ }
        }
      }

      await company.update({ logo_path: savedPath });
    }

    return res.json({
      success: true,
      logo_path: savedPath,
      message: 'Company logo updated successfully!'
    });

  } catch (error) {
    console.error('Error uploading logo:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Remove Company Logo
 */
exports.removeLogo = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const company = await Company.findByPk(companyId);

    if (company && company.logo_path) {
      if (company.logo_path.startsWith('/uploads/logos/')) {
        const oldFile = path.join(__dirname, '..', 'public', company.logo_path);
        if (fs.existsSync(oldFile)) {
          try { fs.unlinkSync(oldFile); } catch (e) { /* ignore */ }
        }
      }
      await company.update({ logo_path: null });
    }

    return res.json({
      success: true,
      message: 'Company logo removed successfully.'
    });
  } catch (error) {
    console.error('Error removing logo:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
