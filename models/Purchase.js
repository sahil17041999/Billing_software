const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Purchase = sequelize.define('Purchase', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  purchase_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  purchase_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  invoice_number: DataTypes.STRING(50),
  invoice_date: DataTypes.DATE,
  total_amount: DataTypes.DECIMAL(15, 2),
  tax_amount: DataTypes.DECIMAL(15, 2),
  discount_amount: DataTypes.DECIMAL(15, 2),
  grand_total: DataTypes.DECIMAL(15, 2),
  payment_status: {
    type: DataTypes.ENUM('pending', 'partial', 'paid'),
    defaultValue: 'pending'
  },
  purchase_status: {
    type: DataTypes.ENUM('draft', 'confirmed', 'received', 'cancelled'),
    defaultValue: 'draft'
  },
  notes: DataTypes.TEXT,
  created_by: DataTypes.INTEGER
}, {
  tableName: 'purchases',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['company_id', 'purchase_number']
    },
    {
      fields: ['purchase_date']
    }
  ]
});

module.exports = Purchase;
