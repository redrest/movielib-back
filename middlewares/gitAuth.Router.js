require('dotenv').config();
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../../Server/models/User');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: `${process.env.BACKEND_URL}/auth/github/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const { username, emails } = profile;
                const email = emails && emails[0]?.value;

                let user = await User.findOne({ githubId: id });
                if (!user) {
                    user = new User({
                        username,
                        githubId: id,
                        email,
                    });
                    await user.save();
                }

                done(null, user);
            } catch (error) {
                done(error);
            }
        }
    )
);

module.exports = passport;
