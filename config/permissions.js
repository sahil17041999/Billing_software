// config/permissions.js
// Centralized permission definitions and default role privilege presets

const PERMISSION_MODULES = [
  {
    module: 'dashboard',
    name: 'Dashboard & Metrics',
    icon: 'ti-layout-dashboard',
    description: 'Executive dashboard, revenue figures, and store statistics',
    permissions: [
      { key: 'dashboard.view', name: 'View Dashboard & Analytics', description: 'Access dashboard summary and charts' }
    ]
  },
  {
    module: 'pos',
    name: 'POS & Billing Terminal',
    icon: 'ti-device-laptop',
    description: 'Point of sale checkout, barcode scanning, and invoice printing',
    permissions: [
      { key: 'pos.access', name: 'Access POS Checkout', description: 'Open POS terminal and create live customer bills' },
      { key: 'sales.discount', name: 'Apply Custom Discounts', description: 'Apply bill and item level discounts' },
      { key: 'sales.cancel', name: 'Cancel / Void Transactions', description: 'Cancel running or saved sales orders' }
    ]
  },
  {
    module: 'sales',
    name: 'Sales & Invoicing',
    icon: 'ti-file-invoice',
    description: 'Past invoices, invoice reprints, and customer records',
    permissions: [
      { key: 'sales.view', name: 'View Sales History', description: 'Browse and view past customer tax invoices' },
      { key: 'sales.print', name: 'Print & Email Invoices', description: 'Download or email PDF / 80mm thermal receipts' }
    ]
  },
  {
    module: 'inventory',
    name: 'Inventory & Stock Management',
    icon: 'ti-boxes',
    description: 'Stock tracking, batches, expiry alerts, and stock adjustments',
    permissions: [
      { key: 'inventory.view', name: 'View Stock & Expiry Alerts', description: 'View stock summary, low stock, and batch expiries' },
      { key: 'inventory.adjust', name: 'Stock Adjustments & Ledger', description: 'Perform manual stock adjustments and view stock ledger' }
    ]
  },
  {
    module: 'purchases',
    name: 'Purchases & Suppliers',
    icon: 'ti-truck-loading',
    description: 'Supplier POs, goods inward, and purchase bills',
    permissions: [
      { key: 'purchase.view', name: 'View Purchase Orders', description: 'Browse purchase order history' },
      { key: 'purchase.create', name: 'Create Purchase Bills', description: 'Inward goods and record vendor bills' },
      { key: 'suppliers.manage', name: 'Manage Suppliers', description: 'Add, edit, and view supplier records' }
    ]
  },
  {
    module: 'returns',
    name: 'Returns & Credit Notes',
    icon: 'ti-arrow-back-up',
    description: 'Customer sales returns and supplier purchase returns',
    permissions: [
      { key: 'returns.sales', name: 'Process Sales Returns', description: 'Accept customer returns and refunds' },
      { key: 'returns.purchases', name: 'Process Purchase Returns', description: 'Return defective or excess stock to vendors' }
    ]
  },
  {
    module: 'master',
    name: 'Master Data Setup',
    icon: 'ti-settings',
    description: 'Product catalog, categories, brands, customers, taxes, units',
    permissions: [
      { key: 'master.products', name: 'Manage Products & Pricing', description: 'Add, edit, and manage product catalog and barcodes' },
      { key: 'master.categories_brands', name: 'Manage Categories & Brands', description: 'Setup categories and brand groupings' },
      { key: 'master.customers', name: 'Manage Customer Directory', description: 'Add, edit, and manage customer profiles' },
      { key: 'master.taxes_units', name: 'Taxes, Units & Payment Modes', description: 'Configure GST slabs, units of measurement, and payment modes' }
    ]
  },
  {
    module: 'expenses',
    name: 'Expense Management',
    icon: 'ti-cash',
    description: 'Store daily expenses, utility bills, operational costs',
    permissions: [
      { key: 'expenses.view', name: 'View Expense List', description: 'View recorded store expenses' },
      { key: 'expenses.create', name: 'Record Daily Expenses', description: 'Add daily store expenses and receipts' }
    ]
  },
  {
    module: 'dayend',
    name: 'Day-End Closing & Shift Tally',
    icon: 'ti-lock-access',
    description: 'Daily register closing, cash drawer reconciliation',
    permissions: [
      { key: 'dayend.view', name: 'View Day End History', description: 'View past shift closing records' },
      { key: 'dayend.perform', name: 'Perform Day End Closing', description: 'Execute shift close and reconcile cash drawer' }
    ]
  },
  {
    module: 'ledger',
    name: 'Customer & Supplier Ledgers',
    icon: 'ti-wallet',
    description: 'Financial ledgers, payments, and receivables/payables',
    permissions: [
      { key: 'ledger.view', name: 'View Party Statements', description: 'Access customer and supplier account statements' }
    ]
  },
  {
    module: 'reports',
    name: 'Reports & Business Analytics',
    icon: 'ti-chart-pie',
    description: 'Sales, purchase, stock, P&L, cashier, and tax reports',
    permissions: [
      { key: 'reports.sales', name: 'Sales Reports & Tax Summary', description: 'View sales reports and export GST registers' },
      { key: 'reports.purchases', name: 'Purchase Reports', description: 'View purchase summary and supplier analytics' },
      { key: 'reports.inventory', name: 'Stock & Valuation Reports', description: 'View inventory turnover and stock reports' },
      { key: 'reports.financial', name: 'Financial Profit & Loss', description: 'View store P&L and financial statements' }
    ]
  },
  {
    module: 'users',
    name: 'Staff & Role Administration',
    icon: 'ti-shield-lock',
    description: 'User accounts, role creation, and permission configuration',
    permissions: [
      { key: 'users.manage', name: 'Manage Staff Users', description: 'Create, edit, and deactivate staff accounts' },
      { key: 'roles.manage', name: 'Configure Role Privileges', description: 'Assign privileges and manage roles' }
    ]
  }
];

