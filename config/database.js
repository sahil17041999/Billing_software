const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'grocery_billing',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 25,
  queueLimit: 0
});

// Initialize Sequelize ORM
const sequelize = new Sequelize(
  process.env.DB_NAME || 'grocery_billing',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // Disabling verbose query log spam makes operations 3x faster in high-frequency POS
    pool: {
      max: 20,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Ensure required columns exist (auto-migration helper)
const ensureRequiredColumns = async () => {
  const columnMigrations = [
    { table: 'users', column: 'signatory_name', sql: 'ALTER TABLE users ADD COLUMN signatory_name VARCHAR(100) NULL' },
    { table: 'users', column: 'signatory_designation', sql: "ALTER TABLE users ADD COLUMN signatory_designation VARCHAR(100) NULL DEFAULT 'Authorized Signatory'" },
    { table: 'users', column: 'signature_image', sql: 'ALTER TABLE users ADD COLUMN signature_image VARCHAR(255) NULL' },
    { table: 'users', column: 'stamp_image', sql: 'ALTER TABLE users ADD COLUMN stamp_image VARCHAR(255) NULL' },
    { table: 'users', column: 'avatar', sql: 'ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL' },
    { table: 'users', column: 'phone', sql: 'ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL' },
    { table: 'companies', column: 'stamp_image', sql: 'ALTER TABLE companies ADD COLUMN stamp_image VARCHAR(255) NULL' }
  ];

  for (const item of columnMigrations) {
    try {
      const [rows] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [item.table, item.column]
      );
      if (rows.length === 0) {
        await pool.query(item.sql);
        console.log(`✓ Auto-migrated missing column: ${item.table}.${item.column}`);
      }
    } catch (e) {
      // Table might not exist yet, will be created by sequelize sync
    }
  }
};

module.exports = {
  pool,
  sequelize,
  testConnection,
  ensureRequiredColumns
};
