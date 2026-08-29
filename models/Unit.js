const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Unit = sequelize.define('Unit', {
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
    type: DataTypes.STRING(50),
    allowNull: false
  },
  short_name: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  abbreviation: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('short_name');
    },
    set(val) {
      this.setDataValue('short_name', val);
    }
  },
  description: DataTypes.TEXT,
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  tableName: 'units',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['company_id', 'name']
    }
  ]
});

module.exports = Unit;
