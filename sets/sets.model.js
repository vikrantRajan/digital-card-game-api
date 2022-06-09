const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const setsSchema = new Schema({
  tid: { type: String, index: true, unique: true },
  title: String,
  description: String,
  price: Number,
  image: String,
});

setsSchema.methods.toObj = function() {
  var elem = this.toObject();
  delete elem.__v;
  delete elem._id;
  return elem;
};

const Set = mongoose.model("Sets", setsSchema);
exports.Set = Set;

exports.create = async(data) => {
  const set = new Set(data);
  return await set.save();
};

exports.getByTid = async(set_tid) => {

  try{
      var set = await Set.findOne({tid: set_tid});
      return set;
  }
  catch{
      return null;
  }
};

exports.getArrayByTid = async(sets_tid) => {

  try{
      var sets = await Set.find({ tid: { $in: sets_tid } });
      return sets;
  }
  catch{
      return [];
  }

};

exports.getAll = async() => {

  try{
      var sets = await Set.find({});
      return sets;
  }
  catch{
      return [];
  }

};

exports.update = async(filter, update) =>{

  try{
    var updatedSet = await Set.findOneAndUpdate(filter, update, {new: true});
    return updatedSet;
  }
  catch{
    return null;
  }
};

exports.removeByTid = async(set_tid) => {

  try{
      var result = await Set.deleteOne({tid: set_tid});
      return result && result.deletedCount > 0;
  }
  catch{
      return false;
  }
};