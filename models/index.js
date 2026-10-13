// Import all models
const { sequelize } = require('../config/database');
const Company = require('./Company');
const Role = require('./Role');
const User = require('./User');
const Category = require('./Category');
const Brand = require('./Brand');
const Unit = require('./Unit');
const Tax = require('./Tax');
const PaymentMode = require('./PaymentMode');
const Product = require('./Product');
const Customer = require('./Customer');
const Supplier = require('./Supplier');
const Purchase = require('./Purchase');
const PurchaseDetail = require('./PurchaseDetail');
const Sale = require('./Sale');
const SalesDetail = require('./SalesDetail');
const Stock = require('./Stock');
const StockLedger = require('./StockLedger');
const SalesReturn = require('./SalesReturn');
const SalesReturnDetail = require('./SalesReturnDetail');
const PurchaseReturn = require('./PurchaseReturn');
const PurchaseReturnDetail = require('./PurchaseReturnDetail');
const Expense = require('./Expense');
const DayEndClosing = require('./DayEndClosing');
const Payment = require('./Payment');
const CustomerLedger = require('./CustomerLedger');
const SupplierLedger = require('./SupplierLedger');
const SmtpSetting = require('./SmtpSetting');
const SubscriptionPlan = require('./SubscriptionPlan');
const CompanySubscription = require('./CompanySubscription');
const SubscriptionInvoice = require('./SubscriptionInvoice');
const Notification = require('./Notification');
const ContactInquiry = require('./ContactInquiry');

