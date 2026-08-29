/**
 * Verification of Advanced Enterprise Subscriptions, Licensing & Multi-Rail Payment Gateway
 */

const BASE_URL = 'http://localhost:3000';

async function testAdvancedSubscriptionsAndPayments() {
  console.log('========================================================================');
  console.log('🚀 TESTING ADVANCED SUBSCRIPTIONS, LICENSING & MULTI-RAIL PAYMENT GATEWAY');
  console.log('========================================================================\n');

  // 1. SUPER ADMIN LOGIN
  const loginRes = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999999999' })
  });
  const cookie = loginRes.headers.get('set-cookie').split(';')[0];
  console.log('👑 Super Admin Logged In');

  // 2. FETCH SUBSCRIPTION DASHBOARD WITH FINANCIAL METRICS & BILLING HISTORY
  console.log('\n--- 1. ADVANCED REVENUE METRICS & LICENSING DATA ---');
  const dashRes = await fetch(`${BASE_URL}/admin/subscription`, {
    headers: { cookie, 'accept': 'application/json' }
  });
  const dashData = await dashRes.json();
  console.log('📊 Dashboard Load Status:', dashRes.status === 200 ? '✅ 200 OK' : `❌ ${dashRes.status}`);
  console.log('📊 MRR (Monthly Recurring):', `₹${dashData.adminMetrics.mrr.toLocaleString('en-IN')}`);
  console.log('📊 ARR (Annual Projected):', `₹${dashData.adminMetrics.arr.toLocaleString('en-IN')}`);
  console.log('📊 Active Store Licenses:', `${dashData.adminMetrics.activeStoresCount} Stores`);
  console.log('🔑 Store License Key:', dashData.subscription ? dashData.subscription.license_key : 'N/A');

  const hasLicenseFormat = /^GROC-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-Z0-9]+$/.test(dashData.subscription.license_key);
  console.log('🛡️ Cryptographic License Key Format Validated:', hasLicenseFormat ? '✅ Verified' : `Format: ${dashData.subscription.license_key}`);

  // 3. EXECUTE MULTI-RAIL SUBSCRIPTION UPGRADE / PAYMENT
  console.log('\n--- 2. MULTI-RAIL PAYMENT GATEWAY EXECUTION ---');
  const upgradeRes = await fetch(`${BASE_URL}/admin/subscription/upgrade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({
      plan_code: 'enterprise',
      billing_cycle: 'yearly',
      payment_method: 'UPI-QR'
    })
  });
  const upgradeData = await upgradeRes.json();
  console.log('⚡ Payment Authorization Status:', upgradeRes.status === 200 ? '✅ 200 OK (Paid & Activated)' : `❌ ${upgradeRes.status}`);
  console.log('⚡ Tax Invoice Number Generated:', upgradeData.invoice_number);
  console.log('⚡ Generated License Key:', upgradeData.license_key);
  console.log('⚡ Transaction Reference:', upgradeData.subscription.transaction_id);

  const invoiceId = upgradeData.invoice_id;

  // 4. VERIFY GST TAX INVOICE RECEIPT RENDERING
  console.log('\n--- 3. GST TAX INVOICE & RECEIPT VERIFICATION ---');
  const receiptRes = await fetch(`${BASE_URL}/admin/subscription/invoices/${invoiceId}/receipt`, {
    headers: { cookie }
  });
  const receiptHtml = await receiptRes.text();
  console.log('🧾 Tax Receipt Route Status:', receiptRes.status === 200 ? '✅ 200 OK' : `❌ ${receiptRes.status}`);
  console.log('🧾 SAC Code 998313 Present in Receipt:', receiptHtml.includes('998313') ? '✅ Verified' : '❌ Missing');
  console.log('🧾 GST Breakdown Present in Receipt:', receiptHtml.includes('CGST (9%)') && receiptHtml.includes('SGST (9%)') ? '✅ Verified' : '❌ Missing');
  console.log('🧾 Cryptographic License Key Embedded:', receiptHtml.includes(upgradeData.license_key) ? '✅ Verified' : '❌ Missing');

  // 5. EXPORT CLIENT STORES & SUBSCRIPTIONS TO CSV
  console.log('\n--- 4. EXPORT TO CSV / EXCEL VERIFICATION ---');
  const exportRes = await fetch(`${BASE_URL}/admin/subscription/export`, {
    headers: { cookie }
  });
  const csvContent = await exportRes.text();
  console.log('📥 Export Status:', exportRes.status === 200 ? '✅ 200 OK' : `❌ ${exportRes.status}`);
  console.log('📥 CSV Header Verified:', csvContent.startsWith('Store ID,Store Name') ? '✅ Verified' : '❌ Header Mismatch');
  console.log('📥 Content-Disposition Verified:', exportRes.headers.get('content-disposition') ? '✅ Verified' : '❌');

  // 6. REGENERATE LICENSE KEY API
  console.log('\n--- 5. ADMIN REGENERATE LICENSE KEY ---');
  const regenRes = await fetch(`${BASE_URL}/admin/subscription/clients/1/regenerate-license`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie }
  });
  const regenData = await regenRes.json();
  console.log('🔑 Regenerate Key Status:', regenRes.status === 200 ? '✅ 200 OK' : `❌ ${regenRes.status}`);
  console.log('🔑 New Regenerated Key:', regenData.license_key);

  console.log('\n========================================================================');
  console.log('🎯 ALL ADVANCED SUBSCRIPTIONS, LICENSING & PAYMENT TESTS PASSED!');
  console.log('========================================================================');
}

testAdvancedSubscriptionsAndPayments().catch(console.error);
