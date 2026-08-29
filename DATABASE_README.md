# Grocery Billing Software - MySQL Database Setup

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database
Edit `.env` file:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=grocery_billing
DB_PORT=3306
```

### 3. Setup Database
```bash
node scripts/setup-database.js
```

### 4. Create Admin User
```bash
node scripts/create-admin.js
```

### 5. Start Application
```bash
npm run dev
```

---

## 📊 Database Architecture

### Core Entities

#### 1. **Master Setup Module**
- **companies** - Store/Organization
- **roles** - User roles (Admin, Manager, Cashier, etc.)
- **users** - User accounts
- **categories** - Product categories
- **brands** - Product brands
- **units** - Units of measurement (kg, L, pc, etc.)
- **taxes** - Tax/GST rates
- **payment_modes** - Payment methods
- **products** - Product master data
- **customers** - Customer information
- **suppliers** - Supplier information

#### 2. **Purchase Management Module**
- **purchases** - Purchase orders from suppliers
- **purchase_details** - Line items in purchase orders

#### 3. **Sales/POS Module**
- **sales** - Sales transactions/invoices
- **sales_details** - Line items in sales

#### 4. **Stock Management Module**
- **stock** - Current stock levels by product and batch
- **stock_ledger** - Transaction history of stock movements

#### 5. **Payment Module**
- **payments** - All payment transactions

#### 6. **Return Management Module**
- **sales_returns** - Customer returns
- **purchase_returns** - Supplier returns
- **sales_return_details** - Details of sales returns
- **purchase_return_details** - Details of purchase returns

#### 7. **Expense Management Module**
- **expenses** - Business expenses (rent, electricity, salary, etc.)

#### 8. **Day End/Cash Closing Module**
- **day_end_closing** - Daily cash reconciliation

#### 9. **Ledger Module**
- **customer_ledger** - Customer transaction history
- **supplier_ledger** - Supplier transaction history

#### 10. **Audit Module**
- **audit_logs** - System activity logs

---

## 🗄️ Table Structure Details

### Companies
```sql
- id (INT, PK)
- name (VARCHAR, Required)
- email, phone, address
- city, state, postal_code
- gstin, pan
- logo_path
- is_active (TINYINT, Default: 1)
- timestamps (created_at, updated_at)
```

### Users
```sql
- id (INT, PK)
- company_id (INT, FK)
- username (VARCHAR, Unique, Required)
- email (VARCHAR, Unique)
- password_hash (VARCHAR, Required)
- first_name, last_name, phone
- role_id (INT, FK, Required)
- is_active (TINYINT, Default: 1)
- last_login (DATETIME)
- timestamps
```

### Products
```sql
- id (INT, PK)
- company_id, category_id, brand_id, unit_id (FKs)
- name (VARCHAR, Required)
- description, sku, barcode
- tax_id (FK)
- purchase_price, selling_price (DECIMAL)
- min_stock_level, reorder_quantity
- is_active
- timestamps
```

### Customers
```sql
- id (INT, PK)
- company_id (INT, FK)
- name (VARCHAR, Required)
- phone, email, address, city, state, postal_code
- gstin
- credit_limit, credit_used, outstanding_amount (DECIMAL)
- customer_type (retail/wholesale, Default: retail)
- is_active
- timestamps
```

### Sales
```sql
- id (INT, PK)
- company_id, customer_id, cashier_id (FKs)
- invoice_number (VARCHAR, Unique per company)
- invoice_date (DATE, Required)
- total_amount, tax_amount, discount_amount, grand_total (DECIMAL)
- payment_status (pending/partial/paid, Default: paid)
- sales_status (draft/completed/cancelled, Default: completed)
- notes
- timestamps
```

### Stock
```sql
- id (INT, PK)
- company_id, product_id (FKs)
- quantity (INT)
- value (DECIMAL)
- batch_number, expiry_date
- location_rack
- reorder_flag (TINYINT)
- timestamps
```

---

## 🔗 Key Relationships

```
Company (1) ──────────────── (∞) Users
           ├──────────────── (∞) Products
           ├──────────────── (∞) Customers
           ├──────────────── (∞) Suppliers
           ├──────────────── (∞) Purchases
           ├──────────────── (∞) Sales
           ├──────────────── (∞) Stock
           └──────────────── (∞) Expenses

Product (1) ──────────────── (∞) PurchaseDetails
          ├──────────────── (∞) SalesDetails
          ├──────────────── (∞) Stock
          └──────────────── (∞) StockLedger

Supplier (1) ─────────────── (∞) Purchases

Customer (1) ─────────────── (∞) Sales

