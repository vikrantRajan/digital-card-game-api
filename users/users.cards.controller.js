const UserModel = require("./users.model");
const CardModel = require("../cards/cards.model");
const Validator = require("../tools/validator.tool");
const Activity = require("../activitylog/activitylog.model");
const _ = require("lodash");

// GET
exports.GetUserCards = async (req, res) => {
  const targetUserId = req.params.userId;

  const userData = await UserModel.getById(targetUserId);
  if (!userData || userData === null) {
    return res
      .status(404)
      .send({ error: `User with 'id: ${targetUserId}' Not Found!` });
  }

  var cards_tid = [];
  for (let x = 0; x < userData.cards.length; x++) {
    cards_tid.push(userData.cards[x].tid);
  }

  const d = await CardModel.getArrayByTid(cards_tid);
  //Add quantities and format to Obj
  for (let y = 0; y < d.length; y++) {
    d[y] = d[y].toObj();

    for (let x = 0; x < userData.cards.length; x++) {
      var user_card = userData.cards[x];
      if (d[y].tid == user_card.tid) d[y].quantity = user_card.quantity;
    }
  }

  return res.status(200).send(d);
};

// POST
exports.GiveCard = async (req, res) => {
  
  if(!req.body.cards && req.body.card)
    req.body.cards = [req.body.card];

  const cardsToGive = req.body.cards;
  const targetUser = req.body.targetUser;
  const currentUserId = req.params.userId;

  if (!cardsToGive || !Array.isArray(cardsToGive) ||
    cardsToGive.length <= 0 || !targetUser || !currentUserId
  ) {
    return res.status(400).send({ error: "Invalid parameters" });
  }

  // 1. Get cardsToAdd, Get targetUser
  // 2. save user cards
  const cUserData = await UserModel.getById(currentUserId);
  if (!cUserData) return res.status(404).send({ error: "Cant find user ID" });

  const curUserCards = cUserData.cards;
  const newCurrentUserCards = curUserCards;

  if (!curUserCards || curUserCards.length < cardsToGive.length) {
    return res.status(404).send({ error: "Cant' find those cards" });
  }

  // SAVING DATA FOR ACTIVITY LOG
  let oldCurUserCards = [];
  curUserCards.forEach((t) => {
    oldCurUserCards.push({ tid: t.tid, quantity: t.quantity });
  });

  // res.status(200).send({ newCurrentUserCards: newCurrentUserCards,
  // curUserCards: curUserCards });
  // Now we have the newCurrentUserCards sorted!

  const tUserData = await UserModel.getByUsername(targetUser);
  if (!tUserData) {
    return res.status(404).send({ error: "Cant find target username" });
  }
  // 5. get target user cards
  let targetUserCards = tUserData.cards;
  // SAVING DATA FOR ACTIVITY LOG
  let oldTargetUserCards = [];
  targetUserCards.forEach((t) => {
    oldTargetUserCards.push({ tid: t.tid, quantity: t.quantity });
  });
  //Count cards
  let currentPrevTotal = Validator.countQuantity(curUserCards);
  let targetPrevTotal = Validator.countQuantity(targetUserCards);
  let giveTotal = Validator.countQuantity(cardsToGive);

  //Loops on cards to check if they exist and also remove them!
  for (let x = 0; x < cardsToGive.length; x++) {
    // 3. check if user has requested cards && check if qty is enough

    // Using lodash.find to check for data. its a really good tool. check it out: https://lodash.com/docs/#find
    // Basically it either returns undefined OR the object it found based on search parameters within curUserCards.
    const existingCard = _.find(curUserCards, { tid: cardsToGive[x].tid });

    if (!existingCard) {
      return res.status(404).send({ error: "You don't have that card" });
    }
    if (existingCard.quantity < cardsToGive[x].quantity) {
      return res.status(400).send({ error: "Not enough cards to send" });
    }

    // 4. newCurrentUserCards.qty = currentUserCards.qty - cardsToGive.qty
    let updatedCardQty = existingCard.quantity - cardsToGive[x].quantity;

    // Update qty ONLY IF updated qty > 0
    if (updatedCardQty > 0) {
      // Using lodash to find the same index based on tid
      let indexNo = _.findIndex(newCurrentUserCards, function (o) {
        return o.tid == existingCard.tid;
      });

      // using lodash to update newCurrentCards via index we just found.
      let update = _.update(
        newCurrentUserCards[indexNo],
        "quantity",
        function (n) {
          return updatedCardQty;
        }
      );
    }

    if (updatedCardQty === 0) {
      // delete card if qty == 0

      let del = _.remove(newCurrentUserCards, function (n) {
        return n.tid == existingCard.tid;
      });

      //console.log("deleted card");
    }
  }

  // 6. Merge targetuserCards with cardsToGive = newTargetUserCards
  const newTargetUserCards = targetUserCards;
  for (let c = 0; c < cardsToGive.length; c++) {
    var cardAdd = cardsToGive[c];
    if (cardAdd.tid) {
      var quantity = cardAdd.quantity || 1; //default is 1
      var found = false;

      for (let i = 0; i < newTargetUserCards.length; i++) {
        if (newTargetUserCards[i].tid == cardAdd.tid) {
          newTargetUserCards[i].quantity += quantity;
          found = true;
        }
      }

      if (!found) {
        newTargetUserCards.push({
          tid: cardAdd.tid,
          quantity: quantity,
        });
      }
    }
  }

  //Validate quantities to make sure the array was updated correctly, this is to prevent users from loosing all their cards because of server error which would be terrible.
  const validCurrentUser = Validator.validateArray(
    newCurrentUserCards,
    currentPrevTotal - giveTotal
  );
  const validTargetUser = Validator.validateArray(
    newTargetUserCards,
    targetPrevTotal + giveTotal
  );
  if (!validCurrentUser || !validTargetUser)
    return res.status(500).send({ error: "Error when validating card array" });

  const cUserDataUpdated = await UserModel.patchUser(currentUserId, {
    cards: newCurrentUserCards,
  });

  if (!cUserDataUpdated.username) {
    return res.status(404).send({ error: "Error" });
  }

  const tUserDataUpdated = await UserModel.patchUser(tUserData._id, {
    cards: newTargetUserCards,
  });

  if (!tUserDataUpdated) {
    return res.status(500).send({ error: "Something Went Wrong" });
  } 

  // Activity Log -------------

  const activityData = {
    cardsToGive: cardsToGive,
    targetUser: tUserDataUpdated.username,
    targetUserCards: oldTargetUserCards,
    newTargetUserCards: newTargetUserCards,
    currentUserCards: oldCurUserCards,
    newCurrentUserCards: newCurrentUserCards,
  };

  const a = await Activity.LogActivity("givecard", req.jwt.username, activityData);
  if (!a) return res.status(500).send({ error: "Failed to log activity!!" });

  // Activity Log END -------------

  return res.status(200).send(cUserDataUpdated.deleteConfidentialFields()); // cUserDataUpdated is current user, tUserDataUpdated is target

};

