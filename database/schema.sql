-- Grocery Billing Software Database Schema
-- Version 1.0

-- ============================================
-- MASTER SETUP TABLES
-- ============================================

-- Company / Store Master
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(10),
  gstin VARCHAR(20),
  pan VARCHAR(10),
  logo_path VARCHAR(255),
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User & Role Master
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  permissions JSON,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role_id INT NOT NULL,
  is_active TINYINT DEFAULT 1,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Category Master
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_category_id INT,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_category_id) REFERENCES categories(id),
  UNIQUE KEY unique_category (company_id, name)
);

-- Brand Master
CREATE TABLE IF NOT EXISTS brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  logo_path VARCHAR(255),
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_brand (company_id, name)
);

-- Unit Master
CREATE TABLE IF NOT EXISTS units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  short_name VARCHAR(10) NOT NULL,
  description TEXT,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_unit (company_id, name)
);

-- Tax / GST Master
CREATE TABLE IF NOT EXISTS taxes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  rate DECIMAL(5, 2) NOT NULL,
  description TEXT,
  tax_code VARCHAR(50),
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_tax (company_id, name)
);

-- Payment Mode Master
CREATE TABLE IF NOT EXISTS payment_modes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_payment_mode (company_id, name)
);

-- Product Master
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  category_id INT NOT NULL,
  brand_id INT,
  unit_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100) UNIQUE,
  barcode VARCHAR(100) UNIQUE,
  tax_id INT NOT NULL,
  purchase_price DECIMAL(10, 2),
  selling_price DECIMAL(10, 2),
  min_stock_level INT DEFAULT 10,
  reorder_quantity INT DEFAULT 50,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (tax_id) REFERENCES taxes(id)
);

-- Customer Master
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(10),
  gstin VARCHAR(20),
  credit_limit DECIMAL(15, 2) DEFAULT 0,
  credit_used DECIMAL(15, 2) DEFAULT 0,
  outstanding_amount DECIMAL(15, 2) DEFAULT 0,
  customer_type ENUM('retail', 'wholesale') DEFAULT 'retail',
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Supplier Master
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(10),
  gstin VARCHAR(20),
  pan VARCHAR(10),
  bank_name VARCHAR(100),
  bank_account VARCHAR(50),
  ifsc_code VARCHAR(20),
  payment_terms TEXT,
  outstanding_amount DECIMAL(15, 2) DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- ============================================
-- TRANSACTION TABLES
-- ============================================

-- Purchase Master
CREATE TABLE IF NOT EXISTS purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  supplier_id INT NOT NULL,
  purchase_number VARCHAR(50) NOT NULL,
  purchase_date DATE NOT NULL,
  invoice_number VARCHAR(50),
  invoice_date DATE,
  total_amount DECIMAL(15, 2),
  tax_amount DECIMAL(15, 2),
  discount_amount DECIMAL(15, 2),
  grand_total DECIMAL(15, 2),
  payment_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
  purchase_status ENUM('draft', 'confirmed', 'received', 'cancelled') DEFAULT 'draft',
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  UNIQUE KEY unique_purchase (company_id, purchase_number)
);

-- Purchase Details
CREATE TABLE IF NOT EXISTS purchase_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2),
  line_total DECIMAL(15, 2),
  batch_number VARCHAR(100),
  expiry_date DATE,
  received_quantity INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Stock Master
CREATE TABLE IF NOT EXISTS stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  value DECIMAL(15, 2),
  batch_number VARCHAR(100),
  expiry_date DATE,
  location_rack VARCHAR(50),
  reorder_flag TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE KEY unique_stock (company_id, product_id, batch_number)
);

-- Stock Ledger
CREATE TABLE IF NOT EXISTS stock_ledger (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  product_id INT NOT NULL,
  transaction_type ENUM('in', 'out', 'adjustment', 'transfer', 'damage') NOT NULL,
  quantity INT NOT NULL,
  opening_stock INT,
  closing_stock INT,
  reference_type VARCHAR(50),
  reference_id INT,
  batch_number VARCHAR(100),
  expiry_date DATE,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_date (created_at),
  INDEX idx_product (product_id)
);

-- Sales / POS Transactions
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  customer_id INT,
  invoice_number VARCHAR(50) NOT NULL,
  invoice_date DATETIME NOT NULL,
  total_amount DECIMAL(15, 2),
  tax_amount DECIMAL(15, 2),
  discount_amount DECIMAL(15, 2),
  grand_total DECIMAL(15, 2),
  payment_status ENUM('pending', 'partial', 'paid') DEFAULT 'paid',
  sales_status ENUM('draft', 'completed', 'cancelled') DEFAULT 'completed',
  cashier_id INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (cashier_id) REFERENCES users(id),
  UNIQUE KEY unique_invoice (company_id, invoice_number)
);

