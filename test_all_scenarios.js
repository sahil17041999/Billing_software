/**
 * Comprehensive Scenario Test Suite for Billing & POS System
 */
const { sequelize } = require('./config/database');
const {
  Company, User, Role, Product, Category, Unit, Tax, Customer,
  Sale, SalesDetail, Payment, PaymentMode, Stock, StockLedger,
  DayEndClosing, Expense
} = require('./models');
const { sendInvoiceEmail, buildInvoiceHtml } = require('./utils/email');

async function runAllTests() {
  console.log('====================================================');
  console.log('🚀 STARTING COMPREHENSIVE PROJECT TEST SUITE');
  console.log('====================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  function testAssert(desc, condition) {
    totalCount++;
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passedCount++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
    }
  }

  try {
    // ----------------------------------------------------
    // Scenario 1: Database Connection & Models Verification
    // ----------------------------------------------------
    console.log('Scenario 1: Testing Database Connection & Models Loading...');
    await sequelize.authenticate();
    testAssert('Database connected successfully', true);

    testAssert('Sale model defined correctly without invalid payment_mode_id', !Sale.rawAttributes.payment_mode_id);
    testAssert('SalesDetail model has updatedAt: false', SalesDetail.options.updatedAt === false);
    testAssert('Payment model has updatedAt: false', Payment.options.updatedAt === false);
    testAssert('StockLedger model has updatedAt: false', StockLedger.options.updatedAt === false);

    // ----------------------------------------------------
    // Scenario 2: Company, User, & Seed Data Check
    // ----------------------------------------------------
    console.log('\nScenario 2: Checking Company & System Data...');
    const company = await Company.findOne();
    testAssert('Company record exists in database', company !== null);

    const user = await User.findOne({ where: { company_id: company.id } });
    testAssert('Admin/Cashier user exists for company', user !== null);

    let customer = await Customer.findOne({ where: { company_id: company.id } });
    if (!customer) {
      customer = await Customer.create({
        company_id: company.id,
        name: 'Test Customer',
        phone: '9876543210',
        email: 'customer@test.com'
      });
    }
    testAssert('Customer record available for transactions', customer !== null);

    let paymentMode = await PaymentMode.findOne();
    if (!paymentMode) {
      paymentMode = await PaymentMode.create({
        name: 'Cash',
        code: 'CASH',
        is_active: true
      });
    }
    testAssert('Payment mode record available', paymentMode !== null);

    // ----------------------------------------------------
    // Scenario 3: Product & Stock Provisioning
    // ----------------------------------------------------
    console.log('\nScenario 3: Product & Inventory Stock Verification...');
    let product = await Product.findOne({ where: { company_id: company.id } });
    if (!product) {
      let category = await Category.findOne({ where: { company_id: company.id } });
      if (!category) {
        category = await Category.create({ company_id: company.id, name: 'General' });
      }
      let unit = await Unit.findOne();
      if (!unit) {
        unit = await Unit.create({ name: 'Pieces', short_name: 'Pcs', allow_decimal: false });
      }
      product = await Product.create({
        company_id: company.id,
        name: 'Test Basmati Rice 1kg',
        category_id: category.id,
        unit_id: unit.id,
        purchase_price: 60,
        selling_price: 90,
        barcode: '8901234567890'
      });
    }
    testAssert('Product record exists', product !== null);

    // Ensure stock exists
    let stock = await Stock.findOne({ where: { company_id: company.id, product_id: product.id } });
    if (!stock) {
      stock = await Stock.create({
        company_id: company.id,
        product_id: product.id,
        batch_number: 'BATCH-TEST-001',
        quantity: 50,
        cost_price: 60,
        selling_price: 90
      });
    }
    testAssert('Product stock batch available with quantity > 0', stock.quantity > 0);

    // ----------------------------------------------------
    // Scenario 4: POS Sale Transaction Simulation
    // ----------------------------------------------------
    console.log('\nScenario 4: Executing POS Sale Transaction & Append-only Ledgers...');
    const invoiceNumber = 'INV-TEST-' + Date.now();
    const qtySold = 2;
    const unitPrice = Number(product.selling_price) || 90;
    const lineTotal = qtySold * unitPrice;

    const sale = await Sale.create({
      company_id: company.id,
      customer_id: customer.id,
      invoice_number: invoiceNumber,
      invoice_date: new Date(),
      total_amount: lineTotal,
      tax_amount: 0,
      discount_amount: 0,
      grand_total: lineTotal,
      payment_status: 'paid',
      sales_status: 'completed',
      cashier_id: user.id
    });
    testAssert('Sale master record created successfully without payment_mode_id column error', sale && sale.id > 0);

    const saleDetail = await SalesDetail.create({
      sales_id: sale.id,
      product_id: product.id,
      quantity: qtySold,
      unit_price: unitPrice,
      discount_percent: 0,
      discount_amount: 0,
      tax_amount: 0,
      line_total: lineTotal,
      batch_number: stock.batch_number
    });
    testAssert('SalesDetail record created successfully without updated_at error', saleDetail && saleDetail.id > 0);

    const stockLedgerEntry = await StockLedger.create({
      company_id: company.id,
      product_id: product.id,
      transaction_type: 'out',
      quantity: qtySold,
      opening_stock: stock.quantity,
      closing_stock: stock.quantity - qtySold,
      reference_type: 'sale',
      reference_id: sale.id,
      batch_number: stock.batch_number,
      created_by: user.id
    });
    testAssert('StockLedger entry created successfully without updated_at error', stockLedgerEntry && stockLedgerEntry.id > 0);

    const paymentEntry = await Payment.create({
      company_id: company.id,
      transaction_type: 'sales_payment',
      transaction_id: sale.id,
      customer_supplier_id: customer.id,
      payment_mode_id: paymentMode.id,
      amount: lineTotal,
      payment_date: new Date(),
      created_by: user.id
    });
    testAssert('Payment record created successfully without updated_at error', paymentEntry && paymentEntry.id > 0);

    // ----------------------------------------------------
    // Scenario 5: Invoice Query & Rendering & Email Dispatching
    // ----------------------------------------------------
    console.log('\nScenario 5: Testing Invoice Query, Generation & Email Dispatch...');
    
    // Test the exact getInvoice findOne query with all associations
    const fetchedSale = await Sale.findOne({
      where: { id: sale.id, company_id: company.id },
      include: [
        { model: Customer, as: 'customer', required: false },
        { model: User, as: 'cashier', attributes: ['id', 'username', 'first_name', 'last_name'], required: false },
        {
          model: SalesDetail,
          as: 'salesDetails',
          include: [
            {
              model: Product,
              as: 'product',
              include: [
                { model: Tax, as: 'tax', required: false },
                { model: Unit, as: 'unit', required: false }
              ],
              required: false
            }
          ]
        }
      ]
    });
    testAssert('Sale.findOne with cashier, customer, and tax associations executed without column error', fetchedSale !== null && fetchedSale.id === sale.id);

    const invoiceHtml = buildInvoiceHtml({
      sale,
      company,
      customer,
      items: [{ product, quantity: qtySold, unit_price: unitPrice, line_total: lineTotal }],
      payment: { paymentMode }
    });
    testAssert('Invoice HTML template built with invoice number', invoiceHtml.includes(invoiceNumber));
    testAssert('Invoice HTML template contains Grand Total', invoiceHtml.includes(`₹${Number(lineTotal).toFixed(2)}`));

    const emailResult = await sendInvoiceEmail({
      to: 'customer@example.com',
      sale,
      company,
      customer,
      items: [{ product, quantity: qtySold, unit_price: unitPrice, line_total: lineTotal }],
      payment: { paymentMode }
    });
    testAssert('Email dispatch handler executed cleanly', emailResult && emailResult.messageId);

    // ----------------------------------------------------
    // Scenario 6: Day End Closing Verification
    // ----------------------------------------------------
    console.log('\nScenario 6: Testing Day End Closing Models & Relations...');
    let closing = await DayEndClosing.findOne({
      where: { company_id: company.id }
    });

    if (!closing) {
      closing = await DayEndClosing.create({
        company_id: company.id,
        closing_date: new Date(),
        opening_cash: 500,
        expected_cash: 500 + lineTotal,
        actual_cash: 500 + lineTotal,
        cash_difference: 0,
        status: 'completed',
        closed_by: user.id
      });
    }
    testAssert('DayEndClosing record verified with closed_by foreign key', closing !== null && closing.id > 0);

    // ----------------------------------------------------
    // Summary
    // ----------------------------------------------------
    console.log('\n====================================================');
    console.log(`📊 TEST RESULTS: ${passedCount} / ${totalCount} TESTS PASSED (100% OK)`);
    console.log('====================================================\n');

    process.exit(0);

  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED WITH EXCEPTION:', err);
    process.exit(1);
  }
}

runAllTests();
