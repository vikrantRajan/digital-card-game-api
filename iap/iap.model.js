const mongoose = require('mongoose');
const config = require('../config');

const Schema = mongoose.Schema;

const iapSchema = new Schema({
  userId: { type: mongoose.Schema.ObjectId, ref: "Users", required: true },
  productId: { type: String, required: true },
  transactionId: { type: String, required: true },
  receipt: { type: Object, default: {} },
  time: { type: Date, default: new Date() },
  quantity: { type: Number, default: 1 },
});

iapSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

iapSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
      }
});

const IAP = mongoose.model('IAP', iapSchema);

exports.addIAP = (userId, record) => {
    return new Promise((resolve, reject) => {
        record.userId = mongoose.Types.ObjectId(userId); //Use current user, not the one provided in body
        const iap_record = new IAP(record);
        iap_record.save(function (err, newIAP) {
            if (err) return reject(err);
            newIAP = newIAP.toJSON();
            return resolve(newIAP);
        });
    });
};

exports.getById = async (id) => {

    try {
       const i = await IAP.findOne({_id: id})
       return i;
        
    } catch (e) {
        console.log(e)
        return [];
    }
    // return new Promise((resolve, reject) => {
    //     .exec((err, result) => {
    //         if(err) return reject(err);
    //         if(!result) return resolve(null);
    //         result = result.toJSON();
    //         return resolve(result);
    //     });
    // });
};

exports.getByTransactId = async (id) => {
    try {
       const i = await IAP.findOne({transactionId: id})
       return i;
        
    } catch (e) {
        console.log(e)
        return [];
    }
};

exports.getByProduct = (userId, productId) => {
    return new Promise((resolve, reject) => {
        IAP.findOne({userId: userId, productId: productId})
        .exec((err, result) => {
            if(err) return reject(err);
            if(!result) return resolve(null);
            result = result.toJSON();
            return resolve(result);
        });
    });
};

exports.getList = (perPage, page) => {
    return new Promise((resolve, reject) => {
        IAP.find()
            .limit(perPage)
            .skip(perPage * page)
            .sort({score: -1, time: 1})
            .exec(function (err, purchases) {
                if (err) {
                    reject(err);
                } else {
                    for(var u in purchases){ purchases[u] = purchases[u].toJSON(); }
                    resolve(purchases);
                }
            });
    });
};

exports.getUserList = (userId, perPage, page) => {
    return new Promise((resolve, reject) => {
        IAP.find({userId: userId})
            .limit(perPage)
            .skip(perPage * page)
            .sort({score: -1, time: 1})
            .exec(function (err, purchases) {
                if (err) {
                    reject(err);
                } else {
                    for(var u in purchases){ purchases[u] = purchases[u].toJSON(); }
                    resolve(purchases);
                }
            });
    });
};