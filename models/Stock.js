const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Stock = sequelize.define('Stock', {
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
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  value: DataTypes.DECIMAL(15, 2),
  batch_number: DataTypes.STRING(100),
  expiry_date: DataTypes.DATE,
  location_rack: DataTypes.STRING(50),
  reorder_flag: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  }
}, {
  tableName: 'stock',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['company_id', 'product_id', 'batch_number']
    },
    {
      fields: ['product_id']
    }
  ]
});

module.exports = Stock;
