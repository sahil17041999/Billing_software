const http = require('http');

async function testPosFlow() {
  console.log('Testing POS End-to-End Flow...');
  
  // 1. Authenticate
  const loginRes = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999999999' })
  });

  const cookie = loginRes.headers.get('set-cookie');
  console.log('1. Authentication:', loginRes.status === 200 ? '✅ Success' : '❌ Failed');

  // 2. Fetch POS page HTML
  const posRes = await fetch('http://localhost:3000/admin/sales/pos', {
    headers: { cookie }
  });
  const posHtml = await posRes.text();
  console.log('2. GET /admin/sales/pos:', posRes.status === 200 ? '✅ 200 OK' : '❌ Failed');

  // Verify HTML contains required reference image elements
  const checks = [
    { name: 'Edit INVOICE Title', test: posHtml.includes('Edit INVOICE - Company:') },
    { name: 'Sold to Group Panel', test: posHtml.includes('Sold to:') && posHtml.includes('Select Customer') },
    { name: 'Ship to Group Panel', test: posHtml.includes('Ship to:') && posHtml.includes('Same as &quot;Sold to&quot;') || posHtml.includes('Same as "Sold to"') },
    { name: 'INVOICE Details Card', test: posHtml.includes('win-invoice-title') && posHtml.includes('Invoice No:') },
    { name: 'Customer Email & Calculator', test: posHtml.includes('Customer Email address:') && posHtml.includes('Calculator') },
    { name: 'Line Items Action Bar', test: posHtml.includes('Line count') && posHtml.includes('Add new line') && posHtml.includes('Add item from list') },
    { name: 'DataGridView Items Table', test: posHtml.includes('Item ID/SKU') && posHtml.includes('Item name - description') && posHtml.includes('col-indicator') },
    { name: 'Bottom Tabs (Status, Comments, etc.)', test: posHtml.includes('Status') && posHtml.includes('Private comments') && posHtml.includes('Terms &amp; Conditions') },
    { name: 'Financial Summary Box', test: posHtml.includes('Sub total:') && posHtml.includes('Tax:') && posHtml.includes('Delivery costs:') && posHtml.includes('Amount Due:') },
    { name: 'Footer Actions (Save & Close, Preview, Print, Email)', test: posHtml.includes('Save &amp; Close') && posHtml.includes('Preview') && posHtml.includes('Print') && posHtml.includes('Email') }
  ];

  console.log('\n--- UI ELEMENT CHECKS ---');
  checks.forEach(c => {
    console.log(`${c.name}:`, c.test ? '✅ Verified' : '❌ Missing');
  });

  // 3. Test Sale Creation POST
  console.log('\n--- 3. CREATE SALE TRANSACTION TEST ---');
  const salePayload = {
    customer_id: 1,
    payment_mode_id: 1,
    discount_amount: 0,
    notes: 'POS Desktop transaction test',
    items: [
      {
        product_id: 1,
        name: 'Demo Product 1',
        quantity: 1,
        unit_price: 100,
        tax_rate: 10
      }
    ]
  };

  const saleRes = await fetch('http://localhost:3000/admin/sales', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      cookie
    },
    body: JSON.stringify(salePayload)
  });

  const saleData = await saleRes.json();
  console.log('Sale Creation Response:', saleRes.status === 200 && saleData.success ? `✅ Created Invoice #${saleData.invoice_number}` : `❌ Failed: ${JSON.stringify(saleData)}`);
}

testPosFlow().catch(err => {
  console.error('Error during POS flow test:', err);
});
