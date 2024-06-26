// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const jwtSecretKey = require('../util/config').secretkey;
const logger = require('../util/logger');

function validateToken(req, res, next) {
    logger.info('validateToken called');
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        logger.warn('Authorization header missing!');
        return next({
            status: 401,
            message: 'Authorization header missing!',
            data: {}
        });
    }

    const token = authHeader.substring(7, authHeader.length);
    jwt.verify(token, jwtSecretKey, (err, payload) => {
        if (err) {
            logger.warn('Not authorized');
            return next({
                status: 401,
                message: 'Not authorized',
                data: {}
            });
        }
        if (payload) {
            logger.debug('Token is valid', payload);
            req.userId = payload.userId;
            next();
        }
    });
}

function validateUserOwnership(req, res, next) {
    const userIdFromToken = req.userId;
    const userIdFromParams = parseInt(req.params.userId);

    if (userIdFromToken !== userIdFromParams) {
        logger.warn('Unauthorized access: User ID mismatch!');
        return next({
            status: 403,
            message: 'Unauthorized access: User ID mismatch!',
            data: {}
        });
    }
    next();
}

module.exports = {
    validateToken,
    validateUserOwnership
};
