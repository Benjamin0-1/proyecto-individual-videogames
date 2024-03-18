const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Videogame = require('./Videogame');

const Genre = sequelize.define('Genre', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    createdAt: false,
    updatedAt: false
});

Genre.associate = (models) => {
    Genre.belongsToMany(models.Videogame, { through: 'VideogameGenre' }); 
};

module.exports = Genre;