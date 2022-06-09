const SetModel = require("../sets/sets.model");
const CardModel = require("./cards.model");
const UserModel = require("../users/users.model");

exports.GetAllCards = async (req, res) => {
  let cards = await CardModel.getAll();
  if(!cards)
      return res.status(500).send({error: "Error Getting All Cards"});

  for(var c in cards){ cards[c] = cards[c].toObj(); }
  return res.status(200).send(cards);
};

exports.GetCardByTid = async (req, res) => {
  

  let card = await CardModel.getByTid(req.params.cardTid);
  if (!card)
    return res.status(404).send({ error: `No Card With 'tid: ${req.params.cardTid}' Found` });
  

  let set = await SetModel.getByTid(card.set_tid);
  if(!set)
    return res.status(404).send({ error: `No Set With 'tid: ${card.set_tid}' Found` });
  
  //Format data
  set = set.toObj();
  card = card.toObj();
  card.set = set;
  card.quantity = 0;

  //Add quantity
  //Add quantity
  let user = await UserModel.getById({_id: req.jwt.userId});

  if(user){
    for (var i = 0; i < user.cards.length; i++) {
      if(user.cards[i].tid == card.tid)
        card.quantity = user.cards[i].quantity;
    }
  }
  
  //Return request
  return res.status(200).send(card);

};

exports.AddCard = async (req, res) => {
  const body = req.body;
  const tid = req.body.tid;
  const set_tid = req.body.set_tid;
  

  if(!body.title || !body.image || !body.tid || !body.set_tid){
    return res.status(400).send({error: "Invalid parameters"});
  }

  // --> Check to see if card.set_tid is assigned to a set.tid with the same value
  var set = await SetModel.getByTid(set_tid);
  if(!set)
     return res.status(400).send({error: `Invalid value on Card: 'set_tid: ${set_tid}' ... No Set with With 'tid: ${set_tid}' Exists`,});

  // --> Check that tid is not duplicate
  var card = await CardModel.getByTid(tid);
  if(card)
      return res.status(400).send({error: `Error Card With 'tid: ${tid}' Already Exists`});

  const newCard = await CardModel.create(body);
  if(!newCard)
    return res.status(500).send({error: "Error saving to database"});
  
  return res.status(200).send(newCard);
};

exports.EditByCardTid = async (req, res) => {
  const filter = { tid: req.params.cardTid };
  const update = req.body;
  delete update.tid;
  delete update._id;
  delete update.id;

  var updated = await CardModel.update(filter, update);
  if(!updated)
      return res.status(400).send({ error: "TID is invalid" });
  
  return res.status(200).send(updated);
};

exports.DeleteByCardTid = async (req, res) => {
  var success = await CardModel.removeByTid(req.params.cardTid);
  if(!success)
    return res.status(404).send({error: `Card not found: 'tid: ${req.params.cardTid}'`,});

  return res.status(200).send({success: true});
};
