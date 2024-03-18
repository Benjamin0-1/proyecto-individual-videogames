const express = require('express');
const app = express();
const sequelize = require('./db');
const Videogame = require('./models/Videogame');
const Genre = require('./models/Genre');
const cors = require('cors');
const { Op } = require('sequelize');
const associations = require('./models/associations');

require('dotenv').config();
const API_KEY = process.env.API_KEY;

app.use(cors()); 
app.use(express.json());

//debug
app.post('/associate-genres', async (req, res) => {
    try {
        const { videogameId, genreIds } = req.body;

        // Check if the required parameters are provided
        if (!videogameId || !genreIds || !Array.isArray(genreIds)) {
            return res.status(400).json({ error: 'Invalid parameters provided' });
        }

        // Find the videogame by its ID
        const videogame = await Videogame.findByPk(videogameId);
        if (!videogame) {
            return res.status(404).json({ error: 'Videogame not found' });
        }

        // Find the genres by their IDs
        const genres = await Genre.findAll({ where: { id: genreIds } });
        if (!genres || genres.length !== genreIds.length) {
            return res.status(404).json({ error: 'One or more genres not found' });
        }

        // Associate the genres with the videogame
        await videogame.addGenres(genres);

        res.status(200).json({ message: 'Genres associated with the videogame successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/videogames', async (req, res) => {
    const URL = `https://api.rawg.io/api/games?key=${API_KEY}&page_size=10000`;

    try {
        const response = await fetch(URL);
        if (response.ok) {
            const data = await response.json();
            res.json(data);
        } else {
            res.status(404).send('No se encontraron videojuegos');
        }
    } catch (error) {
        res.status(500).json('Internal Server Error')
    }
});


app.get('/videogamesfromform', async(req, res) => {
    try {
        const gamesFromDb = await Videogame.findAll({
            include: Genre
        });

        if (gamesFromDb) {
            const formattedGames = gamesFromDb.map(game => {
                const formattedGenres = game.Genres.map(genre => ({
                    id: genre.id,
                    name: genre.name
                }));
                return {
                    id: game.id,
                    name: game.name,
                    description: game.description,
                    platforms: game.platforms,
                    image: game.image,
                    releaseDate: game.releaseDate,
                    rating: game.rating,
                    Genres: formattedGenres // Include genre values directly
                };
            });

            res.json(formattedGames);
        } else {
            res.status(404).json('No games were found');
        }
    } catch (error) {
        res.status(500).json('Internal Server Error', error)
    }
});



app.get('/videogames/name', async (req, res) => {
    const name = req.query.name;
    const lowerCaseName = encodeURI(name.toLocaleLowerCase());
    const URL = `https://api.rawg.io/api/games?search=${lowerCaseName}&key=${API_KEY}`;

    try {
        const response = await fetch(URL);
        if (response.ok) {
            const data = await response.json();
            res.json(data)
        } else {
            res.status(404).send('Not found');
        }
    } catch (error) {
        res.status(500).json('Internal Server Error')
    }
} );

app.get('/videogames/dbname', async (req, res) => {
    const dbname = req.query.name;
    if (!dbname) {
        return res.status(400).json('Game name is required');
    }

    try {
        const dbGame = await Videogame.findAll({
            where: {
                name: dbname
            }
        });
        if (dbGame && dbGame.length > 0) { // Check if games are found
            res.json(dbGame);
        } else {
            res.status(404).json('Game not found');
        }
    } catch (error) {
        res.status(500).json(`Internal Server Error: ${error}`);
    }
});




    // id from api starting: 1 and db starting: 1000000
    app.get('/videogames/:id', async (req, res) => {
        const { id } = req.params;
        const URL = `https://api.rawg.io/api/games/${id}?key=${API_KEY}`;

        try {
            if (parseInt(id) > 1000000 -1) {
                const dbGames = await Videogame.findAll({
                    where: {
                        id: id
                    }
                });
                if (dbGames && dbGames.length > 0) {
                    res.json(dbGames);
                } else {
                    res.status(404).json(`Could not find any games with ID: ${id}`);
                }
            } else {
                const response = await fetch(URL);
                if (response.ok) {
                    const data = await response.json();
                    res.json(data);
                } else {
                    res.status(404).json(`Could not find any games with ID: ${id}`);
                }
            }
        } catch (error) {
            console.error('Error fetching game:', error);
            res.status(500).json('Internal Server Error');
        }
    });




let lastVideoGameId = 1000000; 
app.post('/videogames', async (req, res) => {
    try {
        let maxId = await Videogame.max('id');
        lastVideoGameId = maxId ? maxId + 1 : 1000000; 

        const { name, description, platforms, image, releaseDate, rating, genres } = req.body;

        if (!name || !description || !platforms || !image || !releaseDate || !rating || !genres) {
            return res.status(400).send('Faltan datos obligatorios.');
        }

        const newVideoGame = await Videogame.create({
            id: lastVideoGameId, // Use the updated variable here
            name,
            description,
            platforms,
            image,
            releaseDate,
            rating,
            genres
        });

        await newVideoGame.addGenres(genres); 

        res.status(201).json(newVideoGame);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




  app.get('/genres', async(req, res) => {
    try {
        const genreCount = await Genre.count();

        if (genreCount === 0) {

            const URL = `https://api.rawg.io/api/genres?key=${API_KEY}`;
            const response = await fetch(URL);
            const data = await response.json();

            const genres = data.results.map(genre => ({
                name: genre.name
            }));

            const newGenres = await Genre.bulkCreate(genres); 
            res.json({ message: `Genres created: ${newGenres.length}`, newGenres }); //simplify the structure by removing: message
        } else {
            const existingGenres = await Genre.findAll();
            res.json(existingGenres) 
        }
    } catch (error) {
        res.status(500).json(`Internal Server Error: ${error}`);
    }
    
  });


  app.get('/videogamegenre/:genre', async (req, res) => {
    const { genre } = req.params;

    try {
        if (!genre) {
            return res.status(400).json('Missing required data: genre');
        }

        const genreRegex = /^[a-zA-Z]+$/;
        if (!genreRegex.test(genre)) {
            return res.status(400).json('Invalid genre format');
        }

        const response = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&genres=${genre}&page_size=1000`);

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return res.status(404).json('No games found with that genre');
        }

        res.json(data);
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json(`Internal Server Error: ${error}`);
    }
});




  /*
app.get('/createvideogames', async (req, res) => {
    const URL = `https://api.rawg.io/api/games?key=${API_KEY}`;
  
    try {
      const response = await fetch(URL);
      const data = await response.json();
      const results = data.results;
  
      // Map the API results to your database structure
      const gameRecords = results.map((game) => {
        return {
          name: game.name,
          description: game.description,
          platforms: game.platforms.map(platform => platform.platform.name).join(', '), //  platforms array
          image: game.background_image,
          releaseDate: game.released,
          rating: game.rating,
        };
      });

        console.log('Game Records:', gameRecords);

    // console.log('Sequelize Models:', Object.keys(sequelize.models));
     const createdVideogames = await Videogame.bulkCreate(gameRecords);

      res.send(createdVideogames);
    } catch (error) {
      console.error(`ERROR: ${error}`);
      res.status(500).send('Internal Server Error');
    }
  }); */


// force: false
const PORT = process.env.PORT || 3001; 
sequelize.sync({force: false}).then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  }).catch(err => {
    console.error('Error syncing database:', err);
  });
