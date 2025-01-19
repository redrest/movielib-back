const { buildSchema } = require('graphql');

const schema = buildSchema(`
  type Movie {
    _id: ID
    title: String
    titleEn: String
    year: Int
    rating: Float
    genres: [Genre]
    director: [Director]
    poster: String
    description: String
  }

  type Genre {
    _id: ID
    genre: String
    genreEn: String
  }

  type Director {
    _id: ID
    fullName: String
    fullNameEn: String
    dateOfBirth: String
    placeOfBirth: String
    career: [String]
    poster: String
  }

  type Query {
    getAllMovies: [Movie]
    getAllGenres: [Genre]
    getAllDirectors: [Director]
    getMovieByTitle(titleEn: String): Movie
    getMoviesByGenre(genreEn: String): [Movie]
    getDirectorByName(fullNameEn: String): Director
    getMoviesByDirector(fullNameEn: String): [Movie]
    getGenreByGenreEn(genreEn: String): Genre
  }
  
  input InputGenre {
    genre: String
  }
  
  input InputDirector {
    fullName: String
  }
  
  type Mutation {
    createMovie(
        title: String!
        titleEn: String!
        year: Int!
        rating: Float!
        genres: [InputGenre]!
        director: [InputDirector]!
        description: String!
        poster: String!
    ): Movie

    updateMovie(
        _id: ID
        title: String
        titleEn: String
        year: Int
        rating: Float
        genres: [InputGenre]
        director: [InputDirector]
        description: String
        poster: String
    ): Movie

    deleteMovie(_id: ID!): String

    createGenre(genre: String!, genreEn: String!): Genre
    updateGenre(_id: ID, genre: String, genreEn: String): Genre
    deleteGenre(_id: ID!): String

    createDirector(
        fullName: String!
        fullNameEn: String!
        dateOfBirth: String!
        placeOfBirth: String!
        career: [String!]!
        poster: String!
    ): Director

    updateDirector(
        _id: ID
        fullName: String
        fullNameEn: String
        dateOfBirth: String
        placeOfBirth: String
        career: [String]
        poster: String
    ): Director

    deleteDirector(_id: ID!): String
}
  
`);

module.exports = schema;

