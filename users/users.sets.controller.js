const UserModel = require("./users.model");
const SetModel = require("../sets/sets.model");
const CardModel = require("../cards/cards.model");
const Activity = require("../activitylog/activitylog.model");
const Validator = require("../tools/validator.tool");
const config = require("../config");
const _ = require("lodash");


// GET
exports.GetSets = async (req, res) => {
  const targetUserId = req.params.userId;

  const userData = await UserModel.getById(targetUserId);
  if (!userData || userData === null) {
    return res
      .status(404)
      .send({ error: `User with 'id: ${targetUserId}' Not Found!` });
  }

  var sets_tid = [];
  for (let x = 0; x < userData.sets.length; x++) {
    sets_tid.push(userData.sets[x].tid);
  }

  const d = await SetsModel.getArrayByTid(sets_tid);
  //Add quantities and format to Obj
  for (let y = 0; y < d.length; y++) {
    d[y] = d[y].toObj();

    for (let x = 0; x < userData.sets.length; x++) {
      var user_set = userData.sets[x];
      if (d[y].tid == user_set.tid) d[y].quantity = user_set.quantity;
    }
  }

  return res.status(200).send(d);
};

// POST
exports.GiveSet = async (req, res) => {
  
  if (!req.body.sets && req.body.set) 
    req.body.sets = [req.body.set];

  const setsToGive = req.body.sets;
  const targetUser = req.body.targetUser;
  const currentUserId = req.params.userId;

  if (!setsToGive || !Array.isArray(setsToGive) ||
    setsToGive.length <= 0 || !targetUser || !currentUserId
  ) {
    return res.status(400).send({ error: "Invalid parameters" });
  }

  // 1. Get setsToAdd, Get targetUser
  // 2. save user sets
  const cUserData = await UserModel.getById(currentUserId);
  if (!cUserData) return res.status(404).send({ error: "Cant find user ID" });

  const curUserSets = cUserData.sets;
  let newCurrentUserSets = cUserData.sets;

  if (!curUserSets || curUserSets.length < setsToGive.length) {
    return res.status(404).send({ error: "Cant' find those sets" });
  }

  // Now we have the newCurrentUserSets sorted!

  const tUserData = await UserModel.getByUsername(targetUser);
  if (!tUserData) {
    return res.status(404).send({ error: "Cant find target username" });
  }
  // 5. get target user sets
  let targetUserSets = tUserData.sets;

  //Count sets
  let currentPrevTotal = Validator.countQuantity(curUserSets);
  let targetPrevTotal = Validator.countQuantity(targetUserSets);
  let giveTotal = Validator.countQuantity(setsToGive);

  // SAVING DATA FOR ACTIVITY LOG
  let oldCuserSets = [];
  curUserSets.forEach((t) => {
    oldCuserSets.push({ tid: t.tid, quantity: t.quantity });
  });

  //Loops on sets to check if they exist and also remove them!
  for (let x = 0; x < setsToGive.length; x++) {
    // 3. check if user has requested sets && check if qty is enough

    // Using lodash.find to check for data. its a really good tool. check it out: https://lodash.com/docs/#find
    // Basically it either returns undefined OR the object it found based on search parameters within curUserSets.
    const existingCard = _.find(curUserSets, { tid: setsToGive[x].tid });
    if (!existingCard) {
      return res.status(404).send({ error: "You don't have that set" });
    }
    if (existingCard.quantity < setsToGive[x].quantity) {
      return res.status(400).send({ error: "Not enough sets to send" });
    }

    // 4. newCurrentUserSets.qty = currentUserSets.qty - setsToGive.qty
    let updatedCardQty = existingCard.quantity - setsToGive[x].quantity;

    // Update qty ONLY IF updated qty > 0
    if (updatedCardQty > 0) {
      // Using lodash to find the same index based on tid
      let indexNo = _.findIndex(newCurrentUserSets, function (o) {
        return o.tid == existingCard.tid;
      });

      // using lodash to update newCurrentSets via index we just found.
      _.update(newCurrentUserSets[indexNo], "quantity", (n) => {
        return updatedCardQty;
      });
    }

    if (updatedCardQty === 0) {
      // delete set if qty == 0
      _.remove(newCurrentUserSets, (n) => {
        return n.tid == existingCard.tid;
      });
    }
  }

  // 6. Merge targetuserSets with setsToGive = newTargetUserSets
  let newTargetUserSets = targetUserSets;
  // SAVING DATA FOR ACTIVITY LOG
  let oldTargetUserSets = [];
  targetUserSets.forEach((t) => {
    oldTargetUserSets.push({ tid: t.tid, quantity: t.quantity });
  });

  for (let c = 0; c < setsToGive.length; c++) {
    var setAdd = setsToGive[c];
    if (setAdd.tid) {
      var quantity = setAdd.quantity || 1; //default is 1
      var found = false;

      for (let i = 0; i < newTargetUserSets.length; i++) {
        if (newTargetUserSets[i].tid == setAdd.tid) {
          newTargetUserSets[i].quantity += quantity;
          found = true;
        }
      }

      if (!found) {
        newTargetUserSets.push({
          tid: setAdd.tid,
          quantity: quantity,
        });
      }
    }
  }

  //Validate quantities to make sure the array was updated correctly, this is to prevent users from loosing all their cards because of server error which would be terrible.
  var validCurrentUser = Validator.validateArray(
    newCurrentUserSets,
    currentPrevTotal - giveTotal
  );
  var validTargetUser = Validator.validateArray(
    newTargetUserSets,
    targetPrevTotal + giveTotal
  );
  if (!validCurrentUser || !validTargetUser)
    return res.status(500).send({ error: "Error when validating set array" });

  const cUserDataUpdated = await UserModel.patchUser(currentUserId, {
    sets: newCurrentUserSets,
  });

  if (!cUserDataUpdated) {
    return res.status(404).send("Error");
  }

  const tUserDataUpdated = await UserModel.patchUser(tUserData._id, {
    sets: newTargetUserSets,
  });
  if (!tUserDataUpdated) {
    return res.status(500).send({ error: "Something Went Wrong" });
  } 

  // Activity Log -------------

  const activityData =  {
    setsToGive: setsToGive,
    targetUser: tUserDataUpdated.username,
    targetUserSets: oldTargetUserSets,
    newTargetUserSets: newTargetUserSets,
    currentUserSets: oldCuserSets,
    newCurrentUserSets: newCurrentUserSets,
  };
  
  const a = await Activity.LogActivity("giveset", req.jwt.username, activityData);
  if (!a) return res.status(500).send({ error: "Failed to log activity!!" });

  // Activity Log END -------------

  return res.status(200).send(cUserDataUpdated.deleteConfidentialFields()); // cUserDataUpdated is current user, tUserDataUpdated is target

};

