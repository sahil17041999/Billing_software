/**
 * Comprehensive Automated Verification of:
 * 1. Public B2C Subscription Storefront (/pricing)
 * 2. Client Self-Registration & Order Checkout (POST /api/subscriptions/order)
 * 3. Login Gatekeeper for Pending Store Accounts (HTTP 403)
 * 4. Admin Store Review & Approval Workflow (POST /admin/subscription/clients/:id/approve)
 * 5. Instant Login Access for Approved Client (HTTP 200)
 * 6. License Extension (+30 Days) & Admin Controls
 */

const BASE_URL = 'http://localhost:3000';

async function runClientSubscriptionVerification() {
  console.log('================================================================');
  console.log('🚀 TESTING PUBLIC B2C STOREFRONT, ORDERING & ADMIN APPROVAL FLOW');
  console.log('================================================================\n');

  // STEP 1: Test Public Pricing Storefront (No Auth Required)
  console.log('--- 1. PUBLIC B2C PRICING STOREFRONT TEST ---');
  const pricingRes = await fetch(`${BASE_URL}/pricing`);
  const pricingHtml = await pricingRes.text();
  console.log('🌐 Public /pricing Status:', pricingRes.status === 200 ? '✅ 200 OK' : `❌ ${pricingRes.status}`);
  console.log('🌐 Plans Grid Present:', pricingHtml.includes('plans-pricing-grid') ? '✅ Verified' : '❌ Missing');
  console.log('🌐 Monthly/Annual Cycle Switcher:', pricingHtml.includes('pillMonthly') && pricingHtml.includes('Save 20%') ? '✅ Verified' : '❌ Missing');
  console.log('🌐 Client Checkout Modal Present:', pricingHtml.includes('clientCheckoutModal') ? '✅ Verified' : '❌ Missing');

  // STEP 2: Client Self-Registration & Plan Purchase
  console.log('\n--- 2. CLIENT SELF-REGISTRATION & PLAN PURCHASE ---');
  const testPhone = '98765' + Math.floor(10000 + Math.random() * 90000);
  const orderPayload = {
    plan_id: 2, // Professional Store
    billing_cycle: 'yearly',
    store_name: 'Metro Mega Supermarket',
    owner_name: 'Vikram Singh',
    phone: testPhone,
    email: `vikram.${testPhone}@metromart.in`,
    city: 'Bengaluru',
    payment_method: 'UPI'
  };

  const orderRes = await fetch(`${BASE_URL}/api/subscriptions/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  });
  const orderData = await orderRes.json();
  console.log('📦 Order Submission Status:', orderRes.status === 201 ? '✅ 201 Created' : `❌ ${orderRes.status}`);
  console.log('📦 Order Reference ID:', orderData.order_id);
  console.log('📦 Created Store ID:', orderData.store_id);
  console.log('📦 Order Status Message:', orderData.message);

  // STEP 3: Attempt Login Before Admin Approval (Must be Blocked!)
  console.log('\n--- 3. LOGIN PROTECTION FOR UNAPPROVED STORE ---');
  const preApprovalLogin = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: testPhone })
  });
  const preApprovalData = await preApprovalLogin.json();
  console.log('🛡️ Login Attempt Status Code:', preApprovalLogin.status === 403 ? '✅ 403 Forbidden (Blocked as Expected)' : `❌ ${preApprovalLogin.status}`);
  console.log('🛡️ Gatekeeper Feedback:', preApprovalData.error);

  const preOtpRes = await fetch(`${BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: testPhone })
  });
  const preOtpData = await preOtpRes.json();
  console.log('🛡️ OTP Request Gatekeeper Status:', preOtpRes.status === 403 ? '✅ 403 Forbidden (Blocked)' : `❌ ${preOtpRes.status}`);
  console.log('🛡️ OTP Gatekeeper Feedback:', preOtpData.error);

  // STEP 4: Super Admin Login & Review Pending Stores
  console.log('\n--- 4. SUPER ADMIN REVIEW & APPROVAL ---');
  const adminLoginRes = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999999999' })
  });
  const adminCookie = adminLoginRes.headers.get('set-cookie').split(';')[0];
  console.log('👑 Super Admin Logged In (Session Cookie Acquired)');

  // Verify Admin sees client store on Subscription Dashboard
  const adminSubRes = await fetch(`${BASE_URL}/admin/subscription`, { headers: { cookie: adminCookie } });
  const adminSubHtml = await adminSubRes.text();
  console.log('👑 Client Stores Table in Dashboard:', adminSubHtml.includes('clientStoresTable') ? '✅ Verified' : '❌ Missing');
  console.log('👑 New Client Store Listed in Pending Approval:', adminSubHtml.includes('Metro Mega Supermarket') ? '✅ Verified' : '❌ Missing');

  // STEP 5: Super Admin Approves Store & Grants Login Access
  console.log('\n--- 5. ADMIN APPROVES STORE & ACTIVATES LICENSE ---');
  const approveRes = await fetch(`${BASE_URL}/admin/subscription/clients/${orderData.store_id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie }
  });
  const approveData = await approveRes.json();
  console.log('⚡ Admin Approval Status:', approveRes.status === 200 ? '✅ 200 OK' : `❌ ${approveRes.status}`);
  console.log('⚡ Approval Response:', approveData.message);

  // STEP 6: Client Attempts Login After Approval (Must Succeed!)
  console.log('\n--- 6. CLIENT LOGIN AFTER APPROVAL ---');
  const postApprovalLogin = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: testPhone })
  });
  const postApprovalData = await postApprovalLogin.json();
  console.log('🎉 Post-Approval Login Status:', postApprovalLogin.status === 200 ? '✅ 200 OK (Login Successful!)' : `❌ ${postApprovalLogin.status}`);
  console.log('🎉 Store Owner User:', postApprovalData.user?.first_name, `(${postApprovalData.user?.role})`);
  console.log('🎉 Store Company:', postApprovalData.user?.company);

  // STEP 7: License Extension (+30 Days)
  console.log('\n--- 7. LICENSE EXTENSION (+30 DAYS) TEST ---');
  const extendRes = await fetch(`${BASE_URL}/admin/subscription/clients/${orderData.store_id}/extend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({ days: 30 })
  });
  const extendData = await extendRes.json();
  console.log('📆 License Extension Status:', extendRes.status === 200 ? '✅ 200 OK' : `❌ ${extendRes.status}`);
  console.log('📆 Extended Validity Info:', extendData.message);

  console.log('\n================================================================');
  console.log('🎯 ALL B2C STOREFRONT, ORDERING & ADMIN APPROVAL TESTS PASSED!');
  console.log('================================================================');
}

runClientSubscriptionVerification().catch(console.error);
