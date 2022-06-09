
const AuthController = require('./auth.controller');
const AuthTool = require('./auth.tool');

exports.route = function (app) {

    app.post('/auth', [
        AuthTool.hasAuthValidFields,
        AuthController.isPasswordAndUserMatch,
        AuthController.login
    ]);

    app.post('/auth/refresh', [
        AuthTool.validRefreshJWTNeeded,
        AuthController.login
    ]);

    app.post('/auth/validatetoken',[ 
        AuthController.validatetoken
    ]);

    app.get('/version', [
        AuthController.get_version
    ]);
};