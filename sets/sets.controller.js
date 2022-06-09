const SetModel = require("./sets.model");
const CardModel = require("../cards/cards.model");
const UserModel = require("../users/users.model");

exports.GetAllSets = async (req, res) => {
  let sets = await SetModel.getAll();
  if(!sets)
    return res.status(500).send({error: "Error Getting All Sets"}); 

  for(var c in sets){ sets[c] = sets[c].toObj(); }
  return res.status(200).send(sets);
};

exports.GetSetByTid = async (req, res) => {
  // 1. Check for cards in set and prepare them.
  let cardsArray = await CardModel.get({ set_tid: req.params.setTid });
  if(!cardsArray)
    return res.status(500).send({error: `Error Getting All Cards Associated To Set With 'tid: ${req.params.setTid}`});

  let set = await SetModel.getByTid(req.params.setTid);
  if (!set)
    return res.status(404).send({ error: `No Set With 'tid: ${req.params.setTid}' Found` });

   //Format data
   set = set.toObj();
   for(let c in cardsArray){ cardsArray[c] = cardsArray[c].toObj(); }
   set.cards = cardsArray;
   set.quantity = 0;

   //Add quantity
   let user = await UserModel.getById({_id: req.jwt.userId});
   if(user){
    for (var i = 0; i < user.sets.length; i++) {
      if(user.sets[i].tid == set.tid)
        set.quantity = user.sets[i].quantity;
    }
  }

   return res.status(200).send(set);
};

exports.AddSet = async (req, res) => {
  const body = req.body;
  const tid = req.body.tid;
  
  if(!body.title || !body.image || !body.tid){
    return res.status(400).send({error: "Invalid parameters"});
  }

  // --> Check that tid is not duplicate
  var set = await SetModel.getByTid(tid);
  if(set)
    return res.status(400).send({ error: `Error Set With 'tid: ${tid}' Already Exists`,});

  const newSet = await SetModel.create(body);
  if(!newSet)
    return res.status(500).send({error: "Error saving to database"});
  
  return res.status(200).send(newSet);
};

exports.EditBySetTid = async (req, res) => {
  const filter = { tid: req.params.setTid };
  const update = req.body;
  delete update.tid;
  delete update._id;
  delete update.id;

  var updated = await SetModel.update(filter, update);
  if(!updated)
      return res.status(400).send({ error: "TID is invalid" });
  
  return res.status(200).send(updated);
};

exports.DeleteBySetTid = async(req, res) => {
  // 1. First Find If Cards Exists in relation to this set

  var cards = await CardModel.get({ set_tid: req.params.setTid });
  if (cards && cards.length > 0)
    return res.status(400).send({error: `Failed to Delete Set... You must delete all cards first!`,});
  
  var success = await SetModel.removeByTid(req.params.setTid);
  if(!success)
    return res.status(404).send({error: `Set not found: No Set With 'tid: ${req.params.setTid}'`,});

  return res.status(200).send({success: true});
};
