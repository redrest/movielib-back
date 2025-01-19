require('dotenv').config();
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const session = require('express-session');

passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: `${process.env.BACKEND_URL}/auth/github/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const { id, username, emails, photos } = profile;
                const email = emails && emails[0]?.value;
                const avatarUrl = photos && photos[0]?.value;

                done(null, { id, username, email, avatarUrl });
            } catch (error) {
                done(error);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

module.exports = passport;
