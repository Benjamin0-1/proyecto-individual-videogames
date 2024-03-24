const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Genre = require('./Genre');

const Videogame = sequelize.define('Videogame', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  platforms: {
    type: DataTypes.STRING,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING
  },
  releaseDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  rating: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
}, {
  timestamps: false 
});

Videogame.associate = (models) => {
    Videogame.belongsToMany(models.Genre, { through: 'VideogameGenre' }); 
};

module.exports = Videogame;