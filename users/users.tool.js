const UserModel = require('./users.model');
const crypto = require('crypto');
const config = require('../config.js');
const Validator = require('../tools/validator.tool');
const Email = require('../tools/email.tool');
const DateTool = require('../tools/date.tool');

exports.generateID = function(length, easyRead) {
    var result           = '';
    var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
    if(easyRead)
        characters  = 'abcdefghijklmnpqrstuvwxyz123456789'; //Remove confusing characters like 0 and O
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

exports.sendEmailConfirmCode = (user) => {

    if(!user) return;

    //Send confirm email
    var email = user.email;
    var emailConfirmCode = user.emailConfirmCode;

    var subject = config.api_title + " - Email confirmation";
    var http = config.allow_https ? "https://" : "http://";
    var confirm_link = http + config.api_url + "/users/confirm/email/" + user.id + "/" + emailConfirmCode;
    var text = "Please confirm your email: <a href='" + confirm_link + "'>" + confirm_link + "</a>";

    Email.SendEmail(email, subject, text, function(result){
        console.log("Sent email to: " + email + ": " + result);
    });

};

exports.registerValidations = (req, res, next) => {
    if((!req.body.email || !req.body.username)){
        return res.status(400).send({error: 'Invalid parameters'});
    }

    var email = req.body.email;
    var username = req.body.username;

    if(!Validator.validateUsername(username)){
        return res.status(400).send({error: 'Invalid username'});
    }

    if(!Validator.validateEmail(email)){
        return res.status(400).send({error: 'Invalid email'});
    }

    if(!Validator.validateUsernameCurse(username))
        return res.status(400).json({error: "Username contains illicit words"});

    UserModel.getByUsername(username).then(function(user_username){
        UserModel.getByEmail(email).then(function(user_email){
            if(user_username){
                res.status(400).send({error: 'Username already exists'});
            }
            else if(user_email){
                res.status(400).send({error: 'Email already exists'});
            }else{
                next();
            }
        });
    });
};

var generateProof = function(email, username){
  var proof_string = email + "-" + username;
  var secret = config.public_secret; // I need simplicity/speed if I come back to this code for another project. Also i can just use a different password on the live version
  var salt = "";
  for (var i = 0; i < secret.length; i++) {
    var c = secret.charCodeAt(i);
    salt += String.fromCharCode(c + (i % 11));
  }
  let hash = crypto
    .createHmac("sha512", salt)
    .update(proof_string)
    .digest("base64");
  var proof = hash.substring(0, 20);
  return proof;
};

//Need public_secret to signup, to avoid spam signup filling the database
exports.validateProofOfSignup = (req, res, next) => {

    if(req.body && req.body.email && req.body.username && req.body.proof){

        var email = req.body.email;
        var username = req.body.username;
        var proof = generateProof(email, username);
        var valid_proof = (proof === req.body.proof);

        if (valid_proof) {
            return next();
        } else {
            return res.status(400).send({error: 'Invalid proof of signup'});
        }
    }
    else{
        return res.status(400).send({error: 'Invalid parameters'});
    }
    
};

//TEST FUNCTION : ADMIN ONLY, generate a proof of signup as the client would
exports.generateTestProofOfSignup = (req, res, next) => {

    if(req.body && req.body.email && req.body.username){

        var email = req.body.email;
        var username = req.body.username;
        var proof = generateProof(email, username);

        var result = {proof: proof};
        return res.status(200).send(result);
    }
    else{
        return res.status(400).send({error: 'Invalid parameters'});
    }

};

