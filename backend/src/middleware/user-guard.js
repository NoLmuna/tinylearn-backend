/* eslint-disable no-undef */
const jwt = require("jsonwebtoken");
require("dotenv").config();

const userGuard = (allowedRoles = []) => {
    return (req, res, next) => {
        if (req.method === 'OPTIONS') {
            return next();
        }
        try {
            const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({
                    success: false,
                    message: "Access token required"
                });
            }

            const token = authHeader.split(" ")[1];
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "Access token required"
                });
            }

            const jwtSecret = process.env.JWT_SECRET || process.env.SECRET_KEY || 'your-secret-key';
            const decoded = jwt.verify(token, jwtSecret);

            req.user = decoded;
            req.userData = decoded;

            if (allowed.length > 0 && !allowed.includes(decoded.role)) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied"
                });
            }

            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: "Token has expired"
                });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token"
                });
            }

            return res.status(401).json({
                success: false,
                message: "Authentication failed"
            });
        }
    };
};

module.exports = userGuard;