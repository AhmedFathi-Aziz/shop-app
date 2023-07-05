const Sequelize = require('sequelize');

const sequelize = require('../util/db');

const Session = sequelize.define('session', {
    sid: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    expires: Sequelize.DATE,
    data: Sequelize.TEXT
});

module.exports = Session;