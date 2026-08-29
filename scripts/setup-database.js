const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const setupDatabase = async () => {
  console.log('Starting database setup...\n');

  try {
    // Create simple connection (not promise-based)
    const connection = mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    connection.connect((err) => {
      if (err) throw err;
      console.log('✓ Connected to MySQL server');

      // Create database
      const dbName = process.env.DB_NAME || 'grocery_billing';
      connection.query(
        `CREATE DATABASE IF NOT EXISTS ${dbName} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
        (err) => {
          if (err) throw err;
          console.log(`✓ Database '${dbName}' created/verified`);

          // Select database
          connection.query(`USE ${dbName}`, (err) => {
            if (err) throw err;

            // Read schema file
            const schemaPath = path.join(__dirname, '../database/schema.sql');
            if (!fs.existsSync(schemaPath)) {
              throw new Error(`Schema file not found at ${schemaPath}`);
            }

            const schema = fs.readFileSync(schemaPath, 'utf8');
            const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
            let completed = 0;

            // Execute statements one by one
            const executeNext = (index) => {
              if (index >= statements.length) {
                console.log(`✓ All tables created successfully`);
                
                // Insert default data
                insertDefaultData(connection, () => {
                  connection.end();
                  console.log('\n✓ Database setup completed successfully!');
                  console.log('\nNext steps:');
                  console.log('1. Run: node scripts/create-admin.js');
                  console.log('2. Run: npm run dev');
                });
                return;
              }

              const statement = statements[index].trim() + ';';
              connection.query(statement, (err) => {
                if (err && !err.message.includes('already exists')) {
                  console.error('Error executing statement:', err.message);
                }
                executeNext(index + 1);
              });
            };

            executeNext(0);
          });
        }
      );
    });
  } catch (error) {
    console.error('✗ Error during database setup:', error.message);
    process.exit(1);
  }
};

const insertDefaultData = (connection, callback) => {
  const insertQueries = [
    `INSERT IGNORE INTO roles (id, name, description, is_active) 
     VALUES 
      (1, 'admin', 'Administrator with full access', 1),
      (2, 'manager', 'Manager with management access', 1),
      (3, 'cashier', 'Cashier for sales transactions', 1),
      (4, 'warehouse', 'Warehouse staff for inventory', 1),
      (5, 'accountant', 'Accountant for financial records', 1)`,
    
    `INSERT IGNORE INTO companies (id, name, email, phone, is_active) 
     VALUES (1, 'Sample Store', 'store@example.com', '9999999999', 1)`,
    
    `INSERT IGNORE INTO units (company_id, name, short_name, is_active) 
     VALUES 
      (1, 'Kilogram', 'kg', 1),
      (1, 'Liter', 'L', 1),
      (1, 'Piece', 'pc', 1),
      (1, 'Box', 'box', 1),
      (1, 'Packet', 'pkt', 1),
      (1, 'Dozen', 'dz', 1)`,
    
    `INSERT IGNORE INTO taxes (company_id, name, rate, tax_code, is_active) 
     VALUES 
      (1, 'No Tax', 0, 'NO_TAX', 1),
      (1, 'GST 5%', 5, 'GST_5', 1),
      (1, 'GST 12%', 12, 'GST_12', 1),
      (1, 'GST 18%', 18, 'GST_18', 1),
      (1, 'GST 28%', 28, 'GST_28', 1)`,
    
    `INSERT IGNORE INTO payment_modes (company_id, name, code, is_active) 
     VALUES 
      (1, 'Cash', 'CASH', 1),
      (1, 'UPI', 'UPI', 1),
      (1, 'Card', 'CARD', 1),
      (1, 'Credit/Udhaar', 'CREDIT', 1),
      (1, 'Cheque', 'CHEQUE', 1)`,
    
    `INSERT IGNORE INTO categories (company_id, name, is_active) 
     VALUES 
      (1, 'Dairy & Milk', 1),
      (1, 'Vegetables', 1),
      (1, 'Fruits', 1),
      (1, 'Cereals & Grains', 1),
      (1, 'Beverages', 1),
      (1, 'Bakery', 1)`
  ];

  let queryIndex = 0;

  const executeInsertNext = () => {
    if (queryIndex >= insertQueries.length) {
      console.log('✓ Default data inserted');
      callback();
      return;
    }

    connection.query(insertQueries[queryIndex], (err) => {
      if (err && !err.message.includes('Duplicate')) {
        console.error('Error inserting data:', err.message);
      }
      queryIndex++;
      executeInsertNext();
    });
  };

  executeInsertNext();
};

setupDatabase();
