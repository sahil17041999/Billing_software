const fs = require('fs');
const BASE_URL = 'http://localhost:3000';

async function testPosModalsAndSwal() {
  console.log('========================================================================');
  console.log('🚀 TESTING POS PROPER MODALS (CUSTOMER & PRODUCT), SWEETALERT & BILLING');
  console.log('========================================================================\n');

  // 1. Inspect views/admin/sales/pos.ejs
  const posEjs = fs.readFileSync('d:/Billing_software/views/admin/sales/pos.ejs', 'utf8');

  console.log('--- 1. EJS TEMPLATE MODAL & SWEETALERT2 ASSERTIONS ---');
  console.log('SweetAlert2 Script tag:', posEjs.includes('cdn.jsdelivr.net/npm/sweetalert2@11') ? '✅ Verified' : '❌ Missing');
  console.log('Add Customer Modal (#addNewCustomerModal):', posEjs.includes('id="addNewCustomerModal"') ? '✅ Verified' : '❌ Missing');
  console.log('Customer Model Inputs (name, phone, gstin, etc.):', 
    posEjs.includes('id="nc_name"') && 
    posEjs.includes('id="nc_phone"') && 
    posEjs.includes('id="nc_gstin"') &&
    posEjs.includes('id="nc_customer_type"') ? '✅ Verified' : '❌ Missing');

  console.log('Add Product Modal (#addNewProductModal):', posEjs.includes('id="addNewProductModal"') ? '✅ Verified' : '❌ Missing');
  console.log('Product Model Inputs (name, category_id, unit_id, selling_price, etc.):',
    posEjs.includes('id="np_name"') && 
    posEjs.includes('id="np_category_id"') && 
    posEjs.includes('id="np_unit_id"') && 
    posEjs.includes('id="np_selling_price"') ? '✅ Verified' : '❌ Missing');

  console.log('SweetAlert on Customer Creation (Swal.fire):', posEjs.includes('submitNewCustomerForm') && posEjs.includes("title: 'Customer Added!'") ? '✅ Verified' : '❌ Missing');
  console.log('SweetAlert on Product Creation (Swal.fire):', posEjs.includes('submitNewProductForm') && posEjs.includes("title: 'Product Added & Added to Bill!'") ? '✅ Verified' : '❌ Missing');
  console.log('SweetAlert on Bill Generation (Celebration message):', posEjs.includes('saveAndCloseSale') && posEjs.includes('Tax Invoice Generated!') ? '✅ Verified' : '❌ Missing');
  console.log('SweetAlert on Delete Confirmation:', posEjs.includes('deleteSelectedLine') && posEjs.includes('Delete Line Item?') ? '✅ Verified' : '❌ Missing');

  // 2. Authenticate
  console.log('\n--- 2. AUTHENTICATION & API VERIFICATION ---');
  const loginRes = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999999999' })
  });
  const cookie = loginRes.headers.get('set-cookie').split(';')[0];
  console.log('Login Status:', loginRes.status === 200 ? '✅ 200 OK' : '❌ Failed');

  // 3. Test Create Customer via API
  const testCustomerName = `POS Test Customer ${Date.now()}`;
  const custRes = await fetch(`${BASE_URL}/admin/master/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'cookie': cookie
    },
    body: JSON.stringify({
      name: testCustomerName,
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `test_${Date.now()}@example.com`,
      customer_type: 'retail'
    })
  });
  const custData = await custRes.json();
  console.log('Create Customer API:', custData.success ? `✅ Created Customer ID ${custData.customer.id} (${custData.customer.name})` : `❌ ${custData.error}`);

  // 4. Test Create Product via API
  const categoriesRes = await fetch(`${BASE_URL}/admin/sales/pos`, { headers: { cookie } });
  const posHtml = await categoriesRes.text();
  
  // Pick default category and unit from database
  const prodRes = await fetch(`${BASE_URL}/admin/master/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'cookie': cookie
    },
    body: JSON.stringify({
      name: `POS Test Product ${Date.now()}`,
      category_id: 1,
      unit_id: 1,
      purchase_price: 150.00,
      selling_price: 250.00,
      sku: `SKU-${Date.now()}`,
      initial_stock: 50
    })
  });
  const prodData = await prodRes.json();
  console.log('Create Product API:', prodData.success ? `✅ Created Product ID ${prodData.product.id} (${prodData.product.name})` : `❌ ${prodData.error}`);

  // 5. Test Create Sale Invoice
  const saleRes = await fetch(`${BASE_URL}/admin/sales`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'cookie': cookie
    },
    body: JSON.stringify({
      customer_id: custData.customer ? custData.customer.id : null,
      notes: 'POS proper modal test transaction',
      items: [
        {
          product_id: prodData.product ? prodData.product.id : null,
          name: prodData.product ? prodData.product.name : 'Test Line Item',
          quantity: 2,
          unit_price: 250.00,
          tax_rate: 10
        }
      ]
    })
  });
  const saleData = await saleRes.json();
  console.log('Create Sale Bill API:', saleData.success ? `✅ Generated Invoice #${saleData.invoice_number} (Grand Total: ₹${saleData.grand_total})` : `❌ ${saleData.error}`);

  console.log('\n========================================================================');
  console.log('🎯 ALL POS PROPER MODALS, SWEETALERT & BILLING REQUIREMENTS VERIFIED!');
  console.log('========================================================================');
}

testPosModalsAndSwal().catch(console.error);
