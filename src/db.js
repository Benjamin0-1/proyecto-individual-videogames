const { Sequelize } = require('sequelize');


const sequelize = new Sequelize({
    database: 'videogames',
    username: 'postgres',
    password: '12241530', 
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

module.exports = sequelize;