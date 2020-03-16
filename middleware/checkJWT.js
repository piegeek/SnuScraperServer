const jwt = require('jsonwebtoken');
const config = require('../config');

function checkJWT(req, res, next) {
    let jwtToken = req.headers['x-access-token'] || req.headers['authorization'];
    
    if (!jwtToken) {
        return res.sendStatus(400);
    }
    // When the token exists and its value is like 'Bearer xxxxx-xxx-xxxx'
    else if (jwtToken.startsWith('Bearer ')) {
        jwtToken = jwtToken.split('Bearer ')[1];
    }
    // Token exists and it doesn't start with 'Bearer ': Most standard case
    else {
        jwt.verify(jwtToken, config.secret, (err, decoded) => {
            if (err) {
                res.sendStatus(400);
            }
            else {
                req.decoded = decoded;
                next();
            }
        });
    }
}

module.exports = checkJWT;