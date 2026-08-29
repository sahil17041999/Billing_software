const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DayEndClosing = sequelize.define('DayEndClosing', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  closing_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  closed_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  opening_cash: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  cash_sales: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  upi_sales: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  card_sales: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  total_expenses: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  cash_withdrawal: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  expected_cash: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  actual_cash: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  cash_difference: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('open', 'closed', 'verified'),
    defaultValue: 'open'
  },
  notes: DataTypes.TEXT
}, {
  tableName: 'day_end_closing',
  timestamps: true,
  underscored: true
});

module.exports = DayEndClosing;
