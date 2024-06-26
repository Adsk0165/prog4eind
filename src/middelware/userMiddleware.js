const assert = require('assert');
const chai = require('chai');
chai.should();
const logger = require('../util/logger');

const validateUserCreate = (req, res, next) => {
    try {
        assert(req.body.firstName, 'Missing or incorrect firstName field');
        chai.expect(req.body.firstName).to.not.be.empty;
        chai.expect(req.body.firstName).to.be.a('string');
        chai.expect(req.body.firstName).to.match(
            /^[a-zA-Z]+$/,
            'firstName must be a string'
        );
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
}

module.exports = {
    validateUserCreate
};