// Define associations (idempotent guard)
let associationsSetup = false;
const setupAssociations = () => {
  if (associationsSetup) return;
  associationsSetup = true;

  // Company associations
  Company.hasMany(User, { foreignKey: 'company_id', as: 'users' });
  Company.hasMany(Product, { foreignKey: 'company_id', as: 'products' });
  Company.hasMany(Customer, { foreignKey: 'company_id', as: 'customers' });
  Company.hasMany(Supplier, { foreignKey: 'company_id', as: 'suppliers' });
  Company.hasMany(Purchase, { foreignKey: 'company_id', as: 'purchases' });
  Company.hasMany(Sale, { foreignKey: 'company_id', as: 'sales' });
  Company.hasMany(Category, { foreignKey: 'company_id', as: 'categories' });
  Company.hasMany(Brand, { foreignKey: 'company_id', as: 'brands' });
  Company.hasMany(Unit, { foreignKey: 'company_id', as: 'units' });
  Company.hasMany(Tax, { foreignKey: 'company_id', as: 'taxes' });
  Company.hasMany(PaymentMode, { foreignKey: 'company_id', as: 'paymentModes' });
  Company.hasMany(Stock, { foreignKey: 'company_id', as: 'stocks' });
  Company.hasMany(StockLedger, { foreignKey: 'company_id', as: 'stockLedgers' });
  Company.hasMany(SalesReturn, { foreignKey: 'company_id', as: 'salesReturns' });
  Company.hasMany(PurchaseReturn, { foreignKey: 'company_id', as: 'purchaseReturns' });
  Company.hasMany(Expense, { foreignKey: 'company_id', as: 'expenses' });
  Company.hasMany(DayEndClosing, { foreignKey: 'company_id', as: 'dayEndClosings' });
  Company.hasMany(Payment, { foreignKey: 'company_id', as: 'payments' });
  Company.hasMany(CustomerLedger, { foreignKey: 'company_id', as: 'customerLedgers' });
  Company.hasMany(SupplierLedger, { foreignKey: 'company_id', as: 'supplierLedgers' });
  Company.hasOne(SmtpSetting, { foreignKey: 'company_id', as: 'smtpSetting' });
  SmtpSetting.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

  // Subscription associations
  Company.hasOne(CompanySubscription, { foreignKey: 'company_id', as: 'subscription' });
  CompanySubscription.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  CompanySubscription.belongsTo(SubscriptionPlan, { foreignKey: 'plan_id', as: 'plan' });
  SubscriptionPlan.hasMany(CompanySubscription, { foreignKey: 'plan_id', as: 'subscriptions' });

  // User associations
  User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
  User.hasMany(Purchase, { foreignKey: 'created_by', as: 'purchasesCreated' });
  User.hasMany(Sale, { foreignKey: 'cashier_id', as: 'salesCashier' });
  User.hasMany(DayEndClosing, { foreignKey: 'closed_by', as: 'dayClosings' });

  // Product associations
  Product.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
  Product.belongsTo(Brand, { foreignKey: 'brand_id', as: 'brand' });
  Product.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
  Product.belongsTo(Tax, { foreignKey: 'tax_id', as: 'tax' });
  Product.hasMany(PurchaseDetail, { foreignKey: 'product_id', as: 'purchaseDetails' });
  Product.hasMany(SalesDetail, { foreignKey: 'product_id', as: 'salesDetails' });
  Product.hasMany(SalesReturnDetail, { foreignKey: 'product_id', as: 'salesReturnDetails' });
  Product.hasMany(PurchaseReturnDetail, { foreignKey: 'product_id', as: 'purchaseReturnDetails' });
  Product.hasMany(Stock, { foreignKey: 'product_id', as: 'stocks' });
  Product.hasMany(StockLedger, { foreignKey: 'product_id', as: 'stockLedgers' });

  // Category associations
  Category.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

  // Brand associations
  Brand.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  Brand.hasMany(Product, { foreignKey: 'brand_id', as: 'products' });

  // Unit associations
  Unit.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  Unit.hasMany(Product, { foreignKey: 'unit_id', as: 'products' });

  // Tax associations
  Tax.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  Tax.hasMany(Product, { foreignKey: 'tax_id', as: 'products' });

  // PaymentMode associations
  PaymentMode.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

  // Customer associations
  Customer.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  Customer.hasMany(Sale, { foreignKey: 'customer_id', as: 'sales' });
  Customer.hasMany(Payment, { foreignKey: 'customer_supplier_id', as: 'payments' });
  Customer.hasMany(CustomerLedger, { foreignKey: 'customer_id', as: 'customerLedgers' });

  // Supplier associations
  Supplier.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  Supplier.hasMany(Purchase, { foreignKey: 'supplier_id', as: 'purchases' });
  Supplier.hasMany(Payment, { foreignKey: 'customer_supplier_id', as: 'payments' });
  Supplier.hasMany(SupplierLedger, { foreignKey: 'supplier_id', as: 'supplierLedgers' });

  // Purchase associations
  Purchase.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  Purchase.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
  Purchase.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  Purchase.hasMany(PurchaseDetail, { foreignKey: 'purchase_id', as: 'purchaseDetails' });
  Purchase.hasMany(PurchaseReturn, { foreignKey: 'purchase_id', as: 'purchaseReturns' });
  Purchase.hasMany(Payment, { foreignKey: 'transaction_id', as: 'payments' });

  // PurchaseDetail associations
  PurchaseDetail.belongsTo(Purchase, { foreignKey: 'purchase_id', as: 'purchase' });
  PurchaseDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // Sale associations
  Sale.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  Sale.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  Sale.belongsTo(User, { foreignKey: 'cashier_id', as: 'cashier' });
  Sale.hasMany(SalesDetail, { foreignKey: 'sales_id', as: 'salesDetails' });
  Sale.hasMany(SalesReturn, { foreignKey: 'sales_id', as: 'salesReturns' });
  Sale.hasMany(Payment, { foreignKey: 'transaction_id', as: 'payments' });

  // SalesDetail associations
  SalesDetail.belongsTo(Sale, { foreignKey: 'sales_id', as: 'sale' });
  SalesDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // SalesReturn associations
  SalesReturn.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  SalesReturn.belongsTo(Sale, { foreignKey: 'sales_id', as: 'sale' });
  SalesReturn.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  SalesReturn.hasMany(SalesReturnDetail, { foreignKey: 'return_id', as: 'returnDetails' });

  // SalesReturnDetail associations
  SalesReturnDetail.belongsTo(SalesReturn, { foreignKey: 'return_id', as: 'salesReturn' });
  SalesReturnDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // PurchaseReturn associations
  PurchaseReturn.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  PurchaseReturn.belongsTo(Purchase, { foreignKey: 'purchase_id', as: 'purchase' });
  PurchaseReturn.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  PurchaseReturn.hasMany(PurchaseReturnDetail, { foreignKey: 'return_id', as: 'returnDetails' });

  // PurchaseReturnDetail associations
  PurchaseReturnDetail.belongsTo(PurchaseReturn, { foreignKey: 'return_id', as: 'purchaseReturn' });
  PurchaseReturnDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // Stock associations
  Stock.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  Stock.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // StockLedger associations
  StockLedger.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  StockLedger.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
  StockLedger.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

  // Expense associations
  Expense.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  Expense.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  Expense.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

  // DayEndClosing associations
  DayEndClosing.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  DayEndClosing.belongsTo(User, { foreignKey: 'closed_by', as: 'cashier' });
  DayEndClosing.belongsTo(User, { foreignKey: 'closed_by', as: 'closed_by_user' });

  // Payment associations
  Payment.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  Payment.belongsTo(PaymentMode, { foreignKey: 'payment_mode_id', as: 'paymentMode' });
  Payment.belongsTo(Customer, { foreignKey: 'customer_supplier_id', as: 'customer' });
  Payment.belongsTo(User, { foreignKey: 'created_by', as: 'recorder' });

  // CustomerLedger associations
  CustomerLedger.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  CustomerLedger.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  CustomerLedger.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

  // SupplierLedger associations
  SupplierLedger.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  SupplierLedger.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
  SupplierLedger.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

  // SubscriptionInvoice associations
  SubscriptionInvoice.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  SubscriptionInvoice.belongsTo(SubscriptionPlan, { foreignKey: 'plan_id', as: 'plan' });
  Company.hasMany(SubscriptionInvoice, { foreignKey: 'company_id', as: 'subscriptionInvoices' });

  // Notification associations
  Company.hasMany(Notification, { foreignKey: 'company_id', as: 'notifications' });
  Notification.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
  Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
};

