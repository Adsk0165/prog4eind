const jwt = require('jsonwebtoken');
const db = require('../dao/mysql-db');
const logger = require('../util/logger');
const jwtSecretKey = require('../util/config').secretkey;

const authController = {
    login: (userCredentials, callback) => {
        logger.debug('Attempting login for email:', userCredentials.emailAdress);

        db.getConnection((err, connection) => {
            if (err) {
                logger.error('Database connection error:', err.message);
                return callback(err.message, null);
            }
            if (connection) {
                connection.query(
                    'SELECT `id`, `emailAdress`, `password`, `firstName`, `lastName` FROM `user` WHERE `emailAdress` = ?',
                    [userCredentials.emailAdress],
                    (err, rows, fields) => {
                        connection.release();
                        if (err) {
                            logger.error('Query error:', err.toString());
                            return callback(err.message, null);
                        }
                        if (rows.length === 1) {
                            const user = rows[0];
                            logger.debug('Retrieved user:', user);

                            // Assuming plain text password comparison (for demonstration, use hashing in production)
                            if (user.password === userCredentials.password) {
                                logger.debug('Passwords match');
                                const { password, ...userinfo } = user;
                                const payload = { userId: userinfo.id };

                                jwt.sign(payload, jwtSecretKey, { expiresIn: '12d' }, (err, token) => {
                                    if (err) {
                                        logger.error('JWT signing error:', err);
                                        return callback(err.message, null);
                                    }
                                    logger.info('User logged in, sending:', userinfo);
                                    return callback(null, {
                                        status: 200,
                                        message: 'User logged in',
                                        data: { ...userinfo, token }
                                    });
                                });
                            } else {
                                logger.debug('Passwords do not match');
                                return callback({
                                    status: 409,
                                    message: 'User not found or password invalid',
                                    data: {}
                                }, null);
                            }
                        } else {
                            logger.debug('User not found');
                            return callback({
                                status: 409,
                                message: 'User not found or password invalid',
                                data: {}
                            }, null);
                        }
                    }
                );
            }
        });
    },

    login2: (req, res, next) => {
        db.getConnection((err, connection) => {
            if (err) {
                logger.error('Error getting connection from dbconnection');
                return next({
                    status: err.status,
                    message: err.message,
                    data: {}
                });
            }
            if (connection) {
                connection.query(
                    'SELECT `id`, `emailAdress`, `password`, `firstName`, `lastName` FROM `user` WHERE `emailAdress` = ?',
                    [req.body.emailAdress],
                    (err, rows, fields) => {
                        connection.release();
                        if (err) {
                            logger.error('Error:', err.toString());
                            return next({
                                status: err.status,
                                message: err.message,
                                data: {}
                            });
                        }
                        if (rows.length === 1) {
                            const user = rows[0];
                            logger.debug('Retrieved user:', user);

                            // Assuming plain text password comparison (for demonstration, use hashing in production)
                            if (user.password === req.body.password) {
                                logger.info('Passwords match, sending userinfo and valid token');
                                const { password, ...userinfo } = user;
                                const payload = { userId: userinfo.id };

                                jwt.sign(payload, jwtSecretKey, { expiresIn: '12d' }, (err, token) => {
                                    if (err) {
                                        logger.error('JWT signing error:', err);
                                        return next({
                                            status: 500,
                                            message: 'Internal Server Error',
                                            data: {}
                                        });
                                    }
                                    logger.debug('User logged in, sending:', userinfo);
                                    res.status(200).json({
                                        statusCode: 200,
                                        results: { ...userinfo, token }
                                    });
                                });
                            } else {
                                logger.info('User not found or password invalid');
                                return next({
                                    status: 409,
                                    message: 'User not found or password invalid',
                                    data: {}
                                });
                            }
                        } else {
                            logger.info('User not found or password invalid');
                            return next({
                                status: 409,
                                message: 'User not found or password invalid',
                                data: {}
                            });
                        }
                    }
                );
            }
        });
    }
};

module.exports = authController;
