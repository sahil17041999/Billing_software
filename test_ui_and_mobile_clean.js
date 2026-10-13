// test_ui_and_mobile_clean.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000';

async function runUIAndMobileCleanTests() {
  console.log('========================================================================================');
  console.log('🎨 VERIFYING CLEAN UI, NO BACK BUTTON, AND FULL MOBILE RESPONSIVENESS');
  console.log('========================================================================================');

  let passed = 0;
  let failed = 0;

  function testAssert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // 1. VERIFY BACK BUTTON REMOVAL IN HEADER
    // -------------------------------------------------------------------------
    console.log('\n--- 1. BACK BUTTON REMOVAL VERIFICATION ---');
    const headerEjs = fs.readFileSync(path.join(__dirname, 'views/partials/header.ejs'), 'utf8');
    testAssert(!headerEjs.includes('globalHeaderBackBtn'), 'globalHeaderBackBtn successfully removed from header.ejs');
    testAssert(!headerEjs.includes('handleGoBack()'), 'handleGoBack() function successfully removed from header.ejs');
    testAssert(!headerEjs.includes('handleGoBack'), 'No handleGoBack references in header.ejs');

    // -------------------------------------------------------------------------
    // 2. HEADER LEFT & RIGHT INTEGRITY
    // -------------------------------------------------------------------------
    console.log('\n--- 2. HEADER ESSENTIAL ELEMENTS ---');
    testAssert(headerEjs.includes('id="mobileMenuToggle"'), 'Hamburger mobileMenuToggle present');
    testAssert(headerEjs.includes('id="globalHeaderSearch"'), 'Omnibar globalHeaderSearch present');
    testAssert(headerEjs.includes('id="headerQuickAddBtn"'), 'Quick Add button (#headerQuickAddBtn) present');
    testAssert(headerEjs.includes('id="notificationDropdownBtn"'), 'Notification bell button present');
    testAssert(headerEjs.includes('id="userDropdownTrigger"'), 'User avatar profile trigger present');

    // -------------------------------------------------------------------------
    // 3. CSS MOBILE SYSTEM INTEGRITY
    // -------------------------------------------------------------------------
    console.log('\n--- 3. CSS SYSTEM & MOBILE RESPONSIVENESS ---');
    const cssContent = fs.readFileSync(path.join(__dirname, 'public/assets/css/admin-theme.css'), 'utf8');
    testAssert(cssContent.includes('.sidebar {') && cssContent.includes('transform: translateX(-100%) !important;'), 'Mobile off-canvas drawer hides off-screen');
    testAssert(cssContent.includes('.sidebar.mobile-open,') && cssContent.includes('transform: translateX(0) !important;'), 'Mobile drawer slides in when open');
    testAssert(cssContent.includes('.page-content {') && cssContent.includes('padding: 14px 12px 68px 12px !important;'), 'Mobile page-content has 68px bottom offset for fixed footer');
    testAssert(cssContent.includes('.app-footer {') && cssContent.includes('position: fixed !important;'), 'Fixed footer strictly defined');
    testAssert(cssContent.includes('left: 0 !important;'), 'Footer snaps to left: 0 on mobile');
    testAssert(cssContent.includes('input, select, textarea, .form-control-modern {') && cssContent.includes('font-size: 16px !important;'), 'Input 16px font size avoids Safari auto-zoom');
    testAssert(cssContent.includes('-webkit-overflow-scrolling: touch !important;'), 'Momentum touch scrolling on tables');

    // -------------------------------------------------------------------------
    // 4. LIVE HTTP REQUEST: ADMIN DASHBOARD (DESKTOP & MOBILE)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. LIVE ADMIN DASHBOARD RENDERING ---');
    const adminLoginRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9999999999' })
    });
    const adminCookie = adminLoginRes.headers.get('set-cookie').split(';')[0];

    const adminDashRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { cookie: adminCookie }
    });
    const adminHtml = await adminDashRes.text();

    testAssert(adminDashRes.status === 200, 'Admin dashboard returns HTTP 200');
    testAssert(!adminHtml.includes('globalHeaderBackBtn'), 'Admin dashboard HTML does NOT contain back button');
    testAssert(adminHtml.includes('id="headerQuickAddBtn"'), 'Admin dashboard HTML contains Quick Add button');
    testAssert(adminHtml.includes('app-footer'), 'Admin dashboard HTML contains fixed app-footer');

    // -------------------------------------------------------------------------
    // 5. LIVE HTTP REQUEST: SUBSCRIBER DASHBOARD (DESKTOP & MOBILE)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. LIVE SUBSCRIBER DASHBOARD RENDERING ---');
    const { User } = require('./models');
    const { Op } = require('sequelize');
    const subUser = await User.findOne({ where: { company_id: { [Op.gt]: 1 }, is_active: 1 } });
    const subPhone = subUser ? subUser.phone : '7517039055';

    const sendOtpRes = await fetch(`${BASE_URL}/subscriber/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: subPhone })
    });
    const sendOtpData = await sendOtpRes.json();
    const otpCookie = sendOtpRes.headers.get('set-cookie').split(';')[0];

    const verifyOtpRes = await fetch(`${BASE_URL}/subscriber/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: otpCookie },
      body: JSON.stringify({ phone: subPhone, otp: sendOtpData.otp })
    });
    const subCookie = verifyOtpRes.headers.get('set-cookie') ? verifyOtpRes.headers.get('set-cookie').split(';')[0] : otpCookie;

    const subDashRes = await fetch(`${BASE_URL}/subscriber/dashboard`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        cookie: subCookie
      }
    });
    const subHtml = await subDashRes.text();

    testAssert(subDashRes.status === 200, 'Subscriber dashboard returns HTTP 200');
    testAssert(!subHtml.includes('globalHeaderBackBtn'), 'Subscriber dashboard HTML does NOT contain back button');
    testAssert(subHtml.includes('id="headerQuickAddBtn"'), 'Subscriber dashboard HTML contains Quick Add button');
    testAssert(subHtml.includes('app-footer'), 'Subscriber dashboard HTML contains fixed app-footer');
    testAssert(subHtml.includes('quick-action-strip'), 'Subscriber dashboard HTML contains quick-action-strip');

    console.log('\n========================================================================================');
    console.log(`🎯 UI & MOBILE CLEAN RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runUIAndMobileCleanTests();
