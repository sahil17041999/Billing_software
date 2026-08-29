// models/CompanySubscription.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CompanySubscription = sequelize.define('CompanySubscription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  plan_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  billing_cycle: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    defaultValue: 'monthly'
  },
  status: {
    type: DataTypes.ENUM('active', 'trial', 'expired', 'cancelled'),
    defaultValue: 'active'
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  next_billing_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  amount_paid: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  payment_method: {
    type: DataTypes.STRING(50),
    defaultValue: 'UPI'
  },
  transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  license_key: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  invoice_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  base_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  payment_status: {
    type: DataTypes.ENUM('paid', 'pending', 'failed', 'refunded'),
    defaultValue: 'paid'
  },
  auto_renew: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'company_subscriptions',
  timestamps: true,
  underscored: true
});

module.exports = CompanySubscription;
