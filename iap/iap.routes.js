const AuthTool = require('../authorization/auth.tool');
const UserTool = require('../users/users.tool');
const IAPController = require('./iap.controller');
const IAPTool = require('./iap.tool');
const config = require('../config');

const ADMIN = config.permissionLevels.ADMIN;
const PAID = config.permissionLevels.PAID_USER;
const FREE = config.permissionLevels.NORMAL_USER;

exports.route = function (app) {
    app.post('/iap/validate', [
        AuthTool.validJWTNeeded,
        AuthTool.minimumPermissionLevelRequired(FREE),
        IAPController.validateReceipt
    ]);
    app.get('/iap/status/:userId/:productId', [
        AuthTool.validJWTNeeded,
        AuthTool.minimumPermissionLevelRequired(FREE),
        IAPController.getSubscriptionStatus
    ]);
    app.get("/iap/list/:userId", [
      AuthTool.validJWTNeeded,
      AuthTool.minimumPermissionLevelRequired(FREE),
      AuthTool.onlySameUserOr(ADMIN),
      IAPController.getUserList,
    ]);
    app.get('/iap/list', [
        AuthTool.validJWTNeeded,
        AuthTool.minimumPermissionLevelRequired(ADMIN),
        IAPController.getList
    ]);
};