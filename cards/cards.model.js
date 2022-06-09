const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cardsSchema = new Schema({
  tid: { type: String, index: true, unique: true },
  title: String,
  image: String,
  description: { type: String, default: '' },
  rarity: { type: Number, default: 0 },
  variant: { type: Number, default: 0 },
  set_tid: String,
});

cardsSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

cardsSchema.methods.toObj = function() {
  var elem = this.toObject();
  delete elem.__v;
  delete elem._id;
  return elem;
};

const Card = mongoose.model("Cards", cardsSchema);
exports.Card = Card;

exports.create = async(data) => {
  const card = new Card(data);
  return await card.save();
};

exports.getByTid = async(card_tid) => {

  try{
      var card = await Card.findOne({tid: card_tid});
      return card;
  }
  catch{
      return null;
  }
};

exports.getArrayByTid = async(cards_tid) => {

  try{
      var cards = await Card.find({ tid: { $in: cards_tid } });
      return cards;
  }
  catch{
      return [];
  }

};

exports.get = async(search_filter) => {

  try{
      var cards = await Card.find(search_filter);
      return cards;
  }
  catch{
      return [];
  }

};

exports.getAll = async() => {

  try{
      var cards = await Card.find({});
      return cards;
  }
  catch{
      return [];
  }

};

exports.update = async(filter, update) =>{

  try{
    var updatedCard = await Card.findOneAndUpdate(filter, update, {new: true});
    return updatedCard;
  }
  catch{
    return null;
  }
};

exports.removeByTid = async(card_tid) => {

  try{
      var result = await Card.deleteOne({tid: card_tid});
      return result && result.deletedCount > 0;
  }
  catch{
      return false;
  }
};