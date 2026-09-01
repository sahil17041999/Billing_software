const { SubscriptionPlan, CompanySubscription, SubscriptionInvoice, Company, User, Product, Sale, Notification, seedSubscriptionPlans } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

/**
 * Generate a Cryptographic-Grade Store License Key
 * Format: GROC-XXXX-XXXX-XXXX-XXXX-PLAN
 */
function generateLicenseKey(planCode = 'PRO', companyId = 1) {
  const rand1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const rand2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const rand3 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const rand4 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const tag = (planCode || 'PRO').toUpperCase();
  return `GROC-${rand1}-${rand2}-${rand3}-${rand4}-${tag}`;
}

/**
 * Generate Standardized GST Tax Invoice Number
 * Format: INV-SUB-YYYY-XXXXXX
 */
function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const serial = Math.floor(100000 + Math.random() * 900000);
  return `INV-SUB-${year}-${serial}`;
}

/**
 * Ensure Subscription Plans are populated in Database
 */
async function ensurePlansAvailable() {
  try {
    let plans = await SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [['price_monthly', 'ASC']]
    });

    if (!plans || plans.length === 0) {
      if (typeof seedSubscriptionPlans === 'function') {
        await seedSubscriptionPlans();
      }
      plans = await SubscriptionPlan.findAll({
        where: { is_active: true },
        order: [['price_monthly', 'ASC']]
      });
    }

    if (!plans || plans.length === 0) {
      await SubscriptionPlan.bulkCreate([
        {
          name: 'Starter Retailer',
          code: 'starter',
          description: 'Essential billing and inventory tools for small grocery shops and single counters.',
          price_monthly: 499.00,
          price_yearly: 4790.00,
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
          price_yearly: 9590.00,
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
          price_yearly: 19190.00,
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
      ]);
      plans = await SubscriptionPlan.findAll({
        where: { is_active: true },
        order: [['price_monthly', 'ASC']]
      });
    }

    return plans || [];
  } catch (err) {
    console.error('Error ensuring plans available:', err.message);
    return [];
  }
}

/**
 * Master Feature Entitlements Matrix
 * Defines capabilities, categories, plan levels, module URLs, and descriptions
 */
