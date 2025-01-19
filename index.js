const express = require('express');
const {graphqlHTTP} = require('express-graphql');
const cors = require('cors');
const mongoose = require("mongoose");
const schema = require('./schema');
const Movie = require('./models/movieModel');
const Genre = require('./models/genreSchema');
const Director = require('./models/directorSchema');
const multer = require('multer');
const path = require('path');
const authRouter = require('./authRouter');
const roleMiddleware = require('./middlewares/roleMiddleware');
const authMiddleware = require("./middlewares/authMiddleware");
require('dotenv').config();
const passport = require('./config/passport');
const session = require('express-session');

const app = express();
app.use(express.json());
app.use(cors());

app.use(
    session({
        secret: '3f037da8b43e58ca2e56d8764187b1b466158c5d',
        resave: false,
        saveUninitialized: false,
        cookie: {secure: false}
    })
);

app.use(passport.initialize());
app.use(passport.session());


mongoose
    .connect('mongodb+srv://esaprykin:PtaoQ4g0YFThu92W@cluster0.sncfv.mongodb.net/MovieLib?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('DataBase Connected'))
    .catch((err) => console.log('DataBase connection error', err));

app.use('/auth', authRouter);

app.get('/admin', authMiddleware, roleMiddleware(['ADMIN']), (req, res) => {
    res.status(200).json({message: "Доступ для админов"});
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Неверный формат файла!'), false);
    }
};

const upload = multer({ storage, fileFilter });
app.post('/uploads', upload.single('file'), (req, res) => {
    try {
        if (req.file) {
            res.status(200).json({ message: 'Файл успешно загружен', file: { filename: req.file.filename } });
        } else {
            res.status(400).json({ message: 'Файл не был загружен' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const root = {
    getAllMovies: async () => {
        const movies = await Movie.find();
        return movies.map(movie => ({
            ...movie._doc,
            poster: `http://localhost:5000/uploads${movie.poster}`,
        }));
    },

    getAllGenres: async () => await Genre.find(),

    getAllDirectors: async () => {
        const directors = await Director.find();
        return directors.map(director => ({
            ...director._doc,
            poster: `http://localhost:5000/uploads${director.poster}`,
        }));
    },

    getMovieByTitle: async ({ titleEn }) => {
        const movie = await Movie.findOne({ titleEn: { $regex: new RegExp('^' + titleEn + '$', 'i') } });
        return {
            ...movie._doc,
            poster: `http://localhost:5000/uploads${movie.poster}`
        };
    },

    getDirectorByName: async ({ fullNameEn }) => {
        const director = await Director.findOne({ fullNameEn: { $regex: new RegExp('^' + fullNameEn + '$', 'i') }});
        return {
            ...director._doc,
            poster: `http://localhost:5000/uploads${director.poster}`
        }
    },

    getMoviesByDirector: async ({ fullNameEn }) => {
        const directorMovies = await Movie.find({ 'director.fullNameEn': { $regex: new RegExp('^' + fullNameEn + '$', 'i')}});
        return directorMovies.map(movies => ({
            ...movies._doc,
            poster: `http://localhost:5000/uploads${movies.poster}`,
        }));
    },

    getMoviesByGenre: async ({ genreEn }) => {
        const genreMovies = await Movie.find({ 'genres.genreEn': { $regex: new RegExp('^' + genreEn + '$', 'i')}});
        return genreMovies.map(movies => ({
            ...movies._doc,
            poster: `http://localhost:5000/uploads${movies.poster}`,
        }));
    },

    getGenreByGenreEn: async ({ genreEn }) => await Genre.findOne({ genreEn: { $regex: new RegExp('^' + genreEn + '$', 'i') } }),

    createMovie: async ({ title, titleEn, year, rating, genres, director, description, poster }, req) => {
        try {
            const uploadedPoster = req.file ? `/uploads/${req.file.filename}` : poster;

            if (genres) {
                const genreObjects = await Promise.all(genres.map(async ({ genre }) => {
                    const foundGenre = await Genre.findOne({ genre: genre });
                    if (!foundGenre) throw new Error(`Жанр "${genre}" не найден`);
                    return {
                        genre: foundGenre.genre,
                        genreEn: foundGenre.genreEn
                    };
                }));
                foundtGenres = genreObjects;
            }

            if (director) {
                const directorObjects = await Promise.all(director.map(async ({ fullName }) => {
                    const foundDirector = await Director.findOne({ fullName: fullName });
                    if (!foundDirector) throw new Error(`Режиссер "${fullName}" не найден`);
                    return {
                        fullName: foundDirector.fullName,
                        fullNameEn: foundDirector.fullNameEn
                    };
                }));
                foundDirector = directorObjects;
            }

            const newMovie = new Movie({
                title,
                titleEn,
                year,
                rating,
                genres: foundtGenres,
                director: foundDirector,
                description,
                poster: uploadedPoster,
            });

            await newMovie.save();
            return newMovie;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    updateMovie: async ({ _id, title, titleEn, year, rating, genres, director, description, poster }, req) => {
        try {
            const movie = await Movie.findById(_id);
            if (!movie) throw new Error('Фильм не найден');

            if (req.file) {
                movie.poster = `/${req.file.filename}`;
            } else if (poster) {
                movie.poster = poster.startsWith('/') ? poster : `/${poster}`;
            }

            if (title) movie.title = title;
            if (titleEn) movie.titleEn = titleEn;
            if (year) movie.year = year;
            if (rating) movie.rating = rating;

            if (genres) {
                const genreObjects = await Promise.all(genres.map(async ({ genre }) => {
                    const foundGenre = await Genre.findOne({ genre: genre });
                    if (!foundGenre) throw new Error(`Жанр "${genre}" не найден`);
                    return {
                        genre: foundGenre.genre,
                        genreEn: foundGenre.genreEn
                    };
                }));
                movie.genres = genreObjects;
            }

            if (director) {
                const directorObjects = await Promise.all(director.map(async ({ fullName }) => {
                    const foundDirector = await Director.findOne({ fullName: fullName });
                    if (!foundDirector) throw new Error(`Режиссер "${fullName}" не найден`);
                    return {
                        fullName: foundDirector.fullName,
                        fullNameEn: foundDirector.fullNameEn
                    };
                }));
                movie.director = directorObjects;
            }

            if (description) movie.description = description;

            await movie.save();
            return movie;
        } catch (error) {
            throw new Error(error.message);
        }
    },


    deleteMovie: async ({ _id }) => {
        try {
            const movie = await Movie.findByIdAndDelete(_id);
            if (!movie) throw new Error('Фильм не найден');
            return 'Фильм удален';
        } catch (error) {
            throw new Error(error.message);
        }
    },

    createGenre: async ({ genre, genreEn }) => {
        try {
            const newGenre = new Genre({ genre, genreEn });
            await newGenre.save();
            return newGenre;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    updateGenre: async ({ _id, genre, genreEn }) => {
        try {
            const genreDoc = await Genre.findById(_id);
            if (!genreDoc) throw new Error('Жанр не найден');

            if (genre) genreDoc.genre = genre;
            if (genreEn) genreDoc.genreEn = genreEn;

            await genreDoc.save();
            return genreDoc;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    deleteGenre: async ({ _id }) => {
        try {
            const genre = await Genre.findByIdAndDelete(_id);
            if (!genre) throw new Error('Жанр не найден');
            return 'Жанр удален';
        } catch (error) {
            throw new Error(error.message);
        }
    },

    createDirector: async ({ fullName, fullNameEn, dateOfBirth, placeOfBirth, career, poster }, req) => {
        try {
            const uploadedPoster = req.file ? `/uploads/${req.file.filename}` : poster;

            const newDirector = new Director({
                fullName,
                fullNameEn,
                dateOfBirth,
                placeOfBirth,
                career,
                poster: uploadedPoster,
            });

            await newDirector.save();
            return newDirector;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    updateDirector: async ({ _id, fullName, fullNameEn, dateOfBirth, placeOfBirth, career, poster }, req) => {
        try {
            const director = await Director.findById(_id);
            if (!director) throw new Error('Режиссер не найден');

            if (req.file) {
                director.poster = `/${req.file.filename}`;
            } else if (poster) {
                director.poster = poster.startsWith('/') ? poster : `/${poster}`;
            }

            if (fullName) director.fullName = fullName;
            if (fullNameEn) director.fullNameEn = fullNameEn;
            if (dateOfBirth) director.dateOfBirth = dateOfBirth;
            if (placeOfBirth) director.placeOfBirth = placeOfBirth;
            if (career) director.career = career;

            await director.save();
            return director;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    deleteDirector: async ({ _id }) => {
        try {
            const director = await Director.findByIdAndDelete(_id);
            if (!director) throw new Error('Режиссер не найден');
            return 'Режиссер не найден';
        } catch (error) {
            throw new Error(error.message);
        }
    },

};

app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));


app.listen(5000, () => console.log('Server started on port 5000'));


