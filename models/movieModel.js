const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: String,
    titleEn: String,
    year: Number,
    rating: Number,
    genres: [{ genre: String, genreEn: String }],
    director: [{ fullName: String, fullNameEn: String }],
    poster: String,
    description: String,
});

module.exports = mongoose.model('Movie', movieSchema);
