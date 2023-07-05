const Sequelize = require('sequelize');
require("dotenv").config();

const sequelize = new Sequelize('node', 'root', process.env.PASSWORD, {
    dialect: process.env.DIALECT,
    host: process.env.HOST
});

module.exports = sequelize;