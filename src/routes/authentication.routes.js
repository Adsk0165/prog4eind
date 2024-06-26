//
// Authentication routes
//
const assert = require('assert')
const jwt = require('jsonwebtoken')
const jwtSecretKey = require('../util/config').secretkey
const routes = require('express').Router()
const AuthController = require('../controllers/authentication.controller')
const logger = require('../util/logger')
const userService = require('../services/user.service');
const db = require('../dao/mysql-db');

//
//
//
function validateLogin(req, res, next) {
    // Verify that we receive the expected input
    try {
        assert(
            typeof req.body.emailAdress === 'string',
            'email must be a string.'
        )
        assert(
            typeof req.body.password === 'string',
            'password must be a string.'
        )
        next()
    } catch (ex) {
        next({
            status: 409,
            message: ex.toString(),
            data: {}
        })
    }
}

//
//
//
function validateToken(req, res, next) {
    logger.info('validateToken called')
    logger.trace('Headers:', req.headers)
    // The headers should contain the authorization-field with value 'Bearer [token]'
    const authHeader = req.headers.authorization
    if (!authHeader) {
        logger.warn('Authorization header missing!')
        next({
            status: 401,
            message: 'Authorization header missing!',
            data: {}
        })
    } else {
        // Strip the word 'Bearer ' from the headervalue
        const token = authHeader.substring(7, authHeader.length)

        jwt.verify(token, jwtSecretKey, (err, payload) => {
            if (err) {
                logger.warn('Not authorized')
                next({
                    status: 401,
                    message: 'Not authorized',
                    data: {}
                })
            }
            if (payload) {
                logger.debug('token is valid', payload)
                /**
                 * User heeft toegang.
                 * BELANGRIJK! Voeg UserId uit payload toe aan request,
                 * zodat die voor ieder volgend endpoint beschikbaar is.
                 * Je hebt dan altijd toegang tot de userId van de ingelogde gebruiker.
                 */
                req.userId = payload.userId
                next()
            }
        })
    }
}

function validateUserId(req, res, next) {
    const urlUserId = parseInt(req.params.userId); // Gebruikers-ID uit de URL
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // JWT uit de Authorization header
    
    if (!token) {
        logger.warn('Unauthorized access: JWT missing!');
        return next({
            status: 403,
            message: 'Unauthorized access: JWT missing!',
            data: {}
        });
    }

    jwt.verify(token, jwtSecretKey, (err, payload) => {
        if (err) {
            logger.warn('Unauthorized access: Invalid JWT!');
            return next({
                status: 403,
                message: 'Unauthorized access: Invalid JWT!',
                data: {}
            });
        }

        const jwtUserId = payload.userId; // Gebruikers-ID uit de JWT payload

        // Controleer of de gebruikers-ID in de JWT overeenkomt met de gebruikers-ID in de URL
        if (jwtUserId === urlUserId) {
            req.userId = jwtUserId; // Voeg het gebruikers-ID toe aan het verzoek voor toekomstig gebruik
            next();
        } else {
            logger.warn('Unauthorized access: User ID mismatch!');
            next({
                status: 403,
                message: 'Unauthorized access: User ID mismatch!',
                data: {}
            });
        }
    });
}

function getLoggedInUserProfile(req, res, next) {
    const userId = req.userId; // Haal het gebruikers-ID op uit de request, deze wordt ingesteld in validateToken-middleware

    // Gebruik userService om de gebruikersgegevens op te halen
    userService.getById(userId, (error, user) => {
        if (error) {
            // Als er een fout optreedt bij het ophalen van gebruikersgegevens, stuur dan een foutreactie terug
            return next({
                status: error.status,
                message: error.message,
                data: {}
            });
        }
        if (!user) {
            // Als de gebruiker niet gevonden wordt, stuur dan een 404 reactie terug
            return next({
                status: 404,
                message: 'User not found',
                data: {}
            });
        }
        // Stuur de gebruikersgegevens terug als reactie
        res.status(200).json({
            status: 200,
            message: 'User profile retrieved successfully',
            data: user
        });
    });
}

function getUserIdFromToken(req) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        logger.warn('Authorization header missing!');
        return null; // Return null if authorization header is missing
    }

    // Strip the word 'Bearer ' from the header value
    const token = authHeader.substring(7, authHeader.length);

    if (!token) {
        return null; // No token present, return null
    }

    try {
        const decoded = jwt.verify(token, jwtSecretKey);
        return decoded.userId; // Return the user ID from the token
    } catch (err) {
        return null; // Token verification failed, return null
    }
}

function checkCookIdFromToken(req, mealId, callback) {
    // Haal het gebruikers-ID uit de token
    const userId = getUserIdFromToken(req);
    if (!userId) {
        const error = new Error('Authentication token is missing or invalid');
        error.status = 401;
        return callback(error, null);
    }

    db.getConnection((err, connection) => {
        if (err) {
            logger.error(err);
            return callback(err, null);
        }

        // Controleer of de maaltijd behoort tot de ingelogde gebruiker
        connection.query(
            'SELECT `cookId` FROM `meal` WHERE `id` = ?',
            [mealId],
            (error, results, fields) => {
                connection.release();

                if (error) {
                    logger.error(error);
                    return callback(error, null);
                }

                if (results.length === 0) {
                    const notFoundError = new Error(`Meal with ID ${mealId} not found`);
                    notFoundError.status = 404;
                    return callback(notFoundError, null);
                }

                const cookId = results[0].cookId;

                // Vergelijk de cookId met de userId
                if (cookId !== userId) {
                    const unauthorizedError = new Error('You are not authorized to delete this meal');
                    unauthorizedError.status = 403;
                    return callback(unauthorizedError, null);
                }

                // Als de cookId overeenkomt, retourneer dan het userId
                return callback(null, userId);
            }
        );
    });
}

routes.post('/api/login', validateLogin, AuthController.login)
routes.get('/api/user/profile', validateToken, getLoggedInUserProfile);

module.exports = { routes, validateToken, validateUserId, getUserIdFromToken, checkCookIdFromToken }