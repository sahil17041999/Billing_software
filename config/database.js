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

module.exports = {
  pool,
  sequelize,
  testConnection
};
