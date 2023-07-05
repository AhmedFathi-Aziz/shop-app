const Sequelize = require('sequelize');
const sequelize = require('../util/db');

const User = sequelize.define('user', { 
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        required: true,
        allowNull: false
    },
    resetToken: Sequelize.STRING,
    resetTokenExpiration: Sequelize.DATE
});

module.exports = User;