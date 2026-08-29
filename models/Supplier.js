const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Supplier = sequelize.define('Supplier', {
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
  pan: DataTypes.STRING(10),
  bank_name: DataTypes.STRING(100),
  bank_account: DataTypes.STRING(50),
  ifsc_code: DataTypes.STRING(20),
  payment_terms: DataTypes.TEXT,
  outstanding_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  tableName: 'suppliers',
  timestamps: true,
  underscored: true
});

module.exports = Supplier;
