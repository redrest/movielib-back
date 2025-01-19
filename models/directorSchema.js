const mongoose = require('mongoose');

const directorSchema = new mongoose.Schema({
    fullName: String,
    fullNameEn: String,
    dateOfBirth: String,
    placeOfBirth: String,
    career: [String],
    poster: String,
});

module.exports = mongoose.model('Director', directorSchema);
