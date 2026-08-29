const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockLedger = sequelize.define('StockLedger', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  transaction_type: {
    type: DataTypes.ENUM('in', 'out', 'adjustment', 'transfer', 'damage'),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  opening_stock: DataTypes.INTEGER,
  closing_stock: DataTypes.INTEGER,
  reference_type: DataTypes.STRING(50),
  reference_id: DataTypes.INTEGER,
  batch_number: DataTypes.STRING(100),
  expiry_date: DataTypes.DATE,
  notes: DataTypes.TEXT,
  created_by: DataTypes.INTEGER
}, {
  tableName: 'stock_ledger',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true,
  indexes: [
    {
      fields: ['created_at']
    },
    {
      fields: ['product_id']
    }
  ]
});

module.exports = StockLedger;
