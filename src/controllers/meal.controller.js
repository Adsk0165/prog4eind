const mealService = require('../services/meal.service');
const logger = require('../util/logger');
const { checkCookIdFromToken } = require('../routes/authentication.routes');

let mealController = {
    create: (req, res, next) => {
        const meal = req.body;
        logger.info('create meal', meal.name);
        mealService.create(req, meal, (error, success) => { // Pass 'req' hier door
            if (error) {
                return next({
                    status: error.status,
                    message: error.message,
                    data: {}
                });
            }
            if (success) {
                res.status(200).json({
                    status: success.status,
                    message: success.message,
                    data: success.data
                });
            }
        });
    },

    getAll: (req, res, next) => {
        logger.trace('getAll meals');
        mealService.getAll((error, success) => {
            if (error) {
                return next({
                    status: error.status,
                    message: error.message,
                    data: {}
                });
            }
            if (success) {
                res.status(200).json({
                    status: 200,
                    message: success.message,
                    data: success.data
                });
            }
        });
    },

    getById: (req, res, next) => {
        const mealId = req.params.mealId;
        logger.trace('mealController: getById', mealId);
        mealService.getById(mealId, (error, meal) => {
            if (error) {
                return next({
                    status: error.status,
                    message: error.message,
                    data: {}
                });
            }
            if (!meal) {
                return next({
                    status: 404,
                    message: 'Meal not found',
                    data: {}
                });
            }
            res.status(200).json({
                status: 200,
                message: 'Meal found',
                data: meal
            });
        });
    },

    update: (req, res, next) => {
        const mealId = parseInt(req.params.mealId);
        const newData = req.body;
        logger.info(`Update meal with ID ${mealId}`);
        mealService.update(mealId, newData, (error, success) => {
            if (error) {
                return next({
                    status: error.status,
                    message: error.message,
                    data: {}
                });
            }
            if (success) {
                res.status(200).json({
                    status: 200,
                    message: success.message,
                    data: success.data
                });
            }
        });
    },

    deleteById: (req, res, next) => {
        const mealId = req.params.mealId;
        logger.info(`Delete meal with ID ${mealId}`);

        // Controleer of de ingelogde gebruiker de maaltijd mag verwijderen
        checkCookIdFromToken(req, mealId, (error, userId) => {
            if (error) {
                return next({
                    status: error.status,
                    message: error.message,
                    data: {}
                });
            }

            // Als de gebruiker geautoriseerd is, verwijder dan de maaltijd
            mealService.delete(mealId, (error, success) => {
                if (error) {
                    return next({
                        status: error.status,
                        message: error.message,
                        data: {}
                    });
                }
                if (success) {
                    res.status(200).json({
                        status: 200,
                        message: success.message,
                        data: success.data
                    });
                }
            });
        });
    }
};

module.exports = mealController;