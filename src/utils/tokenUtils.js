const jwt = require('jsonwebtoken');
const appConfig = require('../config/appConfig');

const generateToken = (userId, role) => {
    return jwt.sign({ id: userId, role: role }, appConfig.jwtSecret, { expiresIn: '1h' });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, appConfig.jwtSecret);
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateToken,
    verifyToken
};