exports.AddCards = async (req, res) => {

  if(!req.body.cards && req.body.card)
    req.body.cards = [req.body.card];

  const targetUserId = req.params.userId;
  const cardsToAdd = req.body.cards;

  //Validate params
  if (!cardsToAdd || !Array.isArray(cardsToAdd)) {
    return res.status(400).send({ error: "Invalid parameters" });
  }

  //Get the user add update the array
  const user = await UserModel.getById(targetUserId);
  if (!user)
    return res.status(404).send({ error: "Cant find user " + targetUserId });

  var cards_array = user.cards;
  let oldTargetUserCards = [];
  cards_array.forEach(c => { oldTargetUserCards.push({ tid: c.tid, quantity: c.quantity }) });
  //Count quantities
  let userTotal = Validator.countQuantity(cards_array);
  let giveTotal = Validator.countQuantity(cardsToAdd);

  //Make sure that cards exist
  var cards_tid = [];
  for (let x = 0; x < cardsToAdd.length; x++) {
    cards_tid.push(cardsToAdd[x].tid);
  }

  var cardsFound = await CardModel.getArrayByTid(cards_tid);

  if (!cardsFound || cardsFound.length < cardsToAdd.length)
    return res.status(404).send({ error: "Cards not found" });

  //Card exist! Continue
  //Loop on cards to add
  for (let c = 0; c < cardsToAdd.length; c++) {
    var cardAdd = cardsToAdd[c];
    if (cardAdd.tid) {
      var quantity = cardAdd.quantity || 1; //default is 1
      var found = false;

      for (let i = 0; i < cards_array.length; i++) {
        if (cards_array[i].tid == cardAdd.tid) {
          cards_array[i].quantity += quantity;
          found = true;
        }
      }

      if (!found) {
        cards_array.push({
          tid: cardAdd.tid,
          quantity: quantity,
        });
      }
    }
  }

  //Validate quantities to make sure the array was updated correctly, this is to prevent users from loosing all their cards because of server error which would be terrible.
  var validUser = Validator.validateArray(cards_array, userTotal + giveTotal);
  if (!validUser)
    return res.status(500).send({ error: "Error when validating card array" });

  //Update the user array
  var update = { cards: cards_array };
  var updatedUser = await UserModel.patchUser(targetUserId, update);
  if (!updatedUser) return res.status(400).send({ error: "ID is invalid" });

  // Activity Log -------------

  const activityData =  {
      cardsToAdd: cardsToAdd,
      targetUser: user.username,
      oldTargetUserCards: oldTargetUserCards,
      newTargetUserCards: updatedUser.cards,
  };
  
  const a = await Activity.LogActivity("addcard", req.jwt.username, activityData);
  if (!a) return res.status(500).send({ error: "Failed to log activity!!" });

  // Activity Log END -------------

  return res.status(200).send(updatedUser.deleteConfidentialFields());
};
