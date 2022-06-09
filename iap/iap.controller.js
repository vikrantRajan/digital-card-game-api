const config = require('../config');
const DateTool = require('../tools/date.tool');
const IAPModel = require('./iap.model');
const IAPTool = require('./iap.tool');
const UserModel = require('../users/users.model');

// var giveIAPReward = (userId, iap_data) => {

//     if(iap_data.productId == "upt_stars_100"){
//         iap_data.value = 100;
//         return UserModel.addPlaysShop(userId, iap_data.value);
//     }

//     if(iap_data.productId == "upt_stars_250"){
//         iap_data.value = 250;
//         return UserModel.addPlaysShop(userId, iap_data.value);
//     }

//     if(iap_data.productId == "upt_stars_700"){
//         iap_data.value = 700;
//         return UserModel.addPlaysShop(userId, iap_data.value);
//     }

//     if(iap_data.productId == "upt_stars_2500"){
//         iap_data.value = 2500;
//         return UserModel.addPlaysShop(userId, iap_data.value);
//     }
    
//     if(iap_data.productId == "upt_subs_premium"){
//         var expiration = DateTool.addDays(new Date(), 30);
//         return UserModel.updateSubscription(userId, iap_data.productId, expiration);
//     }

//     return Promise.reject(new Error('Invalid productId'));
// };

exports.validateReceipt = async (req, res) => {
    
    // 1) receive POST json data and receipt, and make sure the correct fields are there
    // 2) check that receipt not already validated in our mongo iap table
    // 3) validate with unity server using the iap package
    // 4) check data returned by unity server for this receipt, check that its valid and that the quantity and products match the ones we sent
    // 5) add the transaction to our iap table
    // 6) add the purchased sets to users
    // 7) return to client 200 if everything worked
    if (!req.body.productId || !req.body.transactionId || !req.body.receipt) return res.status(400).send({error: "Invalid Parameters"})

    const product_id = req.body.productId;
    const transact_id = req.body.transactionId;
    const receipt_json = req.body.receipt;
    const sandbox = req.body.sandbox && config.iap_sandbox;
    const receipt = null;
    
    //REMOVE JSON parse HERE, i will do that on the client side, this will make testing much easier as you dont need to encode the receipt into insomnia. You just put regular json object.
    try{
        receipt = JSON.parse(receipt_json);
        receipt.Subscription = req.body.subscription;
    }catch(e){
        console.log(e);
    }

    //Create fake sandbox receipt
    if(sandbox && receipt == null){
        transact_id =  IAPModel.generateID(20);
        receipt = {
            Store: "fake",
            productId: product_id,
            TransactionID: transact_id,
            Subscription: req.body.subscription,
        };
    }

    if(receipt == null){
        res.status(400).json({error: "Invalid receipt"});
        return;
    }

    //Make sure transacID match !!
    if(receipt.TransactionID != transact_id){
        res.status(400).json({error: "Invalid transaction ID"});
        return;
    }

    //Make sure it was not already validated by checking database
    const iap_transact = await IAPModel.getByTransactId(transact_id);
    if(iap_transact)  return res.status(400).send({error: "Receipt already validated: " + transact_id});
    console.log("Validating IAP: " + product_id);
    
    //Validate with Google Play or Apple Store
    IAPTool.validate(product_id, transact_id, receipt, sandbox, (success, validate_data) => {

        //console.log(validate_data); //Show error

        if(!success){
            console.log("Failed to validate IAP " + product_id);
            return res.status(400).send({ error: "Can't validate IAP" });
        }

        const userId = req.jwt.userId;
        return res.status(200).send(`IAP success for ${userId} product ${product_id} transaction ${transact_id} `);
        
    });
};

exports.getSubscriptionStatus = (req, res) => {
    var product_id = req.params.productId;
    var user_id = req.params.userId;

    IAPTool.getSubscriptionStatus(user_id, product_id, function(success, data){

        var odata = data || {};
        odata.success = success;

        res.status(200).json(odata);

    });
}

exports.restorePurchases = (req, res) => {

    res.status(200).json({});

};

var getPage = (req) =>{
    let page = 0;
    if (req.query) {
        if (req.query.page) {
            req.query.page = parseInt(req.query.page);
            page = Number.isInteger(req.query.page) ? req.query.page : 0;
        }
    }
    return page;
};

exports.getList = (req, res) => {

    //Retrive all
    let limit = req.query.limit && req.query.limit <= 1000 ? parseInt(req.query.limit) : 100;
    let page = getPage(req);

    IAPModel.getList(limit, page)
        .then((result) => {
            res.status(200).send(result);
        })
        .catch((error) =>{
            res.status(404).send({error: "ID not found"});
        });
};

exports.getUserList = async (req, res) => {

    //Retrive all
    let limit = req.query.limit && req.query.limit <= 1000 ? parseInt(req.query.limit) : 100;
    let page = getPage(req);
    let userId = req.params.userId;
    try {
      const userList = await IAPModel.getUserList(userId, limit, page);
      if (!userList) return []; // or res.status(404).send({error: "ID not found"}); ?
      return res.status(200).send(userList);
    } catch (e) {
        return res.status(500).send({error: "Something went wrong while finding the userlist..."}); 
    }
       
};

