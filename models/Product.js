const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  brand_id: DataTypes.INTEGER,
  unit_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: DataTypes.TEXT,
  sku: {
    type: DataTypes.STRING(100),
    unique: true
  },
  barcode: {
    type: DataTypes.STRING(100),
    unique: true
  },
  tax_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  purchase_price: DataTypes.DECIMAL(10, 2),
  selling_price: DataTypes.DECIMAL(10, 2),
  min_stock_level: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  reorder_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 50
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true
});

module.exports = Product;
