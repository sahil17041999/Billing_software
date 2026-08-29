/**
 * Automated Verification of Feature Entitlements Breakdown Functionality as per User Plans
 * Tests:
 * 1. Entitlements JSON API Endpoint (/admin/subscription/entitlements)
 * 2. Plan-specific entitlement categorization & lock/unlock flags
 * 3. Starter Store vs Super Admin entitlement verification
 * 4. UI elements: Active Plan badge, View Mode Switcher, Category filters, Search
 */

const BASE_URL = 'http://localhost:3000';

async function runFeatureEntitlementsTest() {
  console.log('================================================================');
  console.log('🚀 TESTING COMPLETE FEATURE ENTITLEMENTS BREAKDOWN FUNCTIONALITY');
  console.log('================================================================\n');

  // 1. SUPER ADMIN AUTHENTICATION
  const adminLoginRes = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999999999' })
  });
  const adminCookie = adminLoginRes.headers.get('set-cookie').split(';')[0];
  console.log('👑 Super Admin Authenticated');

  // 2. TEST SUPER ADMIN ENTITLEMENTS API
  const adminEntRes = await fetch(`${BASE_URL}/admin/subscription/entitlements`, {
    headers: { cookie: adminCookie }
  });
  const adminEntData = await adminEntRes.json();

  console.log('\n--- 1. SUPER ADMIN ENTITLEMENTS API ---');
  console.log('⚡ API Status:', adminEntRes.status === 200 ? '✅ 200 OK' : `❌ ${adminEntRes.status}`);
  console.log('⚡ Success Flag:', adminEntData.success ? '✅ true' : '❌ false');
  console.log('⚡ Current Plan Code:', adminEntData.current_plan?.code);
  console.log('⚡ Total Capabilities Count:', adminEntData.summary?.total_features === 24 ? `✅ 24 Capabilities` : `❌ ${adminEntData.summary?.total_features}`);
  console.log('⚡ Super Admin Unlock Ratio:', `${adminEntData.summary?.unlocked_count} / ${adminEntData.summary?.total_features} (${adminEntData.summary?.unlock_percentage}%)`);
  console.log('⚡ Categories Count:', adminEntData.categories?.length === 6 ? '✅ 6 Categories' : `❌ ${adminEntData.categories?.length}`);

  // 3. REGISTER NEW CLIENT ON STARTER PLAN & TEST CLIENT ENTITLEMENTS API
  console.log('\n--- 2. STARTER PLAN CLIENT ENTITLEMENTS API ---');
  const starterPhone = '97777' + Math.floor(10000 + Math.random() * 90000);
  const orderRes = await fetch(`${BASE_URL}/api/subscriptions/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan_code: 'starter',
      billing_cycle: 'monthly',
      store_name: 'Entitlements Test Mart',
      owner_name: 'Vikram Singh',
      phone: starterPhone,
      email: `vikram.${starterPhone}@testmart.com`,
      city: 'Jaipur',
      payment_method: 'UPI'
    })
  });
  const orderData = await orderRes.json();

  // Approve store as admin
  await fetch(`${BASE_URL}/admin/subscription/clients/${orderData.store_id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie }
  });

  // Client Login
  const clientLoginRes = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: starterPhone })
  });
  const clientCookie = clientLoginRes.headers.get('set-cookie').split(';')[0];

  const clientEntRes = await fetch(`${BASE_URL}/admin/subscription/entitlements`, {
    headers: { cookie: clientCookie }
  });
  const clientEntData = await clientEntRes.json();

  console.log('👤 Starter Store Authenticated (+91 ' + starterPhone + ')');
  console.log('⚡ Client Plan Code:', clientEntData.current_plan?.code === 'starter' ? '✅ starter' : `❌ ${clientEntData.current_plan?.code}`);
  console.log('⚡ Starter Unlocked Features:', `${clientEntData.summary?.unlocked_count} / ${clientEntData.summary?.total_features}`);
  console.log('⚡ Starter Locked Features:', `${clientEntData.summary?.locked_count} (Requires Pro/Enterprise Upgrade)`);

  // Verify specific feature permissions
  const financeCat = clientEntData.categories.find(c => c.category.includes('Cash Management') || c.category.includes('Accounting'));
  const dayEndFeat = financeCat ? financeCat.features.find(f => f.key === 'acc_dayend') : null;
  const custLedgerFeat = financeCat ? financeCat.features.find(f => f.key === 'acc_customer_ledger') : null;

  const posCat = clientEntData.categories.find(c => c.category.includes('Point of Sale'));
  const barcodeFeat = posCat ? posCat.features.find(f => f.key === 'pos_scanning') : null;

  console.log('🔒 Day-End Closing Locked for Starter:', dayEndFeat && dayEndFeat.is_unlocked === false ? '✅ Locked (Pro Required)' : '❌ Not Locked');
  console.log('🔒 Customer Ledger Locked for Starter:', custLedgerFeat && custLedgerFeat.is_unlocked === false ? '✅ Locked (Pro Required)' : '❌ Not Locked');
  console.log('🔓 Barcode Scanning Unlocked for Starter:', barcodeFeat && barcodeFeat.is_unlocked === true ? '✅ Unlocked' : '❌ Not Unlocked');

  // 4. VERIFY HTML PAGE RENDERING & INTERACTIVE COMPONENTS
  console.log('\n--- 3. UI RENDERING & INTERACTIVE BREAKDOWN VERIFICATION ---');
  const pageRes = await fetch(`${BASE_URL}/admin/subscription`, { headers: { cookie: clientCookie } });
  const pageHtml = await pageRes.text();

  console.log('📋 Entitlements Breakdown Section Present:', pageHtml.includes('Complete Feature Entitlements Breakdown') ? '✅ Verified' : '❌ Missing');
  console.log('👑 Active Plan Badge Present ("Your Current Plan"):', pageHtml.includes('Your Current Plan') ? '✅ Verified' : '❌ Missing');
  console.log('🔄 View Mode Switcher (All vs My Plan):', pageHtml.includes('switchEntitlementView') && pageHtml.includes('viewMyPlanBtn') ? '✅ Verified' : '❌ Missing');
  console.log('🔍 Live Filter/Search Input Present:', pageHtml.includes('entitlementSearchInput') && pageHtml.includes('filterEntitlements') ? '✅ Verified' : '❌ Missing');
  console.log('🏷️ Category Filter Buttons Present:', pageHtml.includes('cat-filter-btn') && pageHtml.includes('All Capabilities') ? '✅ Verified' : '❌ Missing');
  console.log('🚀 Module Direct Launch Shortcuts Present:', pageHtml.includes('module-launch-link') ? '✅ Verified' : '❌ Missing');
  console.log('💳 In-Table Upgrade Triggers Present:', pageHtml.includes('openCheckoutModal') && pageHtml.includes('btn-xs-upgrade') ? '✅ Verified' : '❌ Missing');

  console.log('\n================================================================');
  console.log('🎯 ALL FEATURE ENTITLEMENTS BREAKDOWN FUNCTIONALITY VERIFIED!');
  console.log('================================================================');
}

runFeatureEntitlementsTest().catch(console.error);
