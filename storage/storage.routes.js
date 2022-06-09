const UsersStorageController = require("./storage.controller");
const AuthTool = require("../authorization/auth.tool");
const config = require("../config");

const ADMIN = config.permissionLevels.ADMIN; //Highest permision, can read and write all users
const MANAGER = config.permissionLevels.MANAGER; //Middle permission, can read all users
const USER = config.permissionLevels.USER; //Lowest permision, can only do things on same user

const multer = require("multer"); // Required to store to digital ocean
const upload = multer({ dest: "uploads/" });

exports.route = function (app) {
// STORAGE ---------
app.post("/storage/upload", [
  AuthTool.validJWTNeeded,
  AuthTool.minimumPermissionLevelRequired(MANAGER),
  upload.single("data"), // <-- name of form multipart input
  UsersStorageController.UploadFile,
]);


app.delete("/storage/delete", [
  AuthTool.validJWTNeeded,
  AuthTool.minimumPermissionLevelRequired(MANAGER),
  UsersStorageController.DeleteFile,
]);


}


