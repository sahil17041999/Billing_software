const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sale = sequelize.define('Sale', {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    company_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    customer_id: DataTypes.INTEGER,

    invoice_number: {
        type: DataTypes.STRING(50),
        allowNull: false
    },

    invoice_date: {
        type: DataTypes.DATE,
        allowNull: false
    },

    total_amount: DataTypes.DECIMAL(15, 2),

    tax_amount: DataTypes.DECIMAL(15, 2),

    discount_amount: DataTypes.DECIMAL(15, 2),

    grand_total: DataTypes.DECIMAL(15, 2),

    payment_status: {
        type: DataTypes.ENUM(
            'pending',
            'partial',
            'paid'
        ),
        defaultValue: 'paid'
    },

    sales_status: {
        type: DataTypes.ENUM(
            'draft',
            'completed',
            'cancelled'
        ),
        defaultValue: 'completed'
    },

    cashier_id: DataTypes.INTEGER,

    notes: DataTypes.TEXT

}, {
    tableName: 'sales',
    timestamps: true,
    underscored: true,

    indexes: [
        {
            unique: true,
            fields: [
                'company_id',
                'invoice_number'
            ]
        },
        {
            fields: [
                'invoice_date'
            ]
        }
    ]
});

module.exports = Sale;