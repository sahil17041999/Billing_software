// scripts/migrate_user_columns.js
require('dotenv').config();
const { pool } = require('../config/database');

async function migrateColumns() {
  console.log('🔄 Checking and applying database column migrations...\n');

  const columnDefinitions = [
    {
      table: 'users',
      column: 'signatory_name',
      sql: 'ALTER TABLE users ADD COLUMN signatory_name VARCHAR(100) NULL AFTER last_name'
    },
    {
      table: 'users',
      column: 'signatory_designation',
      sql: "ALTER TABLE users ADD COLUMN signatory_designation VARCHAR(100) NULL DEFAULT 'Authorized Signatory' AFTER signatory_name"
    },
    {
      table: 'users',
      column: 'signature_image',
      sql: 'ALTER TABLE users ADD COLUMN signature_image VARCHAR(255) NULL AFTER signatory_designation'
    },
    {
      table: 'users',
      column: 'stamp_image',
      sql: 'ALTER TABLE users ADD COLUMN stamp_image VARCHAR(255) NULL AFTER signature_image'
    },
    {
      table: 'users',
      column: 'avatar',
      sql: 'ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL AFTER last_name'
    },
    {
      table: 'users',
      column: 'phone',
      sql: 'ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL AFTER last_name'
    },
    {
      table: 'companies',
      column: 'stamp_image',
      sql: 'ALTER TABLE companies ADD COLUMN stamp_image VARCHAR(255) NULL AFTER logo_path'
    }
  ];

  try {
    for (const item of columnDefinitions) {
      const [rows] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [item.table, item.column]
      );

      if (rows.length === 0) {
        console.log(`➕ Adding missing column: ${item.table}.${item.column}...`);
        await pool.query(item.sql);
        console.log(`✓ Column ${item.table}.${item.column} added successfully.`);
      } else {
        console.log(`✓ Column ${item.table}.${item.column} already exists.`);
      }
    }

    console.log('\n🎉 All database columns verified and migrated successfully!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    process.exit(0);
  }
}

migrateColumns();
