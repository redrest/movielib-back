const Router = require('express');
const router = new Router();
const controller = require('./authController');
const {check} = require('express-validator');
const authMiddleware = require('./middlewares/authMiddleware');
const roleMiddleware = require('./middlewares/roleMiddleware');
const Movie = require('./models/movieModel');
const Genre = require('./models/genreSchema');
const Director = require('./models/directorSchema');
const passport = require('./config/passport');

router.post('/registration', [
    check("username", "Имя пользователя не может быть пустым").notEmpty(),
    check("password", "Пароль должен быть больше 4 и меньше 12 символов").isLength({min: 4, max: 12}),
], controller.registration);
router.post('/login', controller.login);

router.get('/github', passport.authenticate('github', { scope: ['user:login'] }));

router.get(
    '/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    controller.githubCallback
);

module.exports = router;
