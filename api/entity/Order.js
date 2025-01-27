
const Sequelize = require('sequelize');
const sequelize = require('../db'); // Ensure the proper database connection is configured

// Models
const Order = sequelize.define('Order', {
    orderId: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
    },
    customerName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    customerPhone: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    subtotal: {
        type: Sequelize.FLOAT,
        allowNull: false,
    },
    tax: {
        type: Sequelize.FLOAT,
        allowNull: false,
    },
    total: {
        type: Sequelize.FLOAT,
        allowNull: false,
    },
    paymentMethod: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    verificationCode: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    expiryDate: {
        type: Sequelize.DATE,
        allowNull: false,
    },
    items: {
        type: Sequelize.JSON,
        allowNull: false,
    }
});

module.exports = Order;