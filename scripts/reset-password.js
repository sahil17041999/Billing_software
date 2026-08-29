require('dotenv').config();
const { User, setupAssociations } = require('../models');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  try {
    console.log('🔐 Resetting admin password...\n');
    
    // Setup associations
    setupAssociations();
    
    // Test database connection
    await sequelize.authenticate();
    
    // Find admin user
    const admin = await User.findOne({ where: { username: 'admin' } });
    
    if (!admin) {
      console.log('✗ Admin user not found');
      process.exit(1);
    }
    
    console.log(`Found admin user: ${admin.username}`);
    
    // Reset password - use sequelize update with hooks: false
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    await User.update(
      { password_hash: hashedPassword },
      { 
        where: { id: admin.id },
        hooks: false, // Skip hooks to avoid double-hashing
        individualHooks: false
      }
    );
    
    console.log('✓ Password reset successfully');
    console.log(`  Username: admin`);
    console.log(`  Password: admin123\n`);
    
    // Reload admin user from database
    const reloadedAdmin = await User.findOne({ where: { id: admin.id } });
    
    // Verify password
    const isValid = await reloadedAdmin.verifyPassword('admin123');
    if (isValid) {
      console.log('✓ Password verification successful\n');
    } else {
      console.log('✗ Password verification failed');
      console.log(`  Password hash in DB: ${reloadedAdmin.password_hash}\n`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

resetPassword();
