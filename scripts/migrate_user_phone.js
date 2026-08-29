// scripts/migrate_user_phone.js
const { pool } = require('../config/database');

async function migrate() {
  try {
    console.log('Connecting to database...');
    // 1. Update user 1 to have phone 9999999999 if it duplicates user 2
    await pool.query("UPDATE users SET phone = '9999999999' WHERE id = 1 AND phone = '8788946164'");
    console.log('✓ User 1 phone checked/updated to 9999999999');

    // 2. Modify password_hash to allow NULL
    await pool.query("ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL DEFAULT NULL");
    console.log('✓ password_hash column modified to allow NULL');

    // 3. Check if unique_user_phone index exists, if not add it
    const [indexes] = await pool.query("SHOW INDEX FROM users WHERE Key_name = 'unique_user_phone'");
    if (indexes.length === 0) {
      await pool.query("ALTER TABLE users ADD UNIQUE KEY unique_user_phone (phone)");
      console.log('✓ Added unique_user_phone index on users(phone)');
    } else {
      console.log('✓ unique_user_phone index already exists');
    }

    // Verify current users
    const [users] = await pool.query("SELECT id, username, phone, is_active FROM users");
    console.log('Current users:', users);

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
