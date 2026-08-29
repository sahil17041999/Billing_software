const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaymentMode = sequelize.define('PaymentMode', {
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
    type: DataTypes.STRING(100),
    allowNull: false
  },
  code: DataTypes.STRING(50),
  description: DataTypes.TEXT,
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  tableName: 'payment_modes',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['company_id', 'name']
    }
  ]
});

module.exports = PaymentMode;
