// models/ContactInquiry.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContactInquiry = sequelize.define('ContactInquiry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  store_name: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  subject: {
    type: DataTypes.STRING(150),
    allowNull: true,
    defaultValue: 'General Inquiry'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('new', 'read', 'contacted', 'resolved'),
    defaultValue: 'new'
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'contact_inquiries',
  timestamps: true,
  underscored: true
});

// Self-ensure table exists on startup
ContactInquiry.sync();

module.exports = ContactInquiry;
