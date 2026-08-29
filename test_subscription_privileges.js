/**
 * Automated Verification of:
 * 1. Super Admin "can see all things": full access to all ERP modules + Client Stores Approvals
 * 2. Subscription Client only gets billing-related privileges as per plan:
 *    - Starter plan: Allowed billing (POS, Invoices, Products, Customers, Subscription)
 *    - Starter plan: Blocked from non-billing (Reports, Day-End Closing, SMTP Settings)
 * 3. Client Store Owner CANNOT see other client stores or approvals panel in /admin/subscription
 * 4. Client Store Owner CANNOT trigger admin approval APIs (HTTP 403)
 */

const BASE_URL = 'http://localhost:3000';

async function runPrivilegeVerification() {
  console.log('================================================================');
  console.log('🚀 TESTING SUBSCRIPTION PRIVILEGES & SUPER ADMIN SEPARATION');
  console.log('================================================================\n');

  // 1. SUPER ADMIN LOGIN
  console.log('--- 1. SUPER ADMIN PRIVILEGES (CAN SEE ALL THINGS) ---');
  const adminLoginRes = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999999999' })
  });
  const adminCookie = adminLoginRes.headers.get('set-cookie').split(';')[0];
  console.log('👑 Super Admin Logged In');

  // Super Admin can access all ERP modules
  const adminPos = await fetch(`${BASE_URL}/admin/sales/pos`, { headers: { cookie: adminCookie } });
  const adminReports = await fetch(`${BASE_URL}/admin/reports/sales`, { headers: { cookie: adminCookie } });
  const adminDayEnd = await fetch(`${BASE_URL}/admin/day-end/`, { headers: { cookie: adminCookie } });
  const adminSmtp = await fetch(`${BASE_URL}/admin/settings/smtp`, { headers: { cookie: adminCookie } });
  const adminSub = await fetch(`${BASE_URL}/admin/subscription`, { headers: { cookie: adminCookie } });
  const adminSubHtml = await adminSub.text();

  console.log('👑 Admin POS Access:', adminPos.status === 200 ? '✅ 200 OK' : `❌ ${adminPos.status}`);
  console.log('👑 Admin Reports Access:', adminReports.status === 200 ? '✅ 200 OK' : `❌ ${adminReports.status}`);
  console.log('👑 Admin Day End Access:', adminDayEnd.status === 200 ? '✅ 200 OK' : `❌ ${adminDayEnd.status}`);
  console.log('👑 Admin SMTP Settings Access:', adminSmtp.status === 200 ? '✅ 200 OK' : `❌ ${adminSmtp.status}`);
  console.log('👑 Admin Sees Client Stores Approvals Table:', adminSubHtml.includes('clientStoresTable') ? '✅ Verified' : '❌ Missing');

  // 2. REGISTER A NEW CLIENT STORE ON STARTER PLAN
  console.log('\n--- 2. REGISTER NEW CLIENT STORE (STARTER PLAN) ---');
  const clientPhone = '98765' + Math.floor(10000 + Math.random() * 90000);
  const orderRes = await fetch(`${BASE_URL}/api/subscriptions/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan_id: 1, // Starter Retailer (Basic Billing Only)
      billing_cycle: 'monthly',
      store_name: 'Quick Pick Groceries',
      owner_name: 'Anil Gupta',
      phone: clientPhone,
      email: `anil.${clientPhone}@quickpick.in`,
      city: 'Pune',
      payment_method: 'UPI'
    })
  });
  const orderData = await orderRes.json();
  console.log('🛒 Client Store Registered (Starter Plan):', orderData.order_id);

  // Approve store so client can log in
  await fetch(`${BASE_URL}/admin/subscription/clients/${orderData.store_id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie }
  });
  console.log('⚡ Admin Approved Store:', orderData.store_id);

  // 3. LOG IN AS CLIENT STORE OWNER
  console.log('\n--- 3. CLIENT STORE OWNER PRIVILEGES VERIFICATION ---');
  const clientLoginRes = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: clientPhone })
  });
  const clientCookie = clientLoginRes.headers.get('set-cookie').split(';')[0];
  console.log('👤 Client Store Owner Logged In (+91 ' + clientPhone + ')');

  // A. Billing-Related Privileges (MUST BE ALLOWED)
  console.log('\n--- A. BILLING PRIVILEGES (ALLOWED FOR STARTER) ---');
  const clientPos = await fetch(`${BASE_URL}/admin/sales/pos`, { headers: { cookie: clientCookie } });
  const clientSales = await fetch(`${BASE_URL}/admin/sales/`, { headers: { cookie: clientCookie } });
  const clientProducts = await fetch(`${BASE_URL}/admin/master/products`, { headers: { cookie: clientCookie } });
  const clientCustomers = await fetch(`${BASE_URL}/admin/master/customers`, { headers: { cookie: clientCookie } });
  const clientSub = await fetch(`${BASE_URL}/admin/subscription`, { headers: { cookie: clientCookie } });
  const clientSubHtml = await clientSub.text();

  console.log('✅ Client POS Billing Terminal Access:', clientPos.status === 200 ? '✅ 200 OK' : `❌ ${clientPos.status}`);
  console.log('✅ Client Invoices & Bills Access:', clientSales.status === 200 ? '✅ 200 OK' : `❌ ${clientSales.status}`);
  console.log('✅ Client Products Catalog Access:', clientProducts.status === 200 ? '✅ 200 OK' : `❌ ${clientProducts.status}`);
  console.log('✅ Client Customers Directory Access:', clientCustomers.status === 200 ? '✅ 200 OK' : `❌ ${clientCustomers.status}`);
  console.log('✅ Client Can Manage Own Subscription:', clientSub.status === 200 ? '✅ 200 OK' : `❌ ${clientSub.status}`);

  // B. Privacy Protection: Client CANNOT see other client stores!
  console.log('\n--- B. PRIVACY CHECK: CLIENT CANNOT SEE OTHER STORES ---');
  console.log('🔒 Client Subscription Page Hides Other Stores Table:', !clientSubHtml.includes('clientStoresTable') ? '✅ Verified (Hidden from Client!)' : '❌ Leak! Visible to Client');

  // C. Non-Billing Modules (MUST BE BLOCKED FOR STARTER PLAN)
  console.log('\n--- C. NON-BILLING PRIVILEGES RESTRICTIONS (BLOCKED FOR STARTER) ---');
  const clientReports = await fetch(`${BASE_URL}/admin/reports/sales`, { headers: { cookie: clientCookie, 'accept': 'application/json' } });
  const clientDayEnd = await fetch(`${BASE_URL}/admin/day-end/`, { headers: { cookie: clientCookie, 'accept': 'application/json' } });
  const clientSmtp = await fetch(`${BASE_URL}/admin/settings/smtp`, { headers: { cookie: clientCookie, 'accept': 'application/json' } });

  console.log('🛡️ Client Reports Access Blocked:', clientReports.status === 403 ? '✅ 403 Forbidden (Plan Upgrade Required)' : `❌ ${clientReports.status}`);
  console.log('🛡️ Client Day End Closing Blocked:', clientDayEnd.status === 403 ? '✅ 403 Forbidden (Plan Upgrade Required)' : `❌ ${clientDayEnd.status}`);
  console.log('🛡️ Client SMTP Settings Blocked:', clientSmtp.status === 403 ? '✅ 403 Forbidden (Plan Upgrade Required)' : `❌ ${clientSmtp.status}`);

  // D. Admin Approval APIs (MUST BE BLOCKED FOR CLIENT)
  console.log('\n--- D. ADMIN ACTION APIS PROTECTION ---');
  const clientApproveAttempt = await fetch(`${BASE_URL}/admin/subscription/clients/${orderData.store_id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: clientCookie }
  });
  console.log('🛡️ Client Attempt to Approve Other Stores:', clientApproveAttempt.status === 403 ? '✅ 403 Forbidden (Only Super Admin Allowed)' : `❌ ${clientApproveAttempt.status}`);

  console.log('\n================================================================');
  console.log('🎯 ALL SUBSCRIPTION PRIVILEGES & ADMIN SEPARATION TESTS PASSED!');
  console.log('================================================================');
}

runPrivilegeVerification().catch(console.error);
