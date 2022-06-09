const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// ---Activity log for 6 of the functions in user (New schema)
// ---Activity saved for addusercard, adduserset, givecard, giveset, openset, register
// ---Activity fields are: type, user, datetime, data     (user is the username)
// ---type is either "addcard", "addset", "givecard", "giveset", "openset", "register".
// ---data is an object where you can save any info about the activity, like the cards/sets involved or the targetUser for give
// ---GET request to retrieve activity by type or by username. (MANAGER)

const activityLogSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
    },
    username: {type: String, required: true},
    timestamp: {type : Date, default: Date.now(), required: true},
    data: Object
  },
  { timestamps: true }
);

activityLogSchema.methods.toObj = function () {
  var elem = this.toObject();
  delete elem.__v;
  delete elem._id;
  return elem;
};

const Activity = mongoose.model("Activity", activityLogSchema);
exports.Activity = Activity;

// ------------------------------
// ------------------------------
// ------------------------------
// ------------------------------

exports.LogActivity = async (type, username, data) => {
  var activity_data = {
    type: type,
    username: username,
    timestamp: Date.now(),
    data: data
  }
  const activity = new Activity(activity_data);
  return await activity.save();
};

exports.GetAll = async () => {
  try {
    const logs = await Activity.find({});
    return logs;
  } catch (e) {
    console.log(e);
    return [];
  }
};

exports.Get = async (data) => {
  try {
    const logs = await Activity.find(data);
    return logs;
  } catch (e) {
    console.log(e);
    return [];
  }
};