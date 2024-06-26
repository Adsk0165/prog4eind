const express = require('express')
const assert = require('assert')
const chai = require('chai')
chai.should()
const router = express.Router()
const database = require('../dao/inmem-db');
const userController = require('../controllers/user.controller')
const logger = require('../util/logger')
const { validateToken, validateUserId} = require('./authentication.routes')

// Tijdelijke functie om niet bestaande routes op te vangen
const notFound = (req, res, next) => {
    next({
        status: 404,
        message: 'Route not found',
        data: {}
    })
}

// Input validation functions for user routes
const validateUserCreate = (req, res, next) => {
    if (!req.body.emailAdress || !req.body.firstName || !req.body.lastName) {
        next({
            status: 400,
            message: 'Missing email or password',
            data: {}
        })
    }
    next()
}

// Input validation function 2 met gebruik van assert
const validateUserCreateAssert = (req, res, next) => {
    try {
        assert(req.body.emailAdress, 'Missing email')
        assert(req.body.firstName, 'Missing or incorrect first name')
        assert(req.body.lastName, 'Missing last name')
        next()
    } catch (ex) {
        next({
            status: 400,
            message: ex.message,
            data: {}
        })
    }
}

// Input validation function 2 met gebruik van assert
const validateUserCreateChaiShould = (req, res, next) => {
    try {
        req.body.firstName.should.not.be.empty.and.a('string')
        req.body.lastName.should.not.be.empty.and.a('string')
        req.body.emailAdress.should.not.be.empty.and.a('string').and.match(/@/)
        next()
    } catch (ex) {
        next({
            status: 400,
            message: ex.message,
            data: {}
        })
    }
}

const validateUserCreateChaiExpect = (req, res, next) => {
    try {
        // Valideer alle vereiste velden
        const requiredFields = ['firstName', 'lastName', 'emailAdress', 'password', 'phoneNumber', 'street', 'city'];
        for (const field of requiredFields) {
            assert(req.body[field], `Missing or incorrect ${field} field`);
        }

        // Valideer het e-mailadres
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(req.body.emailAdress)) {
            throw new Error('Invalid email address');
        }

        // Valideer het wachtwoord
        const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordPattern.test(req.body.password)) {
            throw new Error('Invalid password');
        }

        // Valideer het telefoonnummer
        const phonePattern = /^06-\d{8}$|^06 \d{8}$|^06\d{8}$/;
        if (!phonePattern.test(req.body.phoneNumber)) {
            throw new Error('Invalid phone number');
        }

        logger.trace('User successfully validated');
        next();
    } catch (ex) {
        logger.trace('User validation failed:', ex.message);
        next({
            status: 400,
            message: ex.message,
            data: {}
        });
    }
};


// Userroutes
router.post('/api/user', validateUserCreateChaiExpect, userController.create)
router.get('/api/user', validateToken, userController.getAll)
router.get('/api/user/:userId', validateToken, userController.getById)
router.put('/api/user/:userId', validateUserId, userController.update)
router.delete('/api/user/:userId', validateUserId, userController.delete)

// Tijdelijke routes om niet bestaande routes op te vangen
router.put('/api/user/:userId', notFound)


module.exports = router