// Default presets for built-in roles
const DEFAULT_ROLE_PRESETS = {
  admin: ['*'], // All privileges
  manager: [
    'dashboard.view',
    'pos.access', 'sales.discount',
    'sales.view', 'sales.print',
    'inventory.view', 'inventory.adjust',
    'purchase.view', 'purchase.create', 'suppliers.manage',
    'returns.sales', 'returns.purchases',
    'master.products', 'master.categories_brands', 'master.customers', 'master.taxes_units',
    'expenses.view', 'expenses.create',
    'dayend.view', 'dayend.perform',
    'ledger.view',
    'reports.sales', 'reports.purchases', 'reports.inventory', 'reports.financial'
  ],
  cashier: [
    'pos.access',
    'sales.view', 'sales.print',
    'master.customers',
    'returns.sales',
    'dayend.view', 'dayend.perform'
  ],
  accountant: [
    'dashboard.view',
    'sales.view', 'sales.print',
    'purchase.view',
    'expenses.view', 'expenses.create',
    'dayend.view',
    'ledger.view',
    'reports.sales', 'reports.purchases', 'reports.inventory', 'reports.financial'
  ],
  warehouse: [
    'inventory.view', 'inventory.adjust',
    'purchase.view', 'purchase.create',
    'returns.purchases',
    'reports.inventory'
  ]
};

// Helper: check if a list of user permissions grants a specific permission key
function checkPermission(userPerms, requiredPerm) {
  let perms = userPerms;
  if (typeof perms === 'string') {
    try {
      perms = JSON.parse(perms);
    } catch(e) {
      perms = [perms];
    }
  }

  if (!perms || !Array.isArray(perms)) return false;
  if (perms.includes('*') || perms.includes('all')) return true;
  if (perms.includes(requiredPerm)) return true;
  
  // Wildcard module check: e.g. 'pos.*' matches 'pos.access'
  const [mod] = requiredPerm.split('.');
  if (perms.includes(`${mod}.*`)) return true;
  
  return false;
}

module.exports = {
  PERMISSION_MODULES,
  DEFAULT_ROLE_PRESETS,
  checkPermission
};
