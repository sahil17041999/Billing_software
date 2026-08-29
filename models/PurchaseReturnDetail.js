const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PurchaseReturnDetail = sequelize.define('PurchaseReturnDetail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  return_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  unit_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  reason_code: DataTypes.STRING(255)
}, {
  tableName: 'purchase_return_details',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true
});

module.exports = PurchaseReturnDetail;

