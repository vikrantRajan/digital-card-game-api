const config = require('../config');
const CardsController = require('./cards.controller');
const AuthTool = require("../authorization/auth.tool");
const ADMIN = config.permissionLevels.ADMIN; //Highest permision, can read and write all users
const MANAGER = config.permissionLevels.MANAGER; //Higher permission, can read all users
const USER = config.permissionLevels.USER; //Lowest permision, can only do things on same user

exports.route = (app) => {

  // ----> GET REQUESTS
  app.get("/cards", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(USER),
    CardsController.GetAllCards
  ]);
  app.get("/cards/:cardTid", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(USER),
    CardsController.GetCardByTid
  ]);

  // ----> POST REQUESTS
  app.post("/cards/add", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(MANAGER),
    CardsController.AddCard
  ]);

  // ----> PATCH REQUESTS
  app.patch("/cards/:cardTid", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(MANAGER),
    CardsController.EditByCardTid
  ]);

  // ----> DELETE REQUESTS
  app.delete("/cards/:cardTid", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(USER),
    CardsController.DeleteByCardTid
  ]);
  
};