Purchase (1) ─────────────── (∞) PurchaseDetails

Sale (1) ──────────────────── (∞) SalesDetails
```

---

## 📝 Sample SQL Queries

### Get Sales Summary
```sql
SELECT 
    DATE(invoice_date) as date,
    COUNT(*) as transactions,
    SUM(grand_total) as total_sales,
    SUM(tax_amount) as total_tax
FROM sales
WHERE company_id = 1 AND invoice_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(invoice_date)
ORDER BY date DESC;
```

### Get Low Stock Products
```sql
SELECT 
    p.id, p.name, c.name as category,
    s.quantity, p.min_stock_level
FROM stock s
JOIN products p ON s.product_id = p.id
JOIN categories c ON p.category_id = c.id
WHERE s.quantity <= p.min_stock_level
AND s.company_id = 1
ORDER BY s.quantity ASC;
```

### Get Customer Outstanding Balance
```sql
SELECT 
    c.id, c.name, c.outstanding_amount,
    COUNT(s.id) as total_invoices
FROM customers c
LEFT JOIN sales s ON c.id = s.customer_id
WHERE c.company_id = 1 AND c.outstanding_amount > 0
GROUP BY c.id, c.name
ORDER BY c.outstanding_amount DESC;
```

### Get Daily Sales Report
```sql
SELECT 
    DATE(s.invoice_date) as sales_date,
    COUNT(*) as invoice_count,
    SUM(s.grand_total) as total_sales,
    SUM(s.tax_amount) as total_tax,
    AVG(s.grand_total) as avg_invoice
FROM sales s
WHERE s.company_id = 1 
AND s.sales_status = 'completed'
AND DATE(s.invoice_date) = CURDATE()
GROUP BY DATE(s.invoice_date);
```

---

## 🔐 User Roles & Permissions

### Default Roles (Pre-configured)
1. **Admin** - Full system access
2. **Manager** - Management operations
3. **Cashier** - Sales and payment operations
4. **Warehouse** - Stock and inventory operations
5. **Accountant** - Financial and reporting access

---

## 📦 Backup & Recovery

### Backup Database
```bash
mysqldump -u root -p grocery_billing > backup.sql
```

### Restore Database
```bash
mysql -u root -p grocery_billing < backup.sql
```

---

## ⚠️ Important Notes

1. **Character Set**: Database uses `utf8mb4` for full Unicode support
2. **Foreign Keys**: All relationships are enforced with foreign keys
3. **Timestamps**: All tables have `created_at` and `updated_at` fields
4. **Indexes**: Key columns are indexed for performance
5. **Soft Delete**: Consider adding soft delete for production (is_active flag)

---

## 🐛 Troubleshooting

### Issue: "Unknown column in field list"
- Ensure all table names and column names match the schema
- Check for typos in SQL queries

### Issue: "Foreign key constraint fails"
- Ensure parent record exists before inserting child records
- Check foreign key relationships

### Issue: "Duplicate entry"
- Check unique constraints on username, email, sku, barcode
- Ensure invoice_number and purchase_number are unique per company

### Issue: "Connection refused"
- Verify MySQL is running
- Check DB credentials in .env
- Confirm DB_HOST and DB_PORT are correct

---

## 📚 Model Usage (Sequelize ORM)

### Creating a Product
```javascript
const { Product } = require('./models');

const product = await Product.create({
  company_id: 1,
  category_id: 1,
  brand_id: 1,
  unit_id: 1,
  name: 'Fresh Tomato',
  sku: 'TOMATO-001',
  barcode: '1234567890123',
  tax_id: 3,
  purchase_price: 25.00,
  selling_price: 35.00,
  min_stock_level: 50
});
```

### Fetching with Relationships
```javascript
const product = await Product.findByPk(1, {
  include: [
    { association: 'category' },
    { association: 'brand' },
    { association: 'unit' },
    { association: 'tax' }
  ]
});
```

### Updating Stock
```javascript
const stock = await Stock.findOne({
  where: {
    product_id: 1,
    company_id: 1,
    batch_number: 'BATCH-001'
  }
});

await stock.update({
  quantity: stock.quantity - 10
});
```

---

## 🎯 Next Steps

1. ✅ Database schema created
2. ✅ Models defined with Sequelize
3. ⏳ Create Controllers for business logic
4. ⏳ Implement Routes/APIs
5. ⏳ Build Authentication middleware
6. ⏳ Create Frontend templates
7. ⏳ Add validation rules
8. ⏳ Implement error handling

For questions or support, refer to the system flow diagram for detailed module requirements.
