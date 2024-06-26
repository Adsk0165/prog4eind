const logger = require('../util/logger');
const db = require('../dao/mysql-db');
const { getUserIdFromToken } = require('../routes/authentication.routes'); // Verandering hier
const { checkCookIdFromToken } = require('../routes/authentication.routes');

let mealService = {
    create: (req, meal, callback) => { // Voeg 'req' hier toe
        logger.info('create meal', meal);

        // Haal het gebruikers-ID uit de token
        const userId = getUserIdFromToken(req);
        if (!userId) {
            const error = new Error('Authentication token is missing or invalid');
            error.status = 401;
            return callback(error, null);
        }

        // Voeg het gebruikers-ID toe aan de maaltijd
        meal.cookId = userId;

        // Voer de rest van de maaltijdscreatie uit
        db.getConnection((err, connection) => {
            if (err) {
                logger.error(err);
                callback(err, null);
                return;
            }

            connection.query(
                'INSERT INTO `meal` SET ?',
                meal,
                (error, results, fields) => {
                    connection.release();

                    if (error) {
                        logger.error(error);
                        callback(error, null);
                    } else {
                        const createdMeal = { id: results.insertId, ...meal };
                        callback(null, {
                            message: `Meal created with ID ${results.insertId}`,
                            data: createdMeal
                        });
                    }
                }
            );
        });
    },
    
    getAll: (callback) => {
        logger.info('getAll');
        db.getConnection((err, connection) => {
            if (err) {
                logger.error(err);
                callback(err, null);
                return;
            }

            connection.query(
                'SELECT * FROM `meal`',
                (error, results, fields) => {
                    connection.release();

                    if (error) {
                        logger.error(error);
                        callback(error, null);
                    } else {
                        callback(null, {
                            message: `Found ${results.length} meals.`,
                            data: results
                        });
                    }
                }
            );
        });
    },

    getById: (mealId, callback) => {
        logger.info(`getMealById: ${mealId}`);
        db.getConnection((err, connection) => {
            if (err) {
                logger.error(err);
                callback(err, null);
                return;
            }

            connection.query(
                'SELECT * FROM `meal` WHERE `id` = ?',
                [mealId],
                (error, results, fields) => {
                    connection.release();

                    if (error) {
                        logger.error(error);
                        callback(error, null);
                    } else {
                        if (results.length === 0) {
                            const notFoundError = new Error(`Meal with ID ${mealId} not found`);
                            notFoundError.status = 404;
                            callback(notFoundError, null);
                        } else {
                            const meal = results[0];
                            callback(null, meal);
                        }
                    }
                }
            );
        });
    },

    update: (mealId, newData, callback) => {
        logger.info(`Updating meal with ID ${mealId}`);
        db.getConnection((err, connection) => {
            if (err) {
                logger.error(err);
                callback(err, null);
                return;
            }

            connection.query(
                'UPDATE `meal` SET ? WHERE `id` = ?',
                [newData, mealId],
                (error, results, fields) => {
                    connection.release();

                    if (error) {
                        logger.error(error);
                        callback(error, null);
                    } else {
                        if (results.affectedRows === 0) {
                            const notFoundError = new Error(`Meal with ID ${mealId} not found`);
                            notFoundError.status = 404;
                            callback(notFoundError, null);
                        } else {
                            const updatedMeal = { id: mealId, ...newData };
                            callback(null, {
                                message: `Meal with ID ${mealId} updated successfully`,
                                data: updatedMeal
                            });
                        }
                    }
                }
            );
        });
    },

    delete: (mealId, callback) => {
        logger.info(`Deleting meal with ID ${mealId}`);
        db.getConnection((err, connection) => {
            if (err) {
                logger.error(err);
                callback(err, null);
                return;
            }

            connection.query(
                'DELETE FROM `meal` WHERE `id` = ?',
                [mealId],
                (error, results, fields) => {
                    connection.release();

                    if (error) {
                        logger.error(error);
                        callback(error, null);
                    } else {
                        if (results.affectedRows === 0) {
                            const notFoundError = new Error(`Meal with ID ${mealId} not found`);
                            notFoundError.status = 404;
                            callback(notFoundError, null);
                        } else {
                            callback(null, {
                                message: `Meal with ID ${mealId} deleted successfully`
                            });
                        }
                    }
                }
            );
        });
    }
};

module.exports = mealService;