const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema({
    genre: String,
    genreEn: String,
});

module.exports = mongoose.model('Genre', genreSchema);
