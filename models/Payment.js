const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  transaction_type: {
    type: DataTypes.ENUM('purchase_payment', 'sales_payment', 'customer_payment', 'supplier_payment'),
    allowNull: false
  },
  transaction_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  customer_supplier_id: DataTypes.INTEGER,
  payment_mode_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  reference_number: DataTypes.STRING(100),
  payment_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  notes: DataTypes.TEXT,
  created_by: DataTypes.INTEGER
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true
});

module.exports = Payment;