// Run associations immediately
setupAssociations();

// Export models and setup function
module.exports = {
  sequelize,
  Company,
  Role,
  User,
  Category,
  Brand,
  Unit,
  Tax,
  PaymentMode,
  Product,
  Customer,
  Supplier,
  Purchase,
  PurchaseDetail,
  Sale,
  SalesDetail,
  Stock,
  StockLedger,
  SalesReturn,
  SalesReturnDetail,
  PurchaseReturn,
  PurchaseReturnDetail,
  Expense,
  DayEndClosing,
  Payment,
  CustomerLedger,
  SupplierLedger,
  SmtpSetting,
  SubscriptionPlan,
  CompanySubscription,
  SubscriptionInvoice,
  Notification,
  ContactInquiry,
  setupAssociations,
  seedSubscriptionPlans
};

/**
 * Seed default subscription plans if table is empty
 */
async function seedSubscriptionPlans() {
  try {
    const defaultPlans = [
      {
        name: 'Starter Retailer',
        code: 'starter',
        description: 'Essential billing and inventory tools for small grocery shops and single counters.',
        price_monthly: 499.00,
        price_yearly: 4790.00, // 20% discount
        currency: '₹',
        max_users: 2,
        max_products: 1000,
        max_invoices_per_month: 2000,
        badge_text: 'ESSENTIALS',
        is_popular: false,
        is_active: true,
        features: [
          'Single Counter Quick POS Billing',
          'Barcode & Thermal 80mm Printing',
          'Standard A4 Invoicing & GST Matrix',
          'Product & Category Catalog (1,000 items)',
          'Daily Sales Reports & Summaries',
          'Basic Email Receipts via SMTP'
        ]
      },
      {
        name: 'Professional Store',
        code: 'pro',
        description: 'Comprehensive ERP with multi-cart POS, automated SMTP, and inventory control.',
        price_monthly: 999.00,
        price_yearly: 9590.00, // 20% discount
        currency: '₹',
        max_users: 6,
        max_products: 10000,
        max_invoices_per_month: 15000,
        badge_text: 'MOST POPULAR',
        is_popular: true,
        is_active: true,
        features: [
          'Multi-Level & Multi-Cart POS Terminal',
          'High-Speed Barcode Scanning & Audio Feedback',
          'Automated SMTP Email Dispatch & Presets',
          'Custom Logo Branding on Invoices & POS',
          'Day-End Cash Reconciliation & Register Audits',
          'Stock Ledger, Reorder Alerts & Purchase Tracking',
          'Full Customer & Supplier Ledger Accounting',
          'Priority Email & Chat Support'
        ]
      },
      {
        name: 'Enterprise Supermarket',
        code: 'enterprise',
        description: 'Unlimited capacity for multi-counter supermarkets and enterprise retail chains.',
        price_monthly: 1999.00,
        price_yearly: 19190.00, // 20% discount
        currency: '₹',
        max_users: 999,
        max_products: 999999,
        max_invoices_per_month: 999999,
        badge_text: 'UNLIMITED',
        is_popular: false,
        is_active: true,
        features: [
          'Unlimited Users, Counters & Cashiers',
          'Unlimited Products & Invoices per month',
          'Role Privileges & Granular Access Control',
          'Multi-Branch & Warehouse Stock Transfers',
          'Advanced Sales Analytics & Profit Margins',
          'Custom Domain & Dedicated Support Manager',
          'Automated Cloud Backups & Zero Downtime SLA'
        ]
      }
    ];

    for (const p of defaultPlans) {
      const existing = await SubscriptionPlan.findOne({ where: { code: p.code } });
      if (!existing) {
        await SubscriptionPlan.create(p);
      }
    }
  } catch (err) {
    console.error('Error seeding subscription plans:', err.message);
  }
}
