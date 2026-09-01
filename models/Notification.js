// models/Notification.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // null = broadcast to all or system-wide
    comment: 'Target store/company'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // null = all users in company
    comment: 'Specific target user'
  },
  type: {
    type: DataTypes.ENUM('stock', 'subscription', 'sale', 'approval', 'system', 'alert'),
    defaultValue: 'system',
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  icon: {
    type: DataTypes.STRING(50),
    defaultValue: 'ti-bell'
  },
  severity: {
    type: DataTypes.ENUM('info', 'warning', 'success', 'danger'),
    defaultValue: 'info'
  },
  link: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Action link URL when clicked'
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true
});

module.exports = Notification;
