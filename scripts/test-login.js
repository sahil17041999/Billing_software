require('dotenv').config();
const { User, Company, Role, setupAssociations } = require('../models');
const { sequelize } = require('../config/database');

async function testLogin() {
  try {
    console.log('🔍 Testing login system...\n');
    
    // Setup associations first
    setupAssociations();
    console.log('✓ Associations initialized\n');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connected\n');
    
    // Check if admin user exists
    const adminUser = await User.findOne({
      where: { username: 'admin' },
      include: [
        { association: 'company', model: Company },
        { association: 'role', model: Role }
      ]
    });
    
    if (!adminUser) {
      console.log('✗ Admin user not found in database');
      console.log('Creating admin user...');
      
      // Get or create role and company
      const [role] = await Role.findOrCreate({
        where: { name: 'Admin' },
        defaults: { description: 'Administrator role' }
      });
      
      const [company] = await Company.findOrCreate({
        where: { code: 'DEFAULT' },
        defaults: { name: 'Default Company' }
      });
      
      // Create admin user
      const newAdmin = await User.create({
        company_id: company.id,
        username: 'admin',
        email: 'admin@grocery.local',
        password_hash: 'admin123', // Will be hashed by hook
        first_name: 'Admin',
        last_name: 'User',
        role_id: role.id,
        is_active: true
      });
      
      console.log('✓ Admin user created successfully');
      console.log(`  Username: admin`);
      console.log(`  Password: admin123`);
      console.log(`  Email: ${newAdmin.email}\n`);
    } else {
      console.log('✓ Admin user found');
      console.log(`  ID: ${adminUser.id}`);
      console.log(`  Username: ${adminUser.username}`);
      console.log(`  Email: ${adminUser.email}`);
      console.log(`  Active: ${adminUser.is_active}`);
      console.log(`  Company: ${adminUser.company.name}`);
      console.log(`  Role: ${adminUser.role.name}\n`);
      
      // Test password verification
      console.log('🔑 Testing password verification...');
      const passwordMatch = await adminUser.verifyPassword('admin123');
      if (passwordMatch) {
        console.log('✓ Password verification works correctly\n');
      } else {
        console.log('✗ Password verification failed\n');
      }
    }
    
    // Check views
    const fs = require('fs');
    const loginPath = './views/admin/login.ejs';
    const dashboardPath = './views/admin/dashboard.ejs';
    
    console.log('📄 Checking view files...');
    if (fs.existsSync(loginPath)) {
      console.log('✓ Login template exists');
    } else {
      console.log('✗ Login template missing at ' + loginPath);
    }
    
    if (fs.existsSync(dashboardPath)) {
      console.log('✓ Dashboard template exists');
    } else {
      console.log('✗ Dashboard template missing at ' + dashboardPath);
    }
    
    console.log('\n✅ Test complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await sequelize.close();
  }
}

testLogin();
