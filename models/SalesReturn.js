const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SalesReturn = sequelize.define('SalesReturn', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sales_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  return_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  return_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  total_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  tax_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  return_reason: DataTypes.TEXT,
  return_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'completed'
  },
  created_by: DataTypes.INTEGER
}, {
  tableName: 'sales_returns',
  timestamps: true,
  underscored: true
});

module.exports = SalesReturn;
