const jwt = require('jsonwebtoken'),
    crypto = require('crypto');

const config = require('../config.js');
const secret = config.jwt_secret;
const UserModel = require('../users/users.model');

//-----Validations------

exports.validRefreshJWTNeeded = (req, res, next) => {

    if (!req.body || !req.body.refreshToken)
        return res.status(400).send();

    if (!req.headers['authorization'])
        return res.status(401).send();

    try {
        //Validate access token
        let authorization = req.headers['authorization'];
        req.jwt = jwt.verify(authorization, secret);

        //Validate expiry time
        const nowUnixSeconds = Math.round(Number(new Date()) / 1000);
        const expiration = req.jwt.iat + config.jwt_refresh_expiration_in_seconds;
        if(nowUnixSeconds > expiration)
            return res.status(403).send({error: "Token Expired"});

        //Validate refresh token
        let b = Buffer.from(req.body.refreshToken, 'base64');
        let refresh_token = b.toString();
        let hash = crypto.createHmac('sha512', req.jwt.refreshKey).update(req.jwt.userId + secret).digest("base64");
        if (hash !== refresh_token)
            return res.status(403).send({error: 'Invalid refresh token'});

        //Validate refresh key in DB
        UserModel.getById(req.jwt.userId).then(function(user){

            if(user.refreshKey !== req.jwt.refreshKey)
                return res.status(403).send({error: 'Invalid refresh key'});

            req.body = req.jwt;
            delete req.body.iat; //Delete previous iat to generate a new one
            return next();
        })
        .catch((error) =>{
            res.status(404).send({error: "Invalid user"});
        });

    } catch (err) {
        return res.status(403).send({error: "Invalid Token"});
    }
};


exports.validJWTNeeded = (req, res, next) => {

    if (!req.headers['authorization'])
        return res.status(401).send();

    try {
        //Validate access token
        let authorization = req.headers['authorization'];
        req.jwt = jwt.verify(authorization, secret);

        //Validate expiry time
        const nowUnixSeconds = Math.round(Number(new Date()) / 1000);
        const expiration = req.jwt.iat + config.jwt_expiration_in_seconds;
        if(nowUnixSeconds > expiration)
            return res.status(403).send({error: "Expired"});

        return next();

    } catch (err) {
        return res.status(403).send({error: "Invalid Token"});
    }
};



exports.hasAuthValidFields = (req, res, next) => {

    if (req.body) {
        if(Object.keys(req.body).length > 3){
            return res.status(400).send({error: 'Invalid params'});
        }
        if (!req.body.email && !req.body.username) {
            return res.status(400).send({error: 'Missing username/email field'});
        }
        if (!req.body.password) {
            return res.status(400).send({error: 'Missing password field'});
        }

        return next();
    } else {
        return res.status(400).send({error: 'Missing email and password fields'});
    }
};

//--- Permisions -----

exports.minimumPermissionLevelRequired = (required_permission_level) => {
    return (req, res, next) => {
        let user_permission_level = parseInt(req.jwt.permissionLevel);
        if (user_permission_level >= required_permission_level) {
            return next();
        } else {
            return res.status(403).send();
        }
    };
};

exports.onlySameUserOr = (required_permission_level) => {
    return (req, res, next) => {
        let user_permission_level = parseInt(req.jwt.permissionLevel);
        let userId = req.jwt.userId;
        if (req.params && req.params.userId && userId === req.params.userId) {
            return next();
        } else {
            if (user_permission_level >= required_permission_level) {
                return next();
            } else {
                return res.status(403).send();
            }
        }
    };
};

exports.sameUserCantDoThisAction = (req, res, next) => {
    let userId = req.jwt.userId;

    if (req.params.userId !== userId) {
        return next();
    } else {
        return res.status(400).send();
    }

};

