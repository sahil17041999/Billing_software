// models/SubscriptionInvoice.js
// Enterprise Subscription & Licensing Tax Invoice Model
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubscriptionInvoice = sequelize.define('SubscriptionInvoice', {
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
  invoice_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  billing_cycle: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    defaultValue: 'monthly'
  },
  base_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'INR'
  },
  hsn_sac_code: {
    type: DataTypes.STRING(20),
    defaultValue: '998313' // Information Technology Software as a Service
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
  payment_status: {
    type: DataTypes.ENUM('paid', 'pending', 'failed', 'refunded'),
    defaultValue: 'paid'
  },
  period_start: {
    type: DataTypes.DATE,
    allowNull: false
  },
  period_end: {
    type: DataTypes.DATE,
    allowNull: false
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'subscription_invoices',
  timestamps: true,
  underscored: true
});

module.exports = SubscriptionInvoice;
