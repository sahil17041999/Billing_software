const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CustomerLedger = sequelize.define('CustomerLedger', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  transaction_type: {
    type: DataTypes.ENUM('sale', 'payment', 'return', 'adjustment'),
    allowNull: false
  },
  transaction_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  reference_type: DataTypes.STRING(50),
  reference_id: DataTypes.INTEGER,
  reference_number: DataTypes.STRING(100),
  debit_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  credit_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  balance: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  description: DataTypes.TEXT,
  created_by: DataTypes.INTEGER
}, {
  tableName: 'customer_ledger',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true,
  indexes: [
    { fields: ['company_id', 'customer_id'] },
    { fields: ['transaction_date'] }
  ]
});

module.exports = CustomerLedger;
