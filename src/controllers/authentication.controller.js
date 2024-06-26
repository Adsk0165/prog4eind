const jwt = require('jsonwebtoken');
const db = require('../dao/mysql-db');
const logger = require('../util/logger');
const jwtSecretKey = require('../util/config').secretkey;

const authController = {
    login: (userCredentials, callback) => {
        logger.debug('login');

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
                                    callback(null, {
                                        status: 200,
                                        message: 'User logged in',
                                        data: { ...userinfo, token }
                                    });
                                });
                            } else {
                                logger.debug('Passwords do not match');
                                callback({
                                    status: 409,
                                    message: 'User not found or password invalid',
                                    data: {}
                                }, null);
                            }
                        } else {
                            logger.debug('User not found');
                            callback({
                                status: 409,
                                message: 'User not found or password invalid',
                                data: {}
                            }, null);
                        }
                    }
                );
            }
        });
    }
};

module.exports = authController;
