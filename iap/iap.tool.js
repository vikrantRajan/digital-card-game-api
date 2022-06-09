const config = require('../config');
const IAPModel = require('./iap.model');

const iap = require('in-app-purchase');
iap.config({
    appleExcludeOldTransactions: false, 
    applePassword: config.iap_apple_secret,
    googlePublicKeyStrSandBox: config.iap_google_key_sandbox, 
    googlePublicKeyStrLive: config.iap_google_key, 
    verbose: config.iap_debug,
    test: config.iap_sandbox,
});

exports.validate = async (product_id, transact_id, receipt, sandbox, callback) => {

    //Sandbox mode auto-validate
    if(config.iap_sandbox){
        if(sandbox || receipt.Store == "fake"){
            console.log("Validate Sandbox Receipt");
            callback(true, {productId: product_id, transactionId: transact_id, receipt: receipt});
            return;
        }
    }
    
    async function onSuccess(validatedData) {
        // validatedData: the actual content of the validated receipt
        // validatedData also contains the original receipt
        const options = {
            ignoreCanceled: true, // Apple ONLY (for now...): purchaseData will NOT contain cancceled items
            ignoreExpired: true // purchaseData will NOT contain exipired subscription items
        };
        // validatedData contains sandbox: true/false for Apple and Amazon
        const purchaseData = await iap.getPurchaseData(validatedData, options);
        if(!purchaseData) return "Failed to get purchase data";

        callback(true, purchaseData);
    }
    
    function onError(error) {
        callback(false, error);
    }


    // Not sure if we should change this to async await, as this is dealing with the iap API. 
    iap.setup()
      .then(() => {
        // iap.validate(...) automatically detects what type of receipt you are trying to validate
        return iap.validate(iap.UNITY, receipt).then(onSuccess).catch(onError);
      })
      .catch(onError);

};

exports.getSubscriptionStatus = (userId, productId, callback) => {

    IAPModel.getByProduct(userId, productId)
    .then(function(purchase){

        if(!purchase)
            return callback(false, {});

        //console.log(purchase);

        exports.validate(productId, purchase.transactionId, purchase.receipt, false, function(success, purchaseData){
            //console.log(purchaseData);
            //REPLACE success by check on subscription status
            var suc = success && !iap.isCanceled(purchaseData) && !iap.isExpired(purchaseData);
            callback(suc, purchaseData);
        });
    })
    .catch(function(){
        callback(false, {});
    });

}

exports.generateID = function (length, easyRead) {
  var result = "";
  var characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  if (easyRead) characters = "abcdefghijklmnpqrstuvwxyz123456789"; //Remove confusing characters like 0 and O
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

exports.generateDigitID = function (length) {
  var result = "";
  var characters = "0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};