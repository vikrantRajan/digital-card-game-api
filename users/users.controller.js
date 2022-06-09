const UserModel = require('./users.model');
const UserTool = require('./users.tool');
const Activity = require("../activitylog/activitylog.model");
// const DateTool = require('../tools/date.tool');
const crypto = require('crypto');
 const config = require('../config');
const Validator = require('../tools/validator.tool');
// const Email = require('../tools/email.tool');

//Register new user
exports.registerUser = async (req, res, next) => {

    let salt = crypto.randomBytes(16).toString("base64");
    let hash = crypto
        .createHmac("sha512", salt)
        .update(req.body.password)
        .digest("base64");

    let user = {};

    user.username = req.body.username;
    user.email = req.body.email;
    user.password = salt + "$" + hash;
    user.refreshKey = "";
    user.permissionLevel = 1;

    user.firstName = req.body.firstName || "";
    user.lastName = req.body.lastName || "";

    user.accountCreationTime = new Date();
    user.lastLoginTime = new Date();
    user.emailConfirmed = false;
    user.emailConfirmCode = UserTool.generateID(20);

    user.cards = [];
    user.sets = [];

    //Create user
    var nUser = await UserModel.createUser(user);
    if(!nUser)
        return res.status(500).send({ error: "Unable to create user" });
    
    //Send confirm email
    UserTool.sendEmailConfirmCode(nUser);

    // Activity Log -------------
    const activityData = {user: nUser.deleteConfidentialFields()};
    const a = await Activity.LogActivity("register", user.username, activityData);
    if (!a) return res.status(500).send({ error: "Failed to log activity!!" });
    
    //Return response
    return res.status(200).send({ success: true, id: nUser._id });
};

//In this function all message are returned in direct text because the email link is accessed from browser
exports.confirmEmail = async (req, res) =>{

    if(!req.params.userId || !req.params.emailCode){
        return res.status(404).send("Code invalid");
    }

    var user = await UserModel.getById(req.params.userId);
    if(!user)
        return res.status(404).send("Code invalid");

    if(user.emailConfirmCode != req.params.emailCode)
        return res.status(404).send("Code invalid");

    //Code valid!
    var data = {emailConfirmed: true};
    UserModel.patchUser(req.params.userId, data)
    .then((result) => {
        return res.status(200).send("Email confirmed!");
    }).catch(() => {
        return res.status(404).send("Code invalid");
    });
};

exports.list = async(req, res) => {
    /*let limit = req.query.limit && req.query.limit <= 100 ? parseInt(req.query.limit) : 10;
    let page = 0;
    if (req.query) {
        if (req.query.page) {
            req.query.page = parseInt(req.query.page);
            page = Number.isInteger(req.query.page) ? req.query.page : 0;
        }
    }*/

    let user_permission_level = parseInt(req.jwt.permissionLevel);
    let is_admin = (user_permission_level >= config.permissionLevels.MANAGER);
    
    var list = await UserModel.list();
    for(var i=0; i<list.length; i++){
        if(is_admin)
            list[i] = list[i].deleteConfidentialFields();
        else
            list[i] = list[i].deleteManagerFields();
    }

    return res.status(200).send(list);
};

exports.getById = (req, res) => {
    UserModel.getById(req.params.userId)
        .then((result) => {
            result = result.deleteConfidentialFields();
            result.serverTime = new Date(); //Return server time
            return res.status(200).send(result);
        })
        .catch((error) =>{
            return res.status(404).send({error: "User not found " + req.params.userId});
        });
};

exports.patchUserAccount = (req, res) => {

    if(req.body.username && !Validator.validateUsername(req.body.username))
        return res.status(400).json({error: "Invalid username"});

    if(req.body.email && !Validator.validateEmail(req.body.email))
        return res.status(400).json({error: "Invalid email"});
    
    if(req.body.username && !Validator.validateUsernameCurse(req.body.username))
        return res.status(400).json({error: "Username contains illicit words"});
    
    UserModel.getById(req.params.userId).then(function(userTarget){

        var search_username = req.body.username ? req.body.username : userTarget.username;
        var search_email = req.body.email ? req.body.email : userTarget.email;

        Promise.all([
            UserModel.getByUsername(search_username),
            UserModel.getByEmail(search_email)
        ])
        .then(function(values){
            var foundUser = values[0];
            var foundUserEmail = values[1];

            //Can't use existing username if its from another user
            if(foundUser && foundUser.username != userTarget.username){
                return res.status(403).json({error: "Username already exists"});
            }

            if(foundUserEmail && foundUserEmail.email != userTarget.email){
                return res.status(403).json({error: "Email already exists"});
            }

            //Validate data
            var userData = {};

            //if(req.body.username && req.body.username != userTarget.username)
            //    userData.username = req.body.username;
            if(req.body.email && req.body.email != userTarget.email){
                userData.email = req.body.email;
                userData.emailConfirmed = false;
                userData.emailConfirmCode = crypto.randomBytes(20).toString('base64');
            }
            if(req.body.firstName){
                userData.firstName = req.body.firstName;
            }
            if(req.body.lastName){
                userData.lastName = req.body.lastName;
            }
            
            //Update user
            UserModel.patchUser(req.params.userId, userData)
                .then((result) => {

                    //Send confirmation if updated email
                    if(userData.email)
                        UserTool.sendEmailConfirmCode(userTarget);

                    return res.status(204).send({});
                })
                .catch(() => {
                    return res.status(404).send({error: "User not found: " + req.params.userId});
                });
        })
        .catch(() => {
            return res.status(404).send({error: "User not found: " + req.params.userId});
        });
    })
    .catch(() => {
        return res.status(404).send({error: "User not found: " + req.params.userId});
    });
};

exports.patchPassword = (req, res) => {

    if(!req.body.password || !req.body.password_previous){
        return res.status(400).json({error: "Invalid parameters"});
    }

    UserModel.getById(req.params.userId).then(function(userTarget){

        let passwordFields = userTarget.password.split('$');
        let saltOld = passwordFields[0];
        let hashOld = crypto.createHmac('sha512', saltOld).update(req.body.password_previous).digest("base64");

        if(hashOld != passwordFields[1]){
            return res.status(401).json({error: "Invalid previous password"});
        }

        if(req.body.password.length < 6){
            return res.status(403).json({error: "Invalid password length"});
        }

        let saltNew = crypto.randomBytes(16).toString('base64');
        let hashNew = crypto.createHmac('sha512', saltNew).update(req.body.password).digest("base64");
        var newPass = saltNew + "$" + hashNew;
        
        //Validate data
        var userData = { password: newPass};

        UserModel.patchUser(req.params.userId, userData)
            .then((result) => {
                return res.status(204).send({});
            })
            .catch(() => {
                return res.status(404).send({error: "User not found: " + req.params.userId});
            });
    })
    .catch(() => {
        return res.status(404).send({error: "User not found: " + req.params.userId});
    });
};

exports.removeById = (req, res) => {
    UserModel.removeById(req.params.userId)
        .then((result)=>{
            return res.status(204).send({});
        })
        .catch(() => {
            return res.status(404).send({error: "User not found: " +  + req.params.userId});
        });
};
