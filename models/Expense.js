const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  expense_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  category: {
    type: DataTypes.ENUM('rent', 'electricity', 'salary', 'transport', 'maintenance', 'supplies', 'packaging', 'other'),
    allowNull: false
  },
  description: DataTypes.TEXT,
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  payment_mode: {
    type: DataTypes.ENUM('cash', 'cheque', 'bank_transfer', 'upi', 'card'),
    defaultValue: 'cash'
  },
  reference_number: DataTypes.STRING(100),
  invoice_number: DataTypes.STRING(100),
  payment_date: DataTypes.DATE,
  bill_image_path: DataTypes.STRING(255),
  notes: DataTypes.TEXT,
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'paid', 'rejected'),
    defaultValue: 'pending'
  },
  approved_by: DataTypes.INTEGER,
  approval_date: DataTypes.DATE,
  created_by: DataTypes.INTEGER
}, {
  tableName: 'expenses',
  timestamps: true,
  underscored: true
});

module.exports = Expense;