exports.AddSets = async (req, res) => {

  if (!req.body.sets && req.body.set) 
    req.body.sets = [req.body.set];

  const targetUserId = req.params.userId;
  var setsToAdd = req.body.sets;

  //Validate params
  if (!setsToAdd || !Array.isArray(setsToAdd)) {
    return res.status(400).send({ error: "Invalid parameters" });
  }

  //Get the user add update the array
  var user = await UserModel.getById(targetUserId);
  if (!user)
    return res.status(404).send({ error: "Cant find user " + targetUserId });

  var sets_array = user.sets;
  let oldTargetUserSets = [];
  sets_array.forEach(x => { oldTargetUserSets.push({ tid: x.tid, quantity: x.quantity })});
  //Count quantities
  let userTotal = Validator.countQuantity(sets_array);
  let giveTotal = Validator.countQuantity(setsToAdd);

  //Make sure that sets exist
  var sets_tid = [];
  for (let x = 0; x < setsToAdd.length; x++) {
    sets_tid.push(setsToAdd[x].tid);
  }

  var setsFound = await SetModel.getArrayByTid(sets_tid);

  if (!setsFound || setsFound.length < setsToAdd.length)
    return res.status(404).send({ error: "Sets not found" });

  //Set exists! Continue
  //Loop on sets to add
  for (let c = 0; c < setsToAdd.length; c++) {
    var setAdd = setsToAdd[c];
    if (setAdd.tid) {
      var quantity = setAdd.quantity || 1; //default is 1
      var found = false;

      for (let i = 0; i < sets_array.length; i++) {
        if (sets_array[i].tid == setAdd.tid) {
          sets_array[i].quantity += quantity;
          found = true;
        }
      }

      if (!found) {
        sets_array.push({
          tid: setAdd.tid,
          quantity: quantity,
        });
      }
    }
  }

  //Validate quantities to make sure the array was updated correctly, this is to prevent users from loosing all their cards because of server error which would be terrible.
  var validUser = Validator.validateArray(sets_array, userTotal + giveTotal);
  if (!validUser)
    return res.status(500).send({ error: "Error when validating set array" });

  //Update the user array
  var update = { sets: sets_array };
  var updatedUser = await UserModel.patchUser(targetUserId, update);
  if (!updatedUser) return res.status(400).send({ error: "ID is invalid" });

  // Activity Log -------------

  const activityData = {
    setsToAdd: setsToAdd,
    targetUser: user.username,
    oldTargetUserSets: oldTargetUserSets,
    newTargetUserSets: updatedUser.sets,
  };

  const a = await Activity.LogActivity("addset", req.jwt.username, activityData);
  if (!a) return res.status(500).send({ error: "Failed to log activity!!" });

  // Activity Log END -------------

  return res.status(200).send(updatedUser.deleteConfidentialFields());
};

