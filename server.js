require("dotenv").config(); // used to process secret variables like passwords, credentials etc.
const fs = require('fs');
const http = require('http');
const https = require('https');
const config = require('./config.js');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require("morgan"); 
const multer = require("multer"); // Required to store to digital ocean

// HTTP Request Logger (lets us see what HTTP requests were made to API on console)
// app.use(morgan("tiny")); //DISABLED because its already logged by another thing


// CONNECTION TO DATABASE
const mongoose = require("mongoose");
// mongoose.connect(process.env.mongodbconnect, config.mongodb_options);
mongoose.connect(config.mongodb_connect, config.mongodb_options);
// TELL US IF MONGO CONNECTION IS ON?
mongoose.connection.on("connected", () => {
  console.log("Mongoose is connected!!!!!");
});

//Headers
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
    if (req.method === 'OPTIONS') {
        return res.send(200);
    } else {
        return next();
    }
});

//Parse JSON body
app.use(bodyParser.json());

//  images 
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));
//app.use(morgan("dev"));


//Log request
app.use((req, res, next) => {
    var today = new Date();
    var date = today.getFullYear() +'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var date_tag = "[" + date + " " + time + "]";
    console.log(date_tag + " " + req.method + " " + req.originalUrl);
    next();
})

//Rout root DIR
app.get('/', function(req, res){
    res.status(200).send(config.api_title + " API");
});

//Server public any other dir
app.use('/', express.static('public'))


//Routing
const AuthorizationRouter = require('./authorization/auth.routes');
AuthorizationRouter.route(app);

const UsersRouter = require('./users/users.routes');
UsersRouter.route(app);

const CardsRouter = require('./cards/cards.routes');
CardsRouter.route(app);

const SetsRouter = require("./sets/sets.routes");
SetsRouter.route(app);

const StorageRouter = require("./storage/storage.routes");
StorageRouter.route(app);

const ActivityLogRouter = require("./activitylog/activitylog.routes");
ActivityLogRouter.route(app);

const IAPRouter = require("./iap/iap.routes");
IAPRouter.route(app);

//HTTP
if(config.allow_http){
    var httpServer = http.createServer(app);
    httpServer.listen(config.port, function () {
        console.log('app http listening at port %s', config.port);
    });
}

//HTTPS
if(config.allow_https && fs.existsSync(config.https_key)) {
    var privateKey  = fs.readFileSync(config.https_key, 'utf8');
    var certificate = fs.readFileSync(config.https_cert, 'utf8');
    var cert_authority = fs.readFileSync(config.https_ca, 'utf8');
    var credentials = {key: privateKey, cert: certificate, ca: cert_authority};
    var httpsServer = https.createServer(credentials, app);
    httpsServer.listen(config.port_https, function () {
        console.log('app https listening at port %s', config.port_https);
    });
}

//Start jobs
//EventsJob.Init();

module.exports = app