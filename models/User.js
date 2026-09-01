const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(255),
    unique: true
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  first_name: DataTypes.STRING(100),
  last_name: DataTypes.STRING(100),
  avatar: DataTypes.STRING(255),
  signatory_name: DataTypes.STRING(100),
  signatory_designation: {
    type: DataTypes.STRING(100),
    defaultValue: 'Authorized Signatory'
  },
  signature_image: DataTypes.STRING(255),
  stamp_image: DataTypes.STRING(255),
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  },
  last_login: DataTypes.DATE
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash && !user.password_hash.startsWith('$2a$') && !user.password_hash.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        if (user.password_hash && !user.password_hash.startsWith('$2a$') && !user.password_hash.startsWith('$2b$')) {
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
      }
    }
  }
});

// Method to verify password
User.prototype.verifyPassword = async function(password) {
  if (!password || !this.password_hash) return false;
  return await bcrypt.compare(password, this.password_hash);
};

module.exports = User;
