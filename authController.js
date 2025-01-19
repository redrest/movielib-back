const User = require('./models/user');
const Role = require('./models/role');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const {secret} = require('./config');
const crypto = require("crypto");

const generateAccessToken = (id, roles) => {
    const payload = {
        id,
        roles
    }
    return jwt.sign(payload, secret, {expiresIn: '24h'});
}

class authController {
    async githubCallback(req, res) {
        try {
            const user = req.user;
            const username = user.username;

            let existingUser = await User.findOne({ username });

            if (!existingUser) {
                const randomPassword = crypto.randomBytes(8).toString('hex');
                const hashedPassword = bcrypt.hashSync(randomPassword, 8);

                const userRole = await Role.findOne({ value: "USER" });
                if (!userRole) {
                    return res.status(400).json({ message: 'Role "USER" not found' });
                }

                existingUser = new User({
                    username: username,
                    password: hashedPassword,
                    roles: [userRole.value],
                    git: 'git',
                });
                await existingUser.save();
            }

            const userId = existingUser._id;
            const userRoles = existingUser.roles;

            const token = generateAccessToken(userId, userRoles);

            res.redirect(`http://90.156.171.177:3000/auth/?token=${token}&name=${username}`);
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'GitHub Login Error' });
        }
    }

    async registration(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: "Ошибка при регистрации", errors});
            }
            const {username, password} = req.body;
            const candidate = await User.findOne({username});
            if (candidate) {
                return res.status(400).json({message: 'Пользователь с таким именем уже существует'});
            }
            const hashPassword = bcrypt.hashSync(password, 7);
            const userRoles = await Role.findOne( {value: "USER"} );
            const user = new User({username, password: hashPassword, roles: [userRoles.value]});
            await user.save();
            return res.json({message: "Пользователь успешно зарегистрирован"});
        } catch (e) {
            console.log(e);
            res.status(400).json({message: 'Registration error'})
        }
    }

    async login(req, res) {
        try {
            const {username, password} = req.body;
            const user = await User.findOne({username});
            if (!user) {
                return res.status(400).json({message: `Пользователь ${username} не найден`});
            }
            const validPassword = bcrypt.compareSync(password, user.password);
            if (!validPassword) {
                return res.status(400).json({message: `Введен неверный пароль`})
            }
            const token = generateAccessToken(user._id, user.roles);
            return res.json({token});
        } catch (e) {
            console.log(e);
            res.status(400).json({message: 'Login error'})
        }
    }

}

module.exports = new authController();
