const userService = require('../services/user.service');
const logger = require('../util/logger');
const { validateToken, validateUserOwnership } = require('../middelware/authMiddleware');
const jwt = require('jsonwebtoken'); // Import JWT library
const jwtSecretKey = require('../util/config').secretkey;

const authenticationController = {
    create: (req, res, next) => {
        const user = req.body;
        logger.info('Creating user', user.firstName, user.lastName);
        userService.create(user, (error, success) => {
            if (error) {
                return next({
                    status: error.status || 500,
                    message: error.message || 'Internal Server Error',
                    data: {}
                });
            }
            if (success) {
                // Generate JWT token
                const token = jwt.sign({ userId: success.data.userId }, 'geheim', { expiresIn: '1h' });

                res.status(200).json({
                    status: 200,
                    message: success.message || 'User created successfully',
                    data: {
                        user: success.data,
                        token: token // Include token in response
                    }
                });
            }
        });
    },

    getAll: (req, res, next) => {
        logger.trace('Fetching all users');
        userService.getAll((error, success) => {
            if (error) {
                return next({
                    status: error.status || 500,
                    message: error.message || 'Internal Server Error',
                    data: {}
                });
            }
            res.status(200).json({
                status: 200,
                message: 'Users retrieved successfully',
                data: success.data
            });
        });
    },

    getById: (req, res, next) => {
        const userId = req.params.userId;
        logger.trace(`Fetching user with ID ${userId}`);
        userService.getById(userId, (error, user) => {
            if (error) {
                return next({
                    status: error.status || 500,
                    message: error.message || 'Internal Server Error',
                    data: {}
                });
            }
            if (!user) {
                return next({
                    status: 404,
                    message: 'User not found',
                    data: {}
                });
            }
            res.status(200).json({
                status: 200,
                message: 'User found',
                data: user
            });
        });
    },

    update: [
        validateToken,
        validateUserOwnership,
        (req, res, next) => {
            const userId = parseInt(req.params.userId);
            const newData = req.body;
            logger.info(`Updating user with ID ${userId}`);
            userService.update(userId, newData, (error, success) => {
                if (error) {
                    return next({
                        status: error.status || 500,
                        message: error.message || 'Internal Server Error',
                        data: {}
                    });
                }
                res.status(200).json({
                    status: 200,
                    message: success.message || 'User updated successfully',
                    data: success.data
                });
            });
        }
    ],

    delete: [
        validateToken,
        validateUserOwnership,
        (req, res, next) => {
            const userId = parseInt(req.params.userId);
            logger.info(`Deleting user with ID ${userId}`);
            userService.delete(userId, (error, success) => {
                if (error) {
                    return next({
                        status: error.status || 500,
                        message: error.message || 'Internal Server Error',
                        data: {}
                    });
                }
                res.status(200).json({
                    status: 200,
                    message: success.message || 'User deleted successfully',
                    data: success.data
                });
            });
        }
    ],

    getProfile: (req, res, next) => {
        const userId = req.userId; // Assuming userId is set by validateToken middleware
        logger.trace(`Fetching profile for user with ID ${userId}`);
        userService.getById(userId, (error, user) => {
            if (error) {
                return next({
                    status: error.status || 500,
                    message: error.message || 'Internal Server Error',
                    data: {}
                });
            }
            if (!user) {
                return next({
                    status: 404,
                    message: 'User not found',
                    data: {}
                });
            }
            res.status(200).json({
                status: 200,
                message: 'User profile retrieved successfully',
                data: user
            });
        });
    },

    login: (req, res, next) => {
        const { emailAdress, password } = req.body;

        // Example login logic
        // Validate credentials (mock implementation)
        if (emailAdress === 'user@example.com' && password === 'password') {
            // Mock user data
            const user = {
                userId: 1,
                firstName: 'John',
                lastName: 'Doe',
                email: 'user@example.com'
            };

            // Generate JWT token
            const token = jwt.sign({ userId: user.userId }, jwtSecretKey, { expiresIn: '1h' });

            res.status(200).json({
                status: 200,
                message: 'Login successful',
                data: {
                    user: user,
                    token: token
                }
            });
        } else {
            // Invalid credentials
            return next({
                status: 401,
                message: 'Invalid credentials',
                data: {}
            });
        }
    }
};

module.exports = authenticationController;
