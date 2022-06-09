
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config.js');
const jwtSecret = config.jwt_secret;
const UserModel = require('../users/users.model');

exports.login = (req, res) => {
    try {
        let refreshId = req.body.userId + jwtSecret;
        let salt = crypto.randomBytes(16).toString('base64');
        let hash = crypto.createHmac('sha512', salt).update(refreshId).digest("base64");
        req.body.refreshKey = salt;
        let token = jwt.sign(req.body, jwtSecret);
        let b = Buffer.from(hash);
        let refresh_token = b.toString('base64');

        UserModel.patchUser(req.body.userId, {refreshKey: salt, lastLoginTime: new Date()});

        res.status(201).send({id: req.body.userId, accessToken: token, refreshToken: refresh_token, version: config.version});
    } catch (err) {
        res.status(500).send({error: err});
    }
};

exports.get_version = (req, res) =>{
    res.status(201).send({version: config.version});
};

// ----- verify user -----------

exports.isPasswordAndUserMatch = (req, res, next) => {

    var CheckUser = function(user){
        if(!user){
            res.status(404).send({error: "Invalid username or password"});
        }
        else{
            let passwordFields = user.password.split('$');
            let salt = passwordFields[0];
            let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest("base64");
            if (hash === passwordFields[1]) {
                req.body = {
                    userId: user.id, // if put user._id  crash with some user-agent (test)
                    username: user.username,
                    email: user.email,
                    permissionLevel: user.permissionLevel,
                    provider: req.body.email ? 'email' : 'username',
                };
                return next();
            } else {
                return res.status(400).send({error: 'Invalid username or password'});
            }
        }
    };

    if(req.body.email){
        UserModel.getByEmail(req.body.email)
        .then(CheckUser)
        .catch((error) =>{
            res.status(404).send({error: "Invalid username or password"});
        });
    }
    else if(req.body.username){
        UserModel.getByUsername(req.body.username)
        .then(CheckUser)
        .catch((error) =>{
            res.status(404).send({error: "Invalid username or password"});
        });
    }else {
        res.status(400).send({error: 'Invalid username or password'});
    }
};

exports.validatetoken = (req, res, next) => {

    var token = req.body.token;

    if(!token)
        return res.status(404).send({error: "Invalid params"});

    try {
        var jtoken = jwt.verify(token, jwtSecret);
        res.status(200).send({id: jtoken.userId, username: jtoken.username, email: jtoken.email, iat: jtoken.iat});

    } catch (err) {
        return res.status(403).send({error: "Invalid Token"});
    }
};