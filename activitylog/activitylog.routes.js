const ActivityLogController = require("./activitylog.controller");
const AuthTool = require("../authorization/auth.tool");
const config = require("../config");

const ADMIN = config.permissionLevels.ADMIN; //Highest permision, can read and write all users
const MANAGER = config.permissionLevels.MANAGER; //Middle permission, can read all users
const USER = config.permissionLevels.USER; //Lowest permision, can only do things on same user

exports.route = function (app) {

app.get("/activity", [
  AuthTool.validJWTNeeded,
  AuthTool.minimumPermissionLevelRequired(MANAGER),  
  ActivityLogController.GetAllActivities,
]);

}


