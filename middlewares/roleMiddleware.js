const jwt = require("jsonwebtoken");
const { secret } = require("../config");

module.exports = (roles) => {
    return function (req, res, next) {
        if (req.method === "OPTIONS") {
            return next();
        }
        try {
            const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
            if (!token) {
                return res.status(403).json({ message: "Пользователь не авторизован" });
            }

            const { roles: userRoles } = jwt.verify(token, secret);
            const hasRole = userRoles.some(role => roles.includes(role));

            if (!hasRole) {
                return res.status(403).json({ message: "Доступ запрещен" });
            }

            next();
        } catch (e) {
            console.error("Authorization error:", e);
            return res.status(403).json({ message: "Пользователь не авторизован" });
        }
    };
};
