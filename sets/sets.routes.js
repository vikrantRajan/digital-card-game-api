const config = require("../config");
const SetsController = require("./sets.controller");
const AuthTool = require("../authorization/auth.tool");
const ADMIN = config.permissionLevels.ADMIN; //Highest permision, can read and write all users
const MANAGER = config.permissionLevels.MANAGER; //Higher permission, can read all users
const USER = config.permissionLevels.USER; //Lowest permision, can only do things on same user

exports.route = (app) => {
  // ----> GET REQUESTS
  app.get("/sets", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(USER),
    SetsController.GetAllSets
  ]);

  app.get("/sets/:setTid", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(USER),
    SetsController.GetSetByTid
  ]);

  // ----> POST REQUESTS
  app.post("/sets/add", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(MANAGER),
    SetsController.AddSet
  ]);

  // ----> PATCH REQUESTS
  app.patch("/sets/:setTid", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(MANAGER),
    SetsController.EditBySetTid
  ]);

  // ----> DELETE REQUESTS
  app.delete("/sets/:setTid", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(ADMIN),
    SetsController.DeleteBySetTid
  ]);
};
