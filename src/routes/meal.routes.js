const express = require('express');
const router = express.Router();
const mealController = require('../controllers/meal.controller');
const { validateToken } = require('./authentication.routes');

// Create a new meal
router.post('/api/meal', validateToken, mealController.create);

// Get all meals
router.get('/api/meal', validateToken, mealController.getAll);

// Get meal by ID
router.get('/api/meal/:mealId', validateToken, mealController.getById);

// Update meal by ID
router.put('/api/meal/:mealId', validateToken, mealController.update);

// Delete meal by ID
router.delete('/api/meal/:mealId', validateToken, mealController.deleteById);

module.exports = router;