function getEntitlementsMatrix() {
  return [
    {
      category: 'Point of Sale (POS) & Billing',
      icon: 'ti-device-laptop',
      features: [
        {
          key: 'pos_multicart',
          name: 'Multi-Level & Multi-Cart POS Terminal',
          desc: 'Hold multiple customer shopping carts simultaneously and recall with 1-click.',
          url: '/admin/sales/pos',
          starter: { enabled: false, text: 'Single Cart Only' },
          pro: { enabled: true, text: 'Multi-Cart (5 Carts)' },
          enterprise: { enabled: true, text: 'Unlimited Carts & Counters' }
        },
        {
          key: 'pos_scanning',
          name: 'Rapid Barcode Scanner & POS Item Lookup',
          desc: 'Instant USB/Bluetooth barcode lookup with sound tone and quick add to cart.',
          url: '/admin/sales/pos',
          starter: { enabled: true, text: 'Standard (USB/Camera)' },
          pro: { enabled: true, text: 'High-Speed with Audio Beep' },
          enterprise: { enabled: true, text: 'Ultra Turbo Laser Scanner' }
        },
        {
          key: 'pos_gst_engine',
          name: 'GST Compliant Invoicing & Tax Engine',
          desc: 'Automatic CGST, SGST, IGST breakdown, HSN/SAC codes (SAC 998313), and invoice numbering.',
          url: '/admin/sales/',
          starter: { enabled: true, text: 'Standard GST Matrix' },
          pro: { enabled: true, text: 'Full Multi-Tier GST Engine' },
          enterprise: { enabled: true, text: 'Enterprise Tax & E-Way Ready' }
        },
        {
          key: 'pos_printing',
          name: 'Thermal (80mm/58mm) & A4 PDF Printing',
          desc: 'Fast receipt generation formatted for standard 80mm/58mm thermal rolls and full A4 tax invoices.',
          url: '/admin/sales/',
          starter: { enabled: true, text: '80mm Thermal & A4 Standard' },
          pro: { enabled: true, text: '80mm, 58mm + Custom Store Logo' },
          enterprise: { enabled: true, text: 'Thermal, Laser + Custom CSS' }
        },
        {
          key: 'pos_email',
          name: 'Automated SMTP Email Invoicing & Presets',
          desc: 'Send professional digital receipts directly to customer emails automatically upon sale completion.',
          url: '/admin/settings/smtp',
          starter: { enabled: true, text: 'Basic SMTP Receipts' },
          pro: { enabled: true, text: 'Full Gateway & Custom Presets' },
          enterprise: { enabled: true, text: 'Dedicated High-Volume Relay' }
        },
        {
          key: 'pos_branding',
          name: 'Custom Logo Branding on Invoices & Receipts',
          desc: 'Embed store logo, contact info, and custom footer terms on all printed and emailed receipts.',
          url: '/admin/settings/company',
          starter: { enabled: false, text: 'System Header' },
          pro: { enabled: true, text: 'Full Logo & Store Branding' },
          enterprise: { enabled: true, text: 'White-Label Branding' }
        }
      ]
    },
    {
      category: 'Catalog & Inventory Control',
      icon: 'ti-boxes',
      features: [
        {
          key: 'inv_products_limit',
          name: 'Product Catalog Capacity',
          desc: 'Maximum items, SKUs, and variations you can register in the store inventory catalog.',
          url: '/admin/master/products',
          starter: { enabled: true, text: '1,000 Products' },
          pro: { enabled: true, text: '10,000 Products' },
          enterprise: { enabled: true, text: 'Unlimited Products' }
        },
        {
          key: 'inv_invoices_limit',
          name: 'Monthly Invoicing & Billing Quota',
          desc: 'Number of customer sales invoices you can issue every calendar month.',
          url: '/admin/sales/',
          starter: { enabled: true, text: '2,000 Bills / month' },
          pro: { enabled: true, text: '15,000 Bills / month' },
          enterprise: { enabled: true, text: 'Unlimited Invoices' }
        },
        {
          key: 'inv_stock_ledger',
          name: 'Real-Time Stock Valuation & Ledger',
          desc: 'Track every stock inward, sale deduction, adjustment, and purchase return history in real-time.',
          url: '/admin/inventory/stock',
          starter: { enabled: true, text: 'Current Stock Summary' },
          pro: { enabled: true, text: 'Detailed Stock Ledger' },
          enterprise: { enabled: true, text: 'Multi-Branch Stock Ledger' }
        },
        {
          key: 'inv_alerts_expiry',
          name: 'Low Stock & Expiry Date Alerts',
          desc: 'Proactive warnings for low stock levels and items approaching expiration dates.',
          url: '/admin/inventory/stock/low',
          starter: { enabled: false, text: 'Not Included' },
          pro: { enabled: true, text: 'Low Stock & Expiry Alerts' },
          enterprise: { enabled: true, text: 'Automated Purchase Reorder' }
        },
        {
          key: 'inv_purchases_returns',
          name: 'Purchase Inward Orders & Vendor Returns',
          desc: 'Manage supplier stock inward entries, purchase invoices, and vendor goods return notes.',
          url: '/admin/purchases/',
          starter: { enabled: true, text: 'Standard Inward' },
          pro: { enabled: true, text: 'Full Purchase & Returns' },
          enterprise: { enabled: true, text: 'Advanced PO Workflow' }
        }
      ]
    },
    {
      category: 'Cash Management & Accounting Ledgers',
      icon: 'ti-wallet',
      features: [
        {
          key: 'acc_dayend',
          name: 'Day-End Cash Reconciliation & Shift Audit',
          desc: 'Reconcile drawer cash against recorded sales, register denomination counts, and lock daily books.',
          url: '/admin/day-end/',
          starter: { enabled: false, text: 'Locked (Pro Required)' },
          pro: { enabled: true, text: 'Full Day-End Closing & Audit' },
          enterprise: { enabled: true, text: 'Multi-Terminal Shift Balancing' }
        },
        {
          key: 'acc_customer_ledger',
          name: 'Customer Ledger & Udhar/Credit Statements',
          desc: 'Individual customer account statements, credit limits, payment history, and overdue tracking.',
          url: '/admin/ledger/customer',
          starter: { enabled: false, text: 'Locked (Pro Required)' },
          pro: { enabled: true, text: 'Customer Khata Statements' },
          enterprise: { enabled: true, text: 'Credit Limits & Aging Matrix' }
        },
        {
          key: 'acc_supplier_ledger',
          name: 'Supplier Inward Ledger & Payables',
          desc: 'Track accounts payable for wholesale suppliers, inward purchase bills, and pending payments.',
          url: '/admin/ledger/supplier',
          starter: { enabled: false, text: 'Locked (Pro Required)' },
          pro: { enabled: true, text: 'Supplier Accounts & Khata' },
          enterprise: { enabled: true, text: 'Automated AP/AR Matching' }
        },
        {
          key: 'acc_expenses',
          name: 'Store Expense Management & Categorization',
          desc: 'Record utility bills, shop rent, staff tea/misc expenses, and payment vouchers.',
          url: '/admin/expenses/',
          starter: { enabled: true, text: 'Basic Expense Tracking' },
          pro: { enabled: true, text: 'Categorized Expense Book' },
          enterprise: { enabled: true, text: 'Cost Center & Departmental' }
        }
      ]
    },
    {
      category: 'Staff, Access Control & Security',
      icon: 'ti-shield-lock',
      features: [
        {
          key: 'sec_users_limit',
          name: 'Staff & Cashier User Accounts',
          desc: 'Total number of login accounts for store owners, managers, cashiers, and stock keepers.',
          url: '/admin/users/',
          starter: { enabled: true, text: '2 User Logins' },
          pro: { enabled: true, text: '6 User Logins' },
          enterprise: { enabled: true, text: 'Unlimited Users' }
        },
        {
          key: 'sec_rbac',
          name: 'Role-Based Access Control (RBAC)',
          desc: 'Custom roles and granular permissions to restrict cashiers from seeing cost prices or profit reports.',
          url: '/admin/users/roles',
          starter: { enabled: false, text: 'Standard Roles Only' },
          pro: { enabled: true, text: 'Custom Roles & Permissions' },
          enterprise: { enabled: true, text: 'Enterprise Granular RBAC' }
        },
        {
          key: 'sec_license',
          name: 'Cryptographic Store License Key',
          desc: 'Cryptographically generated, unique store license for official verification and offline activation.',
          url: '/admin/subscription',
          starter: { enabled: true, text: 'Standard Key' },
          pro: { enabled: true, text: 'Cryptographic SHA Key' },
          enterprise: { enabled: true, text: 'Enterprise Bound License' }
        }
      ]
    },
    {
      category: 'Reports, Analytics & Exports',
      icon: 'ti-chart-pie',
      features: [
        {
          key: 'rep_sales',
          name: 'Daily & Periodic Sales Analytics',
          desc: 'Track daily turnover, hourly rush trends, peak sales times, and top-selling product metrics.',
          url: '/admin/reports/sales',
          starter: { enabled: true, text: 'Daily Sales Summary' },
          pro: { enabled: true, text: 'Comprehensive Sales Insights' },
          enterprise: { enabled: true, text: 'Predictive Sales & Heatmaps' }
        },
        {
          key: 'rep_profit_loss',
          name: 'Profit & Loss (P&L) Financial Reporting',
          desc: 'Gross margin calculations based on purchase prices, net profit analysis, and tax liabilities.',
          url: '/admin/reports/profit-loss',
          starter: { enabled: false, text: 'Locked (Pro Required)' },
          pro: { enabled: true, text: 'Gross & Net Profit Reports' },
          enterprise: { enabled: true, text: 'Full P&L, Tax & Balance Sheet' }
        },
        {
          key: 'rep_cashier_audit',
          name: 'Cashier Shift Performance & Audit Logs',
          desc: 'Audit individual cashier sales, cash discrepancies, canceled bills, and discount tracking.',
          url: '/admin/reports/cashier',
          starter: { enabled: false, text: 'Locked (Pro Required)' },
          pro: { enabled: true, text: 'Cashier Audits & Shifts' },
          enterprise: { enabled: true, text: 'Real-time Discrepancy Alerts' }
        },
        {
          key: 'rep_export',
          name: 'Data Export to Excel & CSV',
          desc: 'Download one-click CSV and Excel spreadsheets of all sales, inventory, and customer databases.',
          url: '/admin/reports/sales',
          starter: { enabled: true, text: 'Standard CSV Export' },
          pro: { enabled: true, text: 'Excel, CSV & PDF Exports' },
          enterprise: { enabled: true, text: 'Scheduled Cloud Auto-Export' }
        }
      ]
    },
    {
      category: 'Support & Infrastructure SLA',
      icon: 'ti-headset',
      features: [
        {
          key: 'sup_support',
          name: 'Customer Technical Support SLA',
          desc: 'Response time commitment and available channels for software support and assistance.',
          url: null,
          starter: { enabled: true, text: 'Community Support (48h)' },
          pro: { enabled: true, text: 'Priority Email & Chat (4h)' },
          enterprise: { enabled: true, text: '24/7 Dedicated Account Mgr' }
        },
        {
          key: 'sup_sla',
          name: 'Cloud Backup & Zero-Downtime Guarantee',
          desc: 'Automated data replication to prevent data loss from local hardware failures.',
          url: null,
          starter: { enabled: true, text: 'Daily Backup' },
          pro: { enabled: true, text: 'Automated Daily Cloud Backup' },
          enterprise: { enabled: true, text: 'Real-time Sync & 99.99% SLA' }
        }
      ]
    }
  ];
}

