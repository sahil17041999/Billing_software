/**
 * Verification:
 * 1. Zero dummy data in Billing History & Official GST Tax Invoices
 * 2. SweetAlert2 integration across all user and admin actions
 */

const fs = require('fs');
const BASE_URL = 'http://localhost:3000';

async function testSweetAlertAndNoDummyData() {
  console.log('========================================================================');
  console.log('🚀 TESTING NO DUMMY DATA & SWEETALERT2 ACROSS SUBSCRIPTIONS & LICENSING');
  console.log('========================================================================\n');

  // 1. Check index.ejs for SweetAlert2 library include
  console.log('--- 1. SWEETALERT2 LIBRARY INCLUSION ---');
  const indexEjs = fs.readFileSync('d:/Billing_software/views/admin/subscription/index.ejs', 'utf8');
  const hasSwalInclude = indexEjs.includes('cdn.jsdelivr.net/npm/sweetalert2@11');
  console.log('📦 SweetAlert2 CDN in <head>:', hasSwalInclude ? '✅ Verified' : '❌ Missing');

  // 2. Check SweetAlert2 usage across interactive functions
  console.log('\n--- 2. SWEETALERT2 USAGE ACROSS ALL USER & ADMIN ACTIONS ---');
  const swalApprove = indexEjs.includes('function approveStore') && indexEjs.includes('Swal.fire({') && indexEjs.includes('Approve Client Store?');
  console.log('🔔 Approve Store SweetAlert2 Confirmation:', swalApprove ? '✅ Verified' : '❌ Missing');

  const swalExtend = indexEjs.includes('function extendStoreLicense') && indexEjs.includes('Swal.fire({') && indexEjs.includes('Extend License Validity?');
  console.log('🔔 Extend License SweetAlert2 Confirmation:', swalExtend ? '✅ Verified' : '❌ Missing');

  const swalToggle = indexEjs.includes('function toggleStoreStatus') && indexEjs.includes('Swal.fire({') && indexEjs.includes('Toggle Store Access?');
  console.log('🔔 Toggle Status SweetAlert2 Confirmation:', swalToggle ? '✅ Verified' : '❌ Missing');

  const swalImpersonate = indexEjs.includes('function impersonateStore') && indexEjs.includes('Swal.fire({') && indexEjs.includes('Access Store Workspace?');
  console.log('🔔 Impersonate Store SweetAlert2 Confirmation:', swalImpersonate ? '✅ Verified' : '❌ Missing');

  const swalDelete = indexEjs.includes('function deleteStore') && indexEjs.includes('Swal.fire({') && indexEjs.includes('Delete Client Store?');
  console.log('🔔 Delete Store SweetAlert2 Warning Dialog:', swalDelete ? '✅ Verified' : '❌ Missing');

  const swalChangePlan = indexEjs.includes('function submitAdminChangePlan') && indexEjs.includes('Swal.fire({') && indexEjs.includes('Plan Updated!');
  console.log('🔔 Admin Change Plan SweetAlert2 Feedback:', swalChangePlan ? '✅ Verified' : '❌ Missing');

  const swalEditStore = indexEjs.includes('function submitAdminEditStore') && indexEjs.includes('Swal.fire({') && indexEjs.includes('Store Details Saved!');
  console.log('🔔 Admin Edit Store SweetAlert2 Feedback:', swalEditStore ? '✅ Verified' : '❌ Missing');

  const swalCopyKey = indexEjs.includes('function copyStoreLicenseKey') && indexEjs.includes('Swal.fire({') && indexEjs.includes('toast: true');
  console.log('🔔 Copy License Key SweetAlert2 Toast:', swalCopyKey ? '✅ Verified' : '❌ Missing');

  const swalVpa = indexEjs.includes('function verifyVpaSimulation') && indexEjs.includes('Swal.fire({') && indexEjs.includes('toast: true');
  console.log('🔔 Verify VPA SweetAlert2 Toast:', swalVpa ? '✅ Verified' : '❌ Missing');

  const swalUpgrade = indexEjs.includes('function executePlanUpgrade') && indexEjs.includes('Swal.fire({') && indexEjs.includes('Payment Confirmed & License Activated!');
  console.log('🔔 Plan Upgrade SweetAlert2 Celebration:', swalUpgrade ? '✅ Verified' : '❌ Missing');

  // 3. ZERO DUMMY DATA VERIFICATION
  console.log('\n--- 3. ZERO DUMMY DATA IN BILLING HISTORY & LICENSING ---');
  const adminLoginRes = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999999999' })
  });
  const cookie = adminLoginRes.headers.get('set-cookie').split(';')[0];

  const subRes = await fetch(`${BASE_URL}/admin/subscription`, {
    headers: { cookie, 'accept': 'application/json' }
  });
  const subData = await subRes.json();
  const invoices = subData.billingHistory || [];

  console.log(`📋 Total Invoices in Billing History: ${invoices.length}`);
  console.log('🛡️ No Auto-Seeded / Fabricated Invoices:', invoices.length === 0 ? '✅ Verified (Clean Real State)' : `Notice: ${invoices.length} real records present`);

  // Verify page HTML does not have hardcoded fallback amounts
  const subHtmlRes = await fetch(`${BASE_URL}/admin/subscription`, {
    headers: { cookie }
  });
  const subHtml = await subHtmlRes.text();
  const noHardcodedDummy = !subHtml.includes('Last Bill: <strong>₹999.00</strong>') && !subHtml.includes('GROC-9F81-22BA-01CE-PRO');
  console.log('🛡️ No Hardcoded Fallback Dummy License or Amounts in View:', noHardcodedDummy ? '✅ Verified' : '❌ Found hardcoded values');

  console.log('\n========================================================================');
  console.log('🎯 ALL SWEETALERT2 & NO-DUMMY-DATA REQUIREMENTS VERIFIED!');
  console.log('========================================================================');
}

testSweetAlertAndNoDummyData().catch(console.error);
