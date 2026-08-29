const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const createAdminUser = async () => {
  console.log('Creating admin user...\n');

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'grocery_billing',
      port: process.env.DB_PORT || 3306
    });

    // Check if admin already exists
    const [existingAdmin] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      ['admin']
    );

    if (existingAdmin.length > 0) {
      console.log('✗ Admin user already exists');
      console.log('\nExisting Admin Credentials:');
      console.log('  Username: admin');
      console.log('  Password: admin123');
      await connection.end();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Insert admin user
    await connection.execute(
      `INSERT INTO users (company_id, username, email, password_hash, first_name, last_name, phone, role_id, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [1, 'admin', 'admin@example.com', hashedPassword, 'Admin', 'User', '9999999999', 1, 1]
    );

    console.log('✓ Admin user created successfully!\n');
    console.log('Login Credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('  Email: admin@example.com');
    console.log('\n⚠ IMPORTANT: Change the password after first login');

    await connection.end();

  } catch (error) {
    console.error('✗ Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdminUser();
