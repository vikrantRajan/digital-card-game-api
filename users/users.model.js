const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  email: String,
  password: String,
  refreshKey: String,
  permissionLevel: Number,

  firstName: String,
  lastName: String,

  emailConfirmed: Boolean,
  emailConfirmCode: String,
  accountCreationTime: Date,
  lastLoginTime: Date,

  cards: [{ tid: String, quantity: Number, _id: false }],
  sets: [{ tid: String, quantity: Number, _id: false }]
});

userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

userSchema.methods.toObj = function() {
    var user = this.toObject();
    user.id = user._id;
    delete user.__v;
    delete user._id;
    return user;
};

userSchema.methods.deleteConfidentialFields = function(){
    var user = this.toObject();
    user.id = user._id;
    delete user.__v;
    delete user._id;
    delete user.password; //Don't return password
    delete user.refreshKey; //Don't return refresh token
    delete user.emailConfirmCode; //Don't return confirm code
    return user;
};

userSchema.methods.deleteManagerFields = function(){
    var nUser = {
        username: this.username
    }
    return nUser;
};

const User = mongoose.model('Users', userSchema);
exports.UserModelSchema = User;

// USER DATA MODELS ------------------------------------------------

exports.getByEmail = async(email) => {

    try{
        var regex = new RegExp(["^", email, "$"].join(""), "i");
        var user = await User.findOne({email: regex});
        return user;
    }
    catch{
        return null;
    }
};

exports.getByUsername = async(username) => {

    try{
        var regex = new RegExp(["^", username, "$"].join(""), "i");
        var user = await User.findOne({username: regex});
        return user;
    }
    catch{
        return null;
    }
};

exports.getById = async(id) => {

    try{
        var user = await  User.findOne({_id: id});
        return user;
    }
    catch{
        return null;
    }
};

exports.createUser = async(userData) => {
    const user = new User(userData);
    return await user.save();
};

exports.list = async() => {

    try{
        var users = await User.find()
        users = users || [];
        return users;
    }
    catch{
        return [];
    }
};

exports.listLimit = async(perPage, page) => {

    try{
        var users = await User.find().limit(perPage).skip(perPage * page)
        users = users || [];
        return users;
    }
    catch{
        return [];
    }
};

exports.patchUser = async(userId, userData) => {

    try{
        var user = await User.findById ({_id: userId});
        if(!user) return null;

        for (let i in userData) {
            user[i] = userData[i];
        }

        var updatedUser = await user.save();
        return updatedUser;
    }
    catch{
        return null;
    }
};

exports.removeById = async(userId) => {

    try{
        var result = await User.deleteOne({_id: userId});
        return result && result.deletedCount > 0;
    }
    catch{
        return false;
    }
};
