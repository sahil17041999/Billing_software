const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SmtpSetting = sequelize.define('SmtpSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  is_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  host: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  port: {
    type: DataTypes.INTEGER,
    defaultValue: 587
  },
  from_email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  from_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  use_ssl: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  require_auth: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'smtp_settings',
  timestamps: true,
  underscored: true
});

module.exports = SmtpSetting;
