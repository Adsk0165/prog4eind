const database = require('../dao/inmem-db');
const logger = require('../util/logger');

const db = require('../dao/mysql-db')

const userService = {
    create: (user, callback) => {
        logger.info('create user', user);

        // Controleer of alle vereiste velden aanwezig zijn
        const requiredFields = ['firstName', 'lastName', 'street', 'city', 'emailAdress', 'password', 'phoneNumber'];
        for (const field of requiredFields) {
            if (!user[field]) {
                const error = new Error(`Missing or incorrect ${field} field`);
                error.status = 400;
                return callback(error, null);
            }
        }

        db.getConnection((err, connection) => {
            if (err) {
                logger.error(err);
                callback(err, null);
                return;
            }

            connection.query(
                'INSERT INTO `user` SET ?',
                user,
                (error, results, fields) => {
                    connection.release();

                    if (error) {
                        logger.error(error);
                        callback(error, null);
                    } else {
                        const createdUser = { id: results.insertId, ...user };
                        callback(null, {
                            message: `User created with ID ${results.insertId}`,
                            data: createdUser
                        });
                    }
                }
            );
        });
    },

    getAll: (callback) => {
        logger.info('getAll');
        // database.getAll((err, data) => {
        //     if (err) {
        //         callback(err, null);
        //     } else {
        //         callback(null, {
        //             message: `Found ${data.length} users.`,
        //             data: data
        //         });
        //     }
        // });
        db.getConnection(function (err, connection) {
            if (err) {
                logger.error(err)
                callback(err, null)
                return
            }

            connection.query(
                'SELECT id, firstName, lastName FROM `user`',
                function (error, results, fields) {
                    connection.release()

                    if (error) {
                        logger.error(error)
                        callback(error, null)
                    } else {
                        logger.debug(results)
                        callback(null, {
                            message: `Found ${results.length} users.`,
                            data: results
                        })
                    }
                }
            )
        })
    },

    getById: (id, callback) => {
        logger.info(`getUserById: ${id}`);
        // database.getById(id, (err, user) => {
        //     if (err) {
        //         callback(err, null);
        //     } else {
        //         callback(null, user);
        //     }
        // });
    
        db.getConnection((err, connection) => {
            if (err) {
                logger.error(err);
                callback(err, null);
                return;
            }
    
            connection.query(
                'SELECT * FROM `user` WHERE `id` = ?',
                [id],
                (error, results, fields) => {
                    connection.release();
    
                    if (error) {
                        logger.error(error);
                        callback(error, null);
                    } else {
                        if (results.length === 0) {
                            const notFoundError = new Error(`User with ID ${id} not found`);
                            notFoundError.status = 404;
                            callback(notFoundError, null);
                        } else {
                            const user = results[0];
                            callback(null, user);
                        }
                    }
                }
            );
        });
    },    

    update: (userId, newData, callback) => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (newData.emailAdress && !emailPattern.test(newData.emailAdress)) {
            const error = new Error('Invalid email adress');
            error.status = 400; // Verander status naar 400 voor ongeldige e-mail
            return callback(error, null);
        }
    
        // Valideer het telefoonnummer
        const phonePattern = /^06-\d{8}$|^06 \d{8}$|^06\d{8}$/;
        if (newData.phoneNumber && !phonePattern.test(newData.phoneNumber)) {
            const error = new Error('Invalid phone number');
            error.status = 400;
            return callback(error, null);
        }
    
        const requiredFields = ['emailAdress'];
        for (const field of requiredFields) {
            if (!newData[field]) {
                const error = new Error(`Missing or incorrect ${field} field`);
                error.status = 400;
                return callback(error, null);
            }
        }
    
        logger.info(`Updating user with ID ${userId}`);
        db.getConnection((err, connection) => {
            if (err) {
                logger.error(err);
                callback(err, null);
                return;
            }
    
            connection.query(
                'UPDATE `user` SET ? WHERE `id` = ?',
                [newData, userId],
                (error, results, fields) => {
                    connection.release();
    
                    if (error) {
                        logger.error(error);
                        callback(error, null);
                    } else {
                        if (results.affectedRows === 0) {
                            const notFoundError = new Error(`User with ID ${userId} not found`);
                            notFoundError.status = 404; // Verander status naar 404 voor niet gevonden gebruiker
                            callback(notFoundError, null);
                        } else {
                            const updatedUser = { id: userId, ...newData };
                            callback(null, {
                                message: `User with ID ${userId} updated successfully`,
                                data: updatedUser
                            });
                        }
                    }
                }
            );
        });
    },
    
    delete: (userId, callback) => {
        logger.info(`Deleting user with ID ${userId}`);
        db.getConnection((err, connection) => {
            if (err) {
                logger.error(err);
                callback(err, null);
                return;
            }
    
            connection.query(
                'DELETE FROM `user` WHERE `id` = ?',
                [userId],
                (error, results, fields) => {
                    connection.release();
    
                    if (error) {
                        logger.error(error);
                        callback(error, null);
                    } else {
                        if (results.affectedRows === 0) {
                            const notFoundError = new Error(`User with ID ${userId} not found`);
                            notFoundError.status = 404;
                            callback(notFoundError, null);
                        } else {
                            const deletedUser = { id: userId };
                            callback(null, {
                                message: `User with ID ${userId} deleted successfully`,
                                data: deletedUser
                            });
                        }
                    }
                }
            );
        });
    }    
};

module.exports = userService;