exports.getEntitlementsMatrix = getEntitlementsMatrix;

/**
 * Public B2C Pricing Storefront
 */
exports.getPublicPricing = async (req, res) => {
  try {
    const plans = await ensurePlansAvailable();

    res.render('public/pricing', {
      plans,
      user: req.user || null
    });
  } catch (error) {
    console.error('Error loading public pricing:', error);
    res.status(500).send('Error loading pricing page: ' + error.message);
  }
};

/**
 * Public Client Subscription Order & Store Registration
 */
exports.orderSubscription = async (req, res) => {
  try {
    const {
      plan_id,
      billing_cycle = 'monthly',
      store_name,
      owner_name,
      phone,
      email,
      city,
      payment_method = 'UPI'
    } = req.body;

    // 1. Sanitize & Validate 10-digit Indian Mobile Number
    let cleanPhone = (phone || '').toString().trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) cleanPhone = cleanPhone.substring(2);
    else if (cleanPhone.length > 10 && cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);

    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).' });
    }

    if (!store_name || !store_name.trim()) {
      return res.status(400).json({ success: false, error: 'Store Name is required.' });
    }

    // 2. Check if mobile number is already in use
    const existingUser = await User.findOne({ where: { phone: cleanPhone } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: `Mobile number +91 ${cleanPhone} is already registered. Please sign in or use a different mobile number.`
      });
    }

    // 3. Find target plan
    const plans = await ensurePlansAvailable();
    const targetPlan = (plan_id ? plans.find(p => p.id == plan_id) : null) || 
                       (req.body.plan_code ? plans.find(p => p.code === req.body.plan_code) : null) || 
                       plans.find(p => p.code === 'pro') || 
                       plans[0];

    if (!targetPlan) {
      return res.status(404).json({ success: false, error: 'Selected subscription plan not found.' });
    }

    const isYearly = billing_cycle === 'yearly';
    const amount = isYearly ? targetPlan.price_yearly : targetPlan.price_monthly;
    const now = new Date();
    const expiryDate = new Date(now);
    if (isYearly) {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setDate(expiryDate.getDate() + 30);
    }

    const orderId = `ORD-${Date.now().toString().slice(-8)}`;

    // 4. Create Company (Store) in Pending Approval state (is_active = 0)
    const company = await Company.create({
      name: store_name.trim(),
      email: (email || '').trim() || null,
      phone: cleanPhone,
      city: (city || '').trim() || null,
      is_active: 0 // Pending Admin Verification
    });

    // 5. Create Owner User in Pending Approval state (is_active = 0)
    await User.create({
      company_id: company.id,
      username: cleanPhone,
      first_name: (owner_name || '').trim() || store_name.trim(),
      email: (email || '').trim() || null,
      phone: cleanPhone,
      role_id: 1, // Admin / Owner role
      is_active: 0 // Pending Admin Verification
    });

    const baseAmount = parseFloat((amount / 1.18).toFixed(2));
    const taxAmount = parseFloat((amount - baseAmount).toFixed(2));
    const licenseKey = generateLicenseKey(targetPlan.code, company.id);
    const invoiceNumber = generateInvoiceNumber();

    // 6. Create Company Subscription Record
    await CompanySubscription.create({
      company_id: company.id,
      plan_id: targetPlan.id,
      billing_cycle,
      status: 'pending_approval',
      start_date: now,
      end_date: expiryDate,
      next_billing_date: expiryDate,
      amount_paid: amount,
      base_amount: baseAmount,
      tax_amount: taxAmount,
      license_key: licenseKey,
      invoice_number: invoiceNumber,
      payment_method,
      transaction_id: orderId,
      auto_renew: true
    });

    // 7. Create Subscription Invoice Record
    await SubscriptionInvoice.create({
      company_id: company.id,
      plan_id: targetPlan.id,
      invoice_number: invoiceNumber,
      billing_cycle,
      base_amount: baseAmount,
      tax_amount: taxAmount,
      total_amount: amount,
      payment_method,
      transaction_id: orderId,
      license_key: licenseKey,
      payment_status: 'paid',
      period_start: now,
      period_end: expiryDate,
      paid_at: now
    });

    // 8. Create Super Admin Notification
    try {
      if (Notification) {
        await Notification.create({
          company_id: 1,
          type: 'approval',
          title: `New Store Registration: ${company.name}`,
          message: `${(owner_name || '').trim() || store_name} has placed a ${billing_cycle} order for ${targetPlan.name} (${cleanPhone}). Awaiting admin verification.`,
          icon: 'ti-shopping-cart-plus',
          severity: 'info',
          link: '/admin/subscription#client-stores-section'
        });
      }
    } catch (notifErr) {
      console.error('Error creating order notification:', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      order_id: orderId,
      store_id: company.id,
      license_key: licenseKey,
      invoice_number: invoiceNumber,
      message: 'Subscription order placed successfully! Admin will verify and activate your store dashboard.'
    });

  } catch (error) {
    console.error('Error placing subscription order:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get Subscription Dashboard
 */
exports.getSubscription = async (req, res) => {
  try {
    const companyId = req.session.companyId || (req.user ? req.user.company_id : 1) || 1;

    // Fetch all available subscription plans (auto-seed if empty)
    const plans = await ensurePlansAvailable();

    // Find or initialize active company subscription
    let subscription = await CompanySubscription.findOne({
      where: { company_id: companyId },
      include: [{ model: SubscriptionPlan, as: 'plan' }]
    });

    const proPlan = (plans && plans.length > 0) ? (plans.find(p => p.code === 'pro') || plans[0]) : null;

    // Default to Professional Plan (30-day active license) if newly provisioned
    if (!subscription) {
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setDate(nextMonth.getDate() + 30);

      subscription = await CompanySubscription.create({
        company_id: companyId,
        plan_id: proPlan ? proPlan.id : 1,
        billing_cycle: 'monthly',
        status: 'active',
        start_date: now,
        end_date: nextMonth,
        next_billing_date: nextMonth,
        amount_paid: proPlan ? proPlan.price_monthly : 999.00,
        payment_method: 'UPI',
        transaction_id: `TXN-${Date.now().toString().slice(-8)}`,
        auto_renew: true
      });

      subscription = await CompanySubscription.findOne({
        where: { id: subscription.id },
        include: [{ model: SubscriptionPlan, as: 'plan' }]
      });
    }

    // Safety fallback: if subscription exists in DB but its plan association is missing/null
    if (subscription && !subscription.plan && plans.length > 0) {
      const matchedPlan = plans.find(p => p.id === subscription.plan_id) || proPlan;
      if (matchedPlan) {
        await subscription.update({ plan_id: matchedPlan.id });
        subscription.plan = matchedPlan;
      }
    }

    // Usage Statistics
    const userCount = await User.count({ where: { company_id: companyId } });
    const productCount = await Product.count({ where: { company_id: companyId } });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyInvoiceCount = await Sale.count({
      where: {
        company_id: companyId,
        created_at: { [Op.gte]: startOfMonth }
      }
    });

    // Remaining Days calculation
    const today = new Date();
    const endDate = subscription && subscription.end_date ? new Date(subscription.end_date) : new Date(Date.now() + 30 * 86400000);
    const diffTime = endDate.getTime() - today.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const maxUsers = (subscription && subscription.plan && subscription.plan.max_users) ? subscription.plan.max_users : 6;
    const maxProducts = (subscription && subscription.plan && subscription.plan.max_products) ? subscription.plan.max_products : 10000;
    const maxInvoices = (subscription && subscription.plan && subscription.plan.max_invoices_per_month) ? subscription.plan.max_invoices_per_month : 15000;

    const usage = {
      users: {
        current: userCount,
        max: maxUsers,
        percentage: Math.min(100, Math.round((userCount / maxUsers) * 100))
      },
      products: {
        current: productCount,
        max: maxProducts,
        percentage: Math.min(100, Math.round((productCount / maxProducts) * 100))
      },
      invoices: {
        current: monthlyInvoiceCount,
        max: maxInvoices,
        percentage: Math.min(100, Math.round((monthlyInvoiceCount / maxInvoices) * 100))
      }
    };

    // Super Admin check
    const isSuperAdmin = req.isSuperAdmin || (req.user && req.user.company_id === 1 && req.session.role === 'admin') || (req.session.userId === 1);

    // Client Stores for Administrator Approval & License Management (Super Admin ONLY!)
    let clientStores = [];
    if (isSuperAdmin) {
      const stores = await Company.findAll({
        where: { id: { [Op.gt]: 1 } }, // Exclude platform host company (ID 1)
        include: [
          { 
            model: CompanySubscription, 
            as: 'subscription', 
            required: true, // Only show stores with a registered subscription!
            include: [{ model: SubscriptionPlan, as: 'plan' }] 
          },
          { model: User, as: 'users' }
        ],
        order: [['created_at', 'DESC']]
      });

      // Filter out duplicates (keep latest registration for each unique phone)
      const seenPhones = new Set();
      for (const store of stores) {
        const key = store.phone ? store.phone.trim() : (`store-${store.id}`);
        if (!seenPhones.has(key)) {
          seenPhones.add(key);
          clientStores.push(store);
        }
      }
    }

    // Ensure subscription has license key if active
    if (subscription && !subscription.license_key && subscription.status === 'active') {
      const genKey = generateLicenseKey(subscription.plan ? subscription.plan.code : 'PRO', companyId);
      await subscription.update({ license_key: genKey });
      subscription.license_key = genKey;
    }

    // Fetch Real Billing Receipts & Tax Invoices History (Only authentic records)
    const billingHistory = await SubscriptionInvoice.findAll({
      where: isSuperAdmin ? {} : { company_id: companyId },
      include: [
        { model: SubscriptionPlan, as: 'plan' },
        { model: Company, as: 'company', attributes: ['id', 'name', 'phone', 'city'] }
      ],
      order: [['paid_at', 'DESC'], ['created_at', 'DESC']],
      limit: 25
    });

    // Super Admin Revenue & Licensing Metrics
    let adminMetrics = { mrr: 0, arr: 0, activeStoresCount: 0, pendingStoresCount: 0 };
    if (isSuperAdmin) {
      const activeSubs = await CompanySubscription.findAll({
        where: { status: 'active' },
        include: [{ model: SubscriptionPlan, as: 'plan' }]
      });
      let mrr = 0;
      for (const s of activeSubs) {
        if (s.plan) {
          mrr += s.billing_cycle === 'yearly' ? Math.round(s.plan.price_yearly / 12) : Math.round(s.plan.price_monthly);
        }
      }
      adminMetrics.mrr = mrr;
      adminMetrics.arr = mrr * 12;
      adminMetrics.activeStoresCount = await Company.count({ where: { id: { [Op.gt]: 1 }, is_active: 1 } });
      adminMetrics.pendingStoresCount = await Company.count({ where: { id: { [Op.gt]: 1 }, is_active: 0 } });
    }

    // Feature Entitlements Breakdown Computation
    const entitlementsMatrix = getEntitlementsMatrix();
    const currentPlanCode = isSuperAdmin ? 'enterprise' : (subscription && subscription.plan ? subscription.plan.code : 'starter');
    let totalEntitlements = 0;
    let unlockedEntitlements = 0;
    entitlementsMatrix.forEach(cat => {
      cat.features.forEach(f => {
        totalEntitlements++;
        const tier = f[currentPlanCode];
        if (isSuperAdmin || (tier && tier.enabled)) {
          unlockedEntitlements++;
        }
      });
    });
    const entitlementStats = {
      total: totalEntitlements,
      unlocked: unlockedEntitlements,
      locked: totalEntitlements - unlockedEntitlements,
      percentage: Math.round((unlockedEntitlements / totalEntitlements) * 100)
    };

    if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
      return res.json({
        success: true,
        subscription,
        plans,
        usage,
        daysRemaining,
        isSuperAdmin,
        clientStores,
        billingHistory,
        adminMetrics,
        currentPlanCode,
        entitlementsMatrix,
        entitlementStats
      });
    }

    res.render('admin/subscription/index', {
      subscription,
      plans,
      usage,
      daysRemaining,
      isSuperAdmin,
      clientStores,
      billingHistory,
      adminMetrics,
      currentPlanCode,
      entitlementsMatrix,
      entitlementStats,
      user: req.user,
      currentPage: 'subscription'
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
      return res.status(500).json({ success: false, error: error.message });
    }
    res.status(500).render('error', { error: 'Failed to load subscription: ' + error.message });
  }
};

/**
 * Upgrade or Renew Subscription Plan
 */
exports.upgradePlan = async (req, res) => {
  try {
    const companyId = req.session.companyId || 1;
    const { plan_id, plan_code, billing_cycle = 'monthly', payment_method = 'UPI' } = req.body;

    let targetPlan = null;
    if (plan_id) {
      targetPlan = await SubscriptionPlan.findByPk(plan_id);
    } else if (plan_code) {
      targetPlan = await SubscriptionPlan.findOne({ where: { code: plan_code } });
    }

    if (!targetPlan) {
      return res.status(404).json({ success: false, error: 'Selected subscription plan not found.' });
    }

    const now = new Date();
    const isYearly = billing_cycle === 'yearly';
    const amount = isYearly ? targetPlan.price_yearly : targetPlan.price_monthly;

    const expiryDate = new Date(now);
    if (isYearly) {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setDate(expiryDate.getDate() + 30);
    }

    const txId = `TXN-${Date.now().toString().slice(-8)}`;
    const baseAmount = parseFloat((amount / 1.18).toFixed(2));
    const taxAmount = parseFloat((amount - baseAmount).toFixed(2));
    const licenseKey = generateLicenseKey(targetPlan.code, companyId);
    const invoiceNumber = generateInvoiceNumber();

    let [subscription] = await CompanySubscription.findOrCreate({
      where: { company_id: companyId },
      defaults: {
        plan_id: targetPlan.id,
        billing_cycle,
        status: 'active',
        start_date: now,
        end_date: expiryDate,
        next_billing_date: expiryDate,
        amount_paid: amount,
        base_amount: baseAmount,
        tax_amount: taxAmount,
        license_key: licenseKey,
        invoice_number: invoiceNumber,
        payment_method,
        transaction_id: txId,
        auto_renew: true
      }
    });

    await subscription.update({
      plan_id: targetPlan.id,
      billing_cycle,
      status: 'active',
      start_date: now,
      end_date: expiryDate,
      next_billing_date: expiryDate,
      amount_paid: amount,
      base_amount: baseAmount,
      tax_amount: taxAmount,
      license_key: licenseKey,
      invoice_number: invoiceNumber,
      payment_method,
      transaction_id: txId,
      auto_renew: true
    });

    // Create Subscription Tax Invoice Record
    const invoice = await SubscriptionInvoice.create({
      company_id: companyId,
      plan_id: targetPlan.id,
      invoice_number: invoiceNumber,
      billing_cycle,
      base_amount: baseAmount,
      tax_amount: taxAmount,
      total_amount: amount,
      payment_method,
      transaction_id: txId,
      license_key: licenseKey,
      payment_status: 'paid',
      period_start: now,
      period_end: expiryDate,
      paid_at: now
    });

    return res.json({
      success: true,
      message: `Successfully activated ${targetPlan.name} (${isYearly ? 'Annual' : 'Monthly'})!`,
      invoice_id: invoice.id,
      invoice_number: invoiceNumber,
      license_key: licenseKey,
      subscription: {
        plan_name: targetPlan.name,
        billing_cycle,
        amount_paid: amount,
        end_date: expiryDate,
        transaction_id: txId,
        license_key: licenseKey
      }
    });

  } catch (error) {
    console.error('Error upgrading plan:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Cancel Auto-Renew
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const companyId = req.session.companyId || 1;
    const subscription = await CompanySubscription.findOne({ where: { company_id: companyId } });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Active subscription not found.' });
    }

    await subscription.update({ auto_renew: false });

    return res.json({
      success: true,
      message: 'Automatic renewal has been disabled.'
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ADMIN: Approve and Activate Client Store & Grant Login Access
 */
exports.approveClientStore = async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await Company.findByPk(companyId);

    if (!company) {
      return res.status(404).json({ success: false, error: 'Client store not found.' });
    }

    // 1. Activate Company
    await company.update({ is_active: 1 });

    // 2. Activate Users belonging to company
    await User.update({ is_active: 1 }, { where: { company_id: companyId } });

    // 3. Activate Subscription
    const subscription = await CompanySubscription.findOne({ where: { company_id: companyId } });
    if (subscription) {
      const now = new Date();
      const newExpiry = new Date(now);
      newExpiry.setDate(newExpiry.getDate() + (subscription.billing_cycle === 'yearly' ? 365 : 30));

      await subscription.update({
        status: 'active',
        start_date: now,
        end_date: newExpiry,
        next_billing_date: newExpiry
      });
    }

    // 4. Send Approval Notification to Store Owner
    try {
      if (Notification) {
        await Notification.create({
          company_id: company.id,
          type: 'approval',
          title: 'Store License Approved & Activated! 🎉',
          message: `Congratulations! Your store "${company.name}" has been approved by the platform administrator. All POS billing and store modules are now active!`,
          icon: 'ti-circle-check',
          severity: 'success',
          link: '/subscriber/dashboard'
        });
      }
    } catch (notifErr) {
      console.error('Error creating approval notification:', notifErr.message);
    }

    return res.json({
      success: true,
      message: `Store "${company.name}" has been approved! Login access is now active.`
    });

  } catch (error) {
    console.error('Error approving store:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ADMIN: Toggle Store Active / Suspended Status
 */
exports.toggleClientStore = async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await Company.findByPk(companyId);

    if (!company) {
      return res.status(404).json({ success: false, error: 'Client store not found.' });
    }

    const newStatus = (company.is_active === 1 || company.is_active === true) ? 0 : 1;
    await company.update({ is_active: newStatus });
    await User.update({ is_active: newStatus }, { where: { company_id: companyId } });

    const subscription = await CompanySubscription.findOne({ where: { company_id: companyId } });
    if (subscription) {
      await subscription.update({ status: newStatus ? 'active' : 'suspended' });
    }

    return res.json({
      success: true,
      is_active: newStatus,
      message: `Store "${company.name}" is now ${newStatus ? 'Active & Licensed' : 'Suspended'}.`
    });

  } catch (error) {
    console.error('Error toggling store:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ADMIN: Extend Store Subscription (+30 Days)
 */
exports.extendClientStore = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { days = 30 } = req.body;

    const subscription = await CompanySubscription.findOne({ where: { company_id: companyId } });
    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Store subscription not found.' });
    }

    const currentEnd = new Date(subscription.end_date > new Date() ? subscription.end_date : new Date());
    currentEnd.setDate(currentEnd.getDate() + parseInt(days, 10));

    await subscription.update({
      status: 'active',
      end_date: currentEnd,
      next_billing_date: currentEnd
    });

    return res.json({
      success: true,
      message: `Extended validity by +${days} days! New expiry: ${currentEnd.toLocaleDateString('en-IN')}`,
      new_end_date: currentEnd
    });

  } catch (error) {
    console.error('Error extending store validity:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ADMIN: Change Store Subscription Plan (Starter / Pro / Enterprise)
 */
exports.changeClientPlan = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { plan_id, plan_code, billing_cycle = 'monthly', days = 30 } = req.body;

    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Client store not found.' });
    }

    const plans = await ensurePlansAvailable();
    const newPlan = (plan_id ? plans.find(p => p.id == plan_id) : null) || 
                    (plan_code ? plans.find(p => p.code === plan_code) : null) || 
                    plans[0];

    if (!newPlan) {
      return res.status(404).json({ success: false, error: 'Selected plan not found.' });
    }

    let subscription = await CompanySubscription.findOne({ where: { company_id: companyId } });
    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + parseInt(days || (billing_cycle === 'yearly' ? 365 : 30), 10));

    if (!subscription) {
      subscription = await CompanySubscription.create({
        company_id: companyId,
        plan_id: newPlan.id,
        billing_cycle,
        status: 'active',
        start_date: now,
        end_date: expiry,
        next_billing_date: expiry,
        amount_paid: billing_cycle === 'yearly' ? newPlan.price_yearly : newPlan.price_monthly,
        payment_method: 'Admin Action',
        transaction_id: `ADM-${Date.now().toString().slice(-8)}`,
        auto_renew: true
      });
    } else {
      await subscription.update({
        plan_id: newPlan.id,
        billing_cycle,
        status: 'active',
        end_date: expiry,
        next_billing_date: expiry
      });
    }

    return res.json({
      success: true,
      message: `Store "${company.name}" plan switched to ${newPlan.name} (${billing_cycle})!`,
      plan_name: newPlan.name,
      end_date: expiry
    });

  } catch (error) {
    console.error('Error changing store plan:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ADMIN: Edit Store & Owner Details
 */
exports.editClientStore = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { store_name, phone, email, city, owner_name } = req.body;

    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Client store not found.' });
    }

    let cleanPhone = (phone || company.phone || '').toString().trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) cleanPhone = cleanPhone.substring(2);
    else if (cleanPhone.length > 10 && cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);

    await company.update({
      name: (store_name || company.name).trim(),
      phone: cleanPhone || company.phone,
      email: (email || '').trim() || company.email,
      city: (city || '').trim() || company.city
    });

    if (owner_name || cleanPhone || email) {
      const owner = await User.findOne({ where: { company_id: companyId } });
      if (owner) {
        await owner.update({
          first_name: (owner_name || owner.first_name).trim(),
          phone: cleanPhone || owner.phone,
          username: cleanPhone || owner.username,
          email: (email || '').trim() || owner.email
        });
      }
    }

    return res.json({
      success: true,
      message: `Store "${company.name}" details updated successfully!`
    });

  } catch (error) {
    console.error('Error editing client store:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ADMIN: Delete Client Store & Associated Data
 */
exports.deleteClientStore = async (req, res) => {
  try {
    const { companyId } = req.params;
    if (parseInt(companyId, 10) === 1) {
      return res.status(400).json({ success: false, error: 'Cannot delete the platform host company.' });
    }

    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Client store not found.' });
    }

    const storeName = company.name;
    await SubscriptionInvoice.destroy({ where: { company_id: companyId } });
    await CompanySubscription.destroy({ where: { company_id: companyId } });
    await User.destroy({ where: { company_id: companyId } });
    await company.destroy();

    return res.json({
      success: true,
      message: `Store "${storeName}" has been deleted.`
    });

  } catch (error) {
    console.error('Error deleting client store:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ADMIN: Impersonate / Direct Access into Store Panel
 */
exports.impersonateClientStore = async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Client store not found.' });
    }

    const clientUser = await User.findOne({ where: { company_id: companyId } });
    if (!clientUser) {
      return res.status(404).json({ success: false, error: 'No owner user found for this store.' });
    }

    // Save current Super Admin session context
    req.session.originalUserId = req.session.userId;
    req.session.originalCompanyId = req.session.companyId;
    req.session.originalRole = req.session.role;
    req.session.isImpersonating = true;
    req.session.impersonatedStoreName = company.name;

    // Switch to client workspace
    req.session.userId = clientUser.id;
    req.session.companyId = company.id;
    req.session.role = 'admin';

    return res.json({
      success: true,
      redirect: '/admin/dashboard',
      message: `Directly accessing workspace for store "${company.name}".`
    });

  } catch (error) {
    console.error('Error impersonating store:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Exit Impersonation & Return to Super Admin Panel
 */
exports.exitImpersonation = async (req, res) => {
  try {
    if (req.session.isImpersonating && req.session.originalUserId) {
      req.session.userId = req.session.originalUserId;
      req.session.companyId = req.session.originalCompanyId || 1;
      req.session.role = req.session.originalRole || 'admin';
      delete req.session.originalUserId;
      delete req.session.originalCompanyId;
      delete req.session.originalRole;
      delete req.session.isImpersonating;
      delete req.session.impersonatedStoreName;
    }
    return res.redirect('/admin/subscription');
  } catch (error) {
    console.error('Error exiting impersonation:', error);
    return res.redirect('/admin/dashboard');
  }
};

/**
 * View & Print Official Subscription GST Tax Invoice Receipt
 */
exports.getInvoiceReceipt = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await SubscriptionInvoice.findByPk(invoiceId, {
      include: [
        { model: SubscriptionPlan, as: 'plan' },
        { model: Company, as: 'company' }
      ]
    });

    if (!invoice) {
      return res.status(404).render('error', { error: 'Subscription Tax Invoice not found.' });
    }

    // Access check: Only Super Admin or the owning company can view
    if (!req.isSuperAdmin && req.user && req.user.company_id !== invoice.company_id) {
      return res.status(403).render('error', { error: 'Access denied to this tax invoice.' });
    }

    res.render('admin/subscription/receipt', {
      invoice,
      user: req.user
    });

  } catch (error) {
    console.error('Error rendering subscription receipt:', error);
    res.status(500).render('error', { error: 'Failed to load tax invoice: ' + error.message });
  }
};

/**
 * Super Admin: Export Client Stores & Subscription Ledger to CSV
 */
exports.exportSubscriptionsReport = async (req, res) => {
  try {
    const stores = await Company.findAll({
      where: { id: { [Op.gt]: 1 } },
      include: [
        { model: CompanySubscription, as: 'subscription', include: [{ model: SubscriptionPlan, as: 'plan' }] },
        { model: User, as: 'users' }
      ],
      order: [['created_at', 'DESC']]
    });

    let csv = 'Store ID,Store Name,Owner Name,Phone,Email,City,Plan Name,Billing Cycle,Amount Paid (INR),Status,License Key,Expiry Date,Registration Date\n';

    for (const store of stores) {
      const owner = store.users && store.users[0];
      const sub = store.subscription;
      const planName = sub && sub.plan ? sub.plan.name : 'N/A';
      const licenseKey = sub && sub.license_key ? sub.license_key : 'N/A';
      
      let expiry = 'N/A';
      try {
        if (sub && sub.end_date && !isNaN(new Date(sub.end_date).getTime())) {
          expiry = new Date(sub.end_date).toISOString().split('T')[0];
        }
      } catch (e) { expiry = 'N/A'; }

      let regDate = 'N/A';
      try {
        if (store.created_at && !isNaN(new Date(store.created_at).getTime())) {
          regDate = new Date(store.created_at).toISOString().split('T')[0];
        }
      } catch (e) { regDate = 'N/A'; }

      csv += `"${store.id}","${(store.name || '').replace(/"/g, '""')}","${owner ? (owner.first_name || '').replace(/"/g, '""') : 'N/A'}","${store.phone || ''}","${store.email || ''}","${(store.city || '').replace(/"/g, '""')}","${planName}","${sub ? sub.billing_cycle : 'monthly'}","${sub ? sub.amount_paid : '0.00'}","${store.is_active ? 'Active' : 'Pending'}","${licenseKey}","${expiry}","${regDate}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=store_subscriptions_${Date.now()}.csv`);
    return res.send(csv);

  } catch (error) {
    console.error('Error exporting subscription report:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Super Admin: Regenerate Cryptographic Store License Key
 */
exports.regenerateLicenseKey = async (req, res) => {
  try {
    const { companyId } = req.params;
    const subscription = await CompanySubscription.findOne({
      where: { company_id: companyId },
      include: [{ model: SubscriptionPlan, as: 'plan' }]
    });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Store subscription not found.' });
    }

    const newKey = generateLicenseKey(subscription.plan ? subscription.plan.code : 'PRO', companyId);
    await subscription.update({ license_key: newKey });

    return res.json({
      success: true,
      license_key: newKey,
      message: 'Cryptographic license key successfully regenerated!'
    });

  } catch (error) {
    console.error('Error regenerating license key:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Feature Entitlements JSON API Endpoint
 * Returns categorized breakdown and unlock status as per user active plan
 */
exports.getEntitlementsApi = async (req, res) => {
  try {
    const companyId = req.session.companyId || (req.user ? req.user.company_id : 1) || 1;
    const isSuperAdmin = req.isSuperAdmin || (req.user && req.user.company_id === 1 && req.session.role === 'admin') || (req.session.userId === 1);
    
    let subscription = await CompanySubscription.findOne({
      where: { company_id: companyId },
      include: [{ model: SubscriptionPlan, as: 'plan' }]
    });

    const planCode = isSuperAdmin ? 'enterprise' : (subscription && subscription.plan ? subscription.plan.code : 'starter');
    const matrix = getEntitlementsMatrix();

    let totalFeatures = 0;
    let unlockedCount = 0;

    const enrichedMatrix = matrix.map(cat => {
      const enrichedFeatures = cat.features.map(f => {
        totalFeatures++;
        const planTier = f[planCode] || { enabled: false, text: 'Not Included' };
        const isUnlocked = isSuperAdmin || planTier.enabled;
        if (isUnlocked) unlockedCount++;
        return {
          ...f,
          is_unlocked: isUnlocked,
          tier_detail: planTier
        };
      });
      return {
        ...cat,
        features: enrichedFeatures
      };
    });

    return res.json({
      success: true,
      current_plan: {
        code: planCode,
        name: isSuperAdmin ? 'Enterprise Supermarket (Super Admin)' : (subscription && subscription.plan ? subscription.plan.name : 'Starter Retailer'),
        id: subscription && subscription.plan ? subscription.plan.id : 1
      },
      summary: {
        total_features: totalFeatures,
        unlocked_count: unlockedCount,
        locked_count: totalFeatures - unlockedCount,
        unlock_percentage: Math.round((unlockedCount / totalFeatures) * 100)
      },
      categories: enrichedMatrix
    });
  } catch (error) {
    console.error('Error fetching entitlements API:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ============================================================
 * SUBSCRIPTION PLANS MANAGEMENT (Super Admin / Platform Founder)
 * ============================================================
 */

// 1. GET /admin/subscription/plans - Render Plans Management UI
exports.getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      include: [
        {
          model: CompanySubscription,
          as: 'subscriptions',
          attributes: ['id', 'status', 'company_id']
        }
      ],
      order: [['price_monthly', 'ASC']]
    });

    // Calculate plan statistics
    const totalPlans = plans.length;
    const activePlans = plans.filter(p => p.is_active).length;
    const popularPlan = plans.find(p => p.is_popular) || plans[0] || null;
    const minPrice = plans.length > 0 ? Math.min(...plans.map(p => Number(p.price_monthly))) : 0;

    res.render('admin/subscription/plans', {
      plans,
      stats: {
        totalPlans,
        activePlans,
        popularPlan,
        minPrice
      },
      currentPage: 'subscription-plans'
    });

  } catch (error) {
    console.error('Error rendering subscription plans:', error);
    res.status(500).render('error', { error: 'Error loading subscription plans' });
  }
};

// 2. POST /admin/subscription/plans - Create a New Plan
exports.createSubscriptionPlan = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      price_monthly,
      price_yearly,
      max_users,
      max_products,
      max_invoices_per_month,
      badge_text,
      is_popular,
      is_active,
      features
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Plan name is required.' });
    }

    const cleanCode = (code || name.toLowerCase().replace(/[^a-z0-9]/g, '-')).trim();

    // Check duplicate code
    const existing = await SubscriptionPlan.findOne({ where: { code: cleanCode } });
    if (existing) {
      return res.status(400).json({ success: false, error: `Plan code '${cleanCode}' is already in use. Choose another code.` });
    }

    // Process features
    let featureList = [];
    if (Array.isArray(features)) {
      featureList = features.filter(f => f && String(f).trim() !== '');
    } else if (typeof features === 'string') {
      featureList = features.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);
    }

    const newPlan = await SubscriptionPlan.create({
      name: name.trim(),
      code: cleanCode,
      description: description ? description.trim() : '',
      price_monthly: parseFloat(price_monthly) || 0.00,
      price_yearly: parseFloat(price_yearly) || ((parseFloat(price_monthly) || 0.00) * 10),
      currency: '₹',
      max_users: parseInt(max_users) || 2,
      max_products: parseInt(max_products) || 1000,
      max_invoices_per_month: parseInt(max_invoices_per_month) || 2000,
      badge_text: badge_text ? badge_text.trim().toUpperCase() : null,
      is_popular: is_popular === true || is_popular === 'true' || is_popular === 'on' || is_popular === 1,
      is_active: is_active !== false && is_active !== 'false' && is_active !== 0,
      features: featureList
    });

    return res.status(201).json({
      success: true,
      message: `Subscription plan "${newPlan.name}" created successfully!`,
      plan: newPlan
    });

  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. POST /admin/subscription/plans/:id/edit - Update an Existing Plan
exports.updateSubscriptionPlan = async (req, res) => {
  try {
    const planId = req.params.id;
    const plan = await SubscriptionPlan.findByPk(planId);

    if (!plan) {
      return res.status(404).json({ success: false, error: 'Subscription plan not found.' });
    }

    const {
      name,
      description,
      price_monthly,
      price_yearly,
      max_users,
      max_products,
      max_invoices_per_month,
      badge_text,
      is_popular,
      is_active,
      features
    } = req.body;

    const updates = {};
    if (name) updates.name = name.trim();
    if (description !== undefined) updates.description = description ? description.trim() : '';
    if (price_monthly !== undefined) updates.price_monthly = parseFloat(price_monthly) || 0.00;
    if (price_yearly !== undefined) updates.price_yearly = parseFloat(price_yearly) || 0.00;
    if (max_users !== undefined) updates.max_users = parseInt(max_users) || 1;
    if (max_products !== undefined) updates.max_products = parseInt(max_products) || 100;
    if (max_invoices_per_month !== undefined) updates.max_invoices_per_month = parseInt(max_invoices_per_month) || 500;
    if (badge_text !== undefined) updates.badge_text = badge_text ? badge_text.trim().toUpperCase() : null;
    if (is_popular !== undefined) updates.is_popular = (is_popular === true || is_popular === 'true' || is_popular === 'on' || is_popular === 1);
    if (is_active !== undefined) updates.is_active = (is_active === true || is_active === 'true' || is_active === 'on' || is_active === 1);

    if (features !== undefined) {
      if (Array.isArray(features)) {
        updates.features = features.filter(f => f && String(f).trim() !== '');
      } else if (typeof features === 'string') {
        updates.features = features.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);
      }
    }

    await plan.update(updates);

    return res.json({
      success: true,
      message: `Plan "${plan.name}" updated successfully!`,
      plan
    });

  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 4. POST /admin/subscription/plans/:id/toggle - Toggle Active Status
exports.toggleSubscriptionPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Subscription plan not found.' });
    }

    plan.is_active = !plan.is_active;
    await plan.save();

    return res.json({
      success: true,
      message: `Plan "${plan.name}" is now ${plan.is_active ? 'Active' : 'Inactive'}.`,
      is_active: plan.is_active
    });

  } catch (error) {
    console.error('Error toggling subscription plan:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 5. POST /admin/subscription/plans/:id/delete - Delete or Deactivate Plan
exports.deleteSubscriptionPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id, {
      include: [{ model: CompanySubscription, as: 'subscriptions' }]
    });

    if (!plan) {
      return res.status(404).json({ success: false, error: 'Subscription plan not found.' });
    }

    const activeSubs = plan.subscriptions ? plan.subscriptions.filter(s => s.status === 'active').length : 0;
    if (activeSubs > 0) {
      // Deactivate instead of deleting to protect data integrity
      plan.is_active = false;
      await plan.save();
      return res.json({
        success: true,
        deactivated: true,
        message: `Plan has ${activeSubs} active subscriber store(s). It has been deactivated instead of deleted to protect billing history.`
      });
    }

    await plan.destroy();
    return res.json({
      success: true,
      message: `Subscription plan "${plan.name}" deleted successfully!`
    });

  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};



