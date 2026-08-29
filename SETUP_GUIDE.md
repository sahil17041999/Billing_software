# Grocery Billing Software - Setup Guide

## Prerequisites

1. **Node.js** (v14 or higher)
2. **MySQL** (v5.7 or higher)
3. **npm** (comes with Node.js)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express.js - Web framework
- MySQL2 - MySQL driver
- Sequelize - ORM for database management
- EJS - Template engine
- bcryptjs - Password hashing
- express-session - Session management
- CORS - Cross-Origin Resource Sharing
- dotenv - Environment variables

### 2. MySQL Database Setup

#### Option A: Using MySQL Command Line

1. Open MySQL command line or MySQL Workbench
2. Create the database:

```sql
CREATE DATABASE grocery_billing DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Run the schema file to create all tables:

```bash
mysql -u root -p grocery_billing < database/schema.sql
```

#### Option B: Using the Node.js Setup Script

```bash
node scripts/setup-database.js
```

### 3. Environment Configuration

Edit the `.env` file with your database credentials:

```env
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=grocery_billing
DB_PORT=3306

# Session Configuration
SESSION_SECRET=your_secure_session_secret_key

# Application
APP_NAME=Grocery Billing Software
APP_URL=http://localhost:3000
```

### 4. Start the Application

#### Development Mode (with auto-reload)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## Initial Setup

### Create Admin User

After the database is set up, create an admin user:

```bash
node scripts/create-admin.js
```

Or manually insert via SQL:

```sql
INSERT INTO roles (name, description, permissions, is_active) 
VALUES ('admin', 'Administrator', '{}', 1);

INSERT INTO companies (name, email, phone, gstin, is_active) 
VALUES ('My Store', 'store@example.com', '9999999999', 'GSTIN_HERE', 1);

-- Password: admin123 (hashed)
INSERT INTO users (company_id, username, email, password_hash, first_name, role_id, is_active) 
VALUES (1, 'admin', 'admin@example.com', '$2a$10/hashedpassword', 'Admin', 1, 1);
```

## Database Schema Overview

### Master Setup Tables
- `companies` - Store/Company information
- `roles` - User roles
- `users` - User accounts
- `categories` - Product categories
- `brands` - Product brands
- `units` - Unit of measurements
- `taxes` - Tax/GST rates
- `payment_modes` - Payment methods
- `products` - Product master data
- `customers` - Customer information
- `suppliers` - Supplier information

### Transaction Tables
- `purchases` - Purchase orders
- `purchase_details` - Purchase line items
- `sales` - Sales/POS transactions
- `sales_details` - Sales line items
- `payments` - Payment transactions
- `stock` - Current stock levels
- `stock_ledger` - Stock transaction history

### Additional Tables
- `sales_returns` - Sales return records
- `purchase_returns` - Purchase return records
- `expenses` - Expense records
- `day_end_closing` - Daily cash closing
- `customer_ledger` - Customer transaction ledger
- `supplier_ledger` - Supplier transaction ledger
- `audit_logs` - System audit trail

## API Endpoints

### Health Check
```
GET /api/health
```

### Admin Dashboard
```
GET /admin/dashboard
```

### Login
```
GET /admin/login
```

## Project Structure

```
d:\Billing_software\
├── app.js                 # Main application file
├── package.json          # Dependencies
├── .env                  # Environment variables
├── config/
│   └── database.js       # Database configuration
├── models/
│   ├── index.js         # Model exports and associations
│   ├── Company.js
│   ├── User.js
│   ├── Product.js
│   ├── Customer.js
│   ├── Supplier.js
│   ├── Purchase.js
│   ├── Sale.js
│   ├── Stock.js
│   └── ... (other models)
├── controllers/         # Business logic (to be created)
├── routes/             # API routes (to be created)
├── middleware/         # Custom middleware (to be created)
├── database/
│   └── schema.sql      # Database schema
├── scripts/
│   ├── setup-database.js    # Database setup helper
│   └── create-admin.js      # Admin user creation
├── views/              # EJS templates
│   └── admin/
│       ├── dashboard.ejs
│       ├── login.ejs
│       └── users.ejs
└── public/             # Static files

```

## Troubleshooting

### Error: "connect ECONNREFUSED"
- MySQL is not running
- Check DB_HOST and DB_PORT in .env
- Verify MySQL credentials

### Error: "database does not exist"
- Run the database creation script
- Check DB_NAME in .env

### Error: "Access denied for user"
- Verify MySQL username and password
- Check user privileges

## Next Steps

1. Create authentication middleware
2. Build controllers for master setup modules
3. Implement POS/Sales module
4. Add purchase management
5. Create inventory management features
6. Build reporting system
7. Add validation and error handling

## Support

For issues or questions, check the system flow diagram for module requirements.
