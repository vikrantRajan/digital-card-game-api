const UsersController = require('./users.controller');
const UsersCardsController = require("./users.cards.controller");
const UsersSetsController = require("./users.sets.controller");
const UsersStorageController = require("../storage/storage.controller");
const UserTool = require('./users.tool');
const AuthTool = require('../authorization/auth.tool');
const config = require('../config');

const ADMIN = config.permissionLevels.ADMIN; //Highest permision, can read and write all users
const MANAGER = config.permissionLevels.MANAGER; //Middle permission, can read all users
const USER = config.permissionLevels.USER; //Lowest permision, can only do things on same user

exports.route = function (app) {
  app.post("/users/register", [
    UserTool.registerValidations,
    // UserTool.validateProofOfSignup,
    UsersController.registerUser,
  ]);
  app.post("/users/generateProof", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(ADMIN),
    UserTool.generateTestProofOfSignup,
  ]);
  app.get("/users", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(USER),
    UsersController.list,
  ]);
  app.get("/users/:userId", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(USER),
    AuthTool.onlySameUserOr(MANAGER),
    UsersController.getById,
  ]);
  app.patch("/users/:userId", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(USER),
    AuthTool.onlySameUserOr(ADMIN),
    UsersController.patchUserAccount,
  ]);
  app.patch("/users/password/:userId", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(USER),
    AuthTool.onlySameUserOr(ADMIN),
    UsersController.patchPassword,
  ]);
  app.delete("/users/:userId", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(ADMIN),
    UsersController.removeById,
  ]);

  //Email confirm
  app.get("/users/confirm/email/:userId/:emailCode", [
    UsersController.confirmEmail,
  ]);

  // //Decks
  // app.post('/users/deck/:userId/:deckId', [
  //     AuthTool.validJWTNeeded,
  //     AuthTool.minimumPermissionLevelRequired(USER),
  //     AuthTool.onlySameUserOr(ADMIN),
  //     UsersController.updateDeck
  // ]);
  // app.delete('/users/deck/:userId/:deckId', [
  //     AuthTool.validJWTNeeded,
  //     AuthTool.minimumPermissionLevelRequired(USER),
  //     AuthTool.onlySameUserOr(ADMIN),
  //     UsersController.deleteDeck
  // ]);

  // //MANAGER request
  // app.post('/users/gain/:userId', [
  //     AuthTool.validJWTNeeded,
  //     AuthTool.minimumPermissionLevelRequired(MANAGER),
  //     UsersController.gainValues
  // ]);

  // USER - CARDS --------------------------------------
  app.get("/users/cards/:userId", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(USER),
    AuthTool.onlySameUserOr(MANAGER),
    UsersCardsController.GetUserCards,
  ]);

  app.post("/users/givecard/:userId", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(USER),
    AuthTool.onlySameUserOr(ADMIN),
    UsersCardsController.GiveCard,
  ]);

  app.post("/users/addcard/:userId", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(MANAGER),
    AuthTool.onlySameUserOr(ADMIN),
    UsersCardsController.AddCards,
  ]);

  // USER - SETS --------------------------------------
  app.get("/users/sets/:userId", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(USER),
    AuthTool.onlySameUserOr(MANAGER),
    UsersSetsController.GetSets
  ]);

  app.post("/users/addset/:userId", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(MANAGER),
    AuthTool.onlySameUserOr(ADMIN),
    UsersSetsController.AddSets
  ]);

  app.post("/users/openset/:userId", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(USER),
    AuthTool.onlySameUserOr(ADMIN),
    UsersSetsController.OpenSet
  ]);

  app.post("/users/giveset/:userId", [
    AuthTool.validJWTNeeded,
    AuthTool.minimumPermissionLevelRequired(MANAGER),
    AuthTool.onlySameUserOr(ADMIN),
    UsersSetsController.GiveSet
  ]);

};