const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  phone: DataTypes.STRING(20),
  email: DataTypes.STRING(255),
  address: DataTypes.TEXT,
  city: DataTypes.STRING(100),
  state: DataTypes.STRING(100),
  postal_code: DataTypes.STRING(10),
  gstin: DataTypes.STRING(20),
  credit_limit: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  credit_used: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  outstanding_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  customer_type: {
    type: DataTypes.ENUM('retail', 'wholesale'),
    defaultValue: 'retail'
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  tableName: 'customers',
  timestamps: true,
  underscored: true
});

module.exports = Customer;
