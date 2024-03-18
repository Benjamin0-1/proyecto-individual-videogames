const Videogame = require('../models/Videogame');
const Genre = require('../models/Genre');

Videogame.belongsToMany(Genre, { through: 'VideogameGenre', timestamps: false });
Genre.belongsToMany(Videogame, { through: 'VideogameGenre', timestamps: false });


module.exports = {};