-- Sales Details
CREATE TABLE IF NOT EXISTS sales_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sales_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2),
  line_total DECIMAL(15, 2),
  batch_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sales_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Payment Transactions
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  transaction_type ENUM('purchase_payment', 'sales_payment', 'customer_payment', 'supplier_payment') NOT NULL,
  transaction_id INT NOT NULL,
  customer_supplier_id INT,
  payment_mode_id INT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  reference_number VARCHAR(100),
  payment_date DATE NOT NULL,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_mode_id) REFERENCES payment_modes(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================
-- RETURN MANAGEMENT
-- ============================================

-- Sales Return
CREATE TABLE IF NOT EXISTS sales_returns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  sales_id INT NOT NULL,
  return_number VARCHAR(50) NOT NULL,
  return_date DATE NOT NULL,
  total_amount DECIMAL(15, 2),
  tax_amount DECIMAL(15, 2),
  return_reason TEXT,
  return_status ENUM('pending', 'processed', 'cancelled') DEFAULT 'pending',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (sales_id) REFERENCES sales(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  UNIQUE KEY unique_return (company_id, return_number)
);

-- Sales Return Details
CREATE TABLE IF NOT EXISTS sales_return_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  return_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2),
  reason_code VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES sales_returns(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Purchase Return
CREATE TABLE IF NOT EXISTS purchase_returns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  purchase_id INT NOT NULL,
  return_number VARCHAR(50) NOT NULL,
  return_date DATE NOT NULL,
  total_amount DECIMAL(15, 2),
  tax_amount DECIMAL(15, 2),
  return_reason TEXT,
  return_status ENUM('pending', 'processed', 'cancelled') DEFAULT 'pending',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  UNIQUE KEY unique_purchase_return (company_id, return_number)
);

-- Purchase Return Details
CREATE TABLE IF NOT EXISTS purchase_return_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  return_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2),
  reason_code VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES purchase_returns(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ============================================
-- EXPENSE MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  expense_category ENUM('rent', 'electricity', 'salary', 'transport', 'maintenance', 'other') NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  payment_mode_id INT,
  reference_number VARCHAR(100),
  expense_date DATE NOT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_mode_id) REFERENCES payment_modes(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================
-- DAY END / CASH CLOSING
-- ============================================

CREATE TABLE IF NOT EXISTS day_end_closing (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  closing_date DATE NOT NULL,
  opening_cash DECIMAL(15, 2),
  cash_sales DECIMAL(15, 2),
  upi_sales DECIMAL(15, 2),
  card_sales DECIMAL(15, 2),
  total_expenses DECIMAL(15, 2),
  cash_withdrawal DECIMAL(15, 2),
  expected_cash DECIMAL(15, 2),
  actual_cash DECIMAL(15, 2),
  cash_difference DECIMAL(15, 2),
  status ENUM('open', 'closed', 'verified') DEFAULT 'open',
  notes TEXT,
  closed_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (closed_by) REFERENCES users(id),
  UNIQUE KEY unique_closing (company_id, closing_date)
);

-- ============================================
-- LEDGER TABLES
-- ============================================

-- Customer Ledger
CREATE TABLE IF NOT EXISTS customer_ledger (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  customer_id INT NOT NULL,
  transaction_type ENUM('sale', 'payment', 'return', 'credit_memo') NOT NULL,
  transaction_id INT,
  amount DECIMAL(15, 2),
  balance DECIMAL(15, 2),
  transaction_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_customer (customer_id),
  INDEX idx_date (transaction_date)
);

-- Supplier Ledger
CREATE TABLE IF NOT EXISTS supplier_ledger (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  supplier_id INT NOT NULL,
  transaction_type ENUM('purchase', 'payment', 'return', 'debit_memo') NOT NULL,
  transaction_id INT,
  amount DECIMAL(15, 2),
  balance DECIMAL(15, 2),
  transaction_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  INDEX idx_supplier (supplier_id),
  INDEX idx_date (transaction_date)
);

-- ============================================
-- AUDIT TRAIL
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  entity_type VARCHAR(100),
  entity_id INT,
  action ENUM('create', 'update', 'delete', 'view') NOT NULL,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_company_id ON products(company_id);
CREATE INDEX idx_product_sku ON products(sku);
CREATE INDEX idx_product_barcode ON products(barcode);
CREATE INDEX idx_stock_product ON stock(product_id);
CREATE INDEX idx_purchase_date ON purchases(purchase_date);
CREATE INDEX idx_sales_date ON sales(invoice_date);
CREATE INDEX idx_customer_name ON customers(name);
CREATE INDEX idx_supplier_name ON suppliers(name);
