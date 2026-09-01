const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: DataTypes.STRING(255),
  phone: DataTypes.STRING(20),
  address: DataTypes.TEXT,
  city: DataTypes.STRING(100),
  state: DataTypes.STRING(100),
  postal_code: DataTypes.STRING(10),
  gstin: DataTypes.STRING(20),
  pan: DataTypes.STRING(10),
  logo_path: DataTypes.STRING(255),
  stamp_image: DataTypes.STRING(255),
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  tableName: 'companies',
  timestamps: true,
  underscored: true
});

module.exports = Company;
