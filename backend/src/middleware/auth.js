/* eslint-disable no-undef */
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || process.env.SECRET_KEY || 'your-secret-key';

/**
 * Authentication middleware to verify JWT token and set req.user
 * Checks for token in cookies or Authorization header
 */
const authenticate = (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        let token = req.cookies?.token;
        
        if (!token && req.headers.authorization) {
            // Extract token from "Bearer <token>"
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please login.',
                error: 'No token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, jwtSecret);
        
        // Set user info in request
        req.user = {
            userId: decoded.userId || decoded.id,
            id: decoded.userId || decoded.id,
            email: decoded.email,
            role: decoded.role
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token. Please login again.',
                error: error.name
            });
        }
        
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed',
            error: 'Internal server error'
        });
    }
};

/**
 * Optional authentication - sets req.user if token exists, but doesn't fail if it doesn't
 */
const optionalAuthenticate = (req, res, next) => {
    try {
        let token = req.cookies?.token;
        
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, jwtSecret);
                req.user = {
                    userId: decoded.userId || decoded.id,
                    id: decoded.userId || decoded.id,
                    email: decoded.email,
                    role: decoded.role
                };
            } catch (error) {
                // Token invalid, but continue without req.user
                req.user = null;
            }
        }

        next();
    } catch (error) {
        next();
    }
};

module.exports = {
    authenticate,
    optionalAuthenticate
};