exports.OpenSet = async (req, res) => {
  // 1. Check that req.body & params are valid
  // 2. Check if user has the set_tid + save current user cards & sets || DB CALL TO CURRENT USER
  // 3. || DB CALL TO CARDS FOR SET_TID
  // 4. Generate 5 pairs of numbers for card rarity & variant from config
  // 5. Randomly select 5 cards in the specific order
  // 6. Create new user sets array (subtract or remove set)
  // 7. Create new user cards array (5 new cards + users existing cards)
  // 8. Update with user with new sets + new cards || DB CALL TO UPDATE USER
  // 9. return in json an array of the 5 cards.

  // @---> STEP #1 -----@
  if (!req.body.set_tid || !req.params.userId)
    return res.status(400).send({ error: "Invalid request parameters" });

  const userId = req.params.userId;
  const setTid = req.body.set_tid;

  // @---> STEP #2 -----@
  const curUser = await UserModel.getById(userId);
  if (!curUser) return res.status(404).send({ error: "User Not Found!" });

  const curUserCards = curUser.cards;
  const curUserSets = curUser.sets;
  const existingSet = _.find(curUserSets, { tid: setTid });
  if (!existingSet)
    return res.status(404).send({ error: "You Don't Have That Set!" });

  // @---> STEP #3 -----@
  const setCards = await CardModel.get({ set_tid: setTid });
  if (!setCards || setCards.length == 0)
    return res.status(404).send({ error: "Can't find cards!" });
  let oldUserCards = [];
  curUserCards.forEach(x => { oldUserCards.push({tid: x.tid, quantity: x.quantity })});
  // @---> STEP #4 -----@
  const nb_in_set = 5;
  const newCardsFromSet = [];
  for (let i = 0; i < nb_in_set; i++) {
    let r = GetRandomRarity(i);
    let v = GetRandomVariant(i);
    let card = GetRandomCard(setCards, r, v);
    newCardsFromSet.push(card);
  }

  //Count quantities
  let userTotal = Validator.countQuantity(curUserCards);
  let giveTotal = Validator.countQuantity(newCardsFromSet);

  // @---> STEP #6 -----@--------- CREATE NEW SETS
  const newUserSets = curUserSets;
  const updatedSetQty = existingSet.quantity - 1;
  // Update qty ONLY IF updated qty > 0
  if (updatedSetQty > 0) {
    // Using lodash to find the same index based on tid, then using lodash to update newCurrentSets via index we just found.
    let indexNo = _.findIndex(newUserSets, (o) => o.tid == existingSet.tid);
    _.update(newUserSets[indexNo], "quantity", (n) => updatedSetQty);
  }

  if (updatedSetQty === 0)
    _.remove(newUserSets, (n) => n.tid == existingSet.tid);

  // @---> STEP #7 -----@--------- CREATE CARDS ARRAY
  let newUserCards = curUserCards;
  for (let c = 0; c < newCardsFromSet.length; c++) {
    var cardAdd = newCardsFromSet[c];
    if (cardAdd && cardAdd.tid) {
      var quantity = cardAdd.quantity || 1; //default is 1
      var found = false;

      for (let i = 0; i < newUserCards.length; i++) {
        if (newUserCards[i].tid == cardAdd.tid) {
          newUserCards[i].quantity += quantity;
          found = true;
        }
      }

      if (!found) {
        newUserCards.push({
          tid: cardAdd.tid,
          quantity: quantity,
        });
      }
    }
  }

  //Validate quantities to make sure the array was updated correctly, this is to prevent users from loosing all their cards because of server error which would be terrible.
  var validUser = Validator.validateArray(newUserCards, userTotal + giveTotal);
  if (!validUser)
    return res.status(500).send({ error: "Error when validating cards array" });

  // @---> STEP #8 -----@--------- UPDATE USER
  const finalUpdate = await UserModel.patchUser(userId, {
    cards: newUserCards,
    sets: newUserSets,
  });
  if (!finalUpdate)
    return res.status(500).send({ error: "Failed to update user!" });
  // newUserCards = Updated user.cards array with new merged values
  // newUserSets = Updated user.sets array with new merged values

  // Activity Log -------------

  const activityData = {
    setToOpen: setTid,
    oldUserCards: oldUserCards,
    newUserCards: curUser.cards,
    newCardsFromSet: newCardsFromSet,
  };

  const a = await Activity.LogActivity("openset", req.jwt.username, activityData);
  if (!a) return res.status(500).send({ error: "Failed to log activity!!" });

  // Activity Log END -------------

  // @---> STEP #9 -----@--------- RETURN NEW CARDS JSON OBJECT
  return res.status(200).send(newCardsFromSet);
};

const GetRandomVariant =  (slot_index) => {
  return Math.random() < config.variant_probability ? 1 : 0;
}

const GetRandomRarity =  (slot_index) => {

  var probabilities = config.probabilities[slot_index];
  var randomVal = Math.random();
  var rarity = 0;

  for (const key in probabilities) {
      var value = probabilities[key];
      if(randomVal < value){
            rarity = key;
            break;
      }
      randomVal -= value;
  }
 
  return rarity;
};

const GetRandomCard = (allCards, rarity, variant) => {

  let valid_cards = [];
  for(let i = 0; i < allCards.length; i++) {
    if (rarity == allCards[i].rarity && variant == allCards[i].variant) {
      valid_cards.push(allCards[i])
    }
  }

  var card = null;
  if(valid_cards.length > 0)
    card = valid_cards[Math.floor(Math.random() * valid_cards.length)];

  return card;
};
