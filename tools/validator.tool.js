const FileTool = require('../tools/file.tool');
//var curse_words = FileTool.readFileArraySync("./data/curse.txt");

var Validator = {};

Validator.isNumber = function(value){
    return !isNaN(parseFloat(value)) && isFinite(value);
};

Validator.validateUsername = function(username){
    if(typeof username != "string")
        return false;

    if(username.length < 3)
        return false;

    //Cant start with a number (or cant differentiate from phone number)
    if(/^[0-9]+/.test(username))
        return false;

    //Cant have some special characters like @ ' " / \ and space
    if(/[\@\'\"\\\/\s]/.test(username))
        return false;

    return true;
}

Validator.validateUsernameCurse = function(username){
    if(typeof username != "string")
        return false;

    //for(var word of curse_words){
    //    if(username.includes(word))
    //        return false;
    //}

    return true;
}

Validator.validatePhone = function(phone){
    if(typeof phone != "string")
        return false;

    if(phone.length < 7)
        return false;

    if(!/^[0-9]+$/.test(phone))
        return false;

    return true;
}

Validator.validateEmail = function(email){

    if(typeof email != "string")
        return false;

    if(email.length < 7)
        return false;

    var regex_email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(!regex_email.test(email))
        return false;

    return true;

}


Validator.countQuantity = function(array){

    if (!array || !Array.isArray(array))
        return 0;

    //This function should return the total number of cards/sets in array, counting quantity
    //Array will contain a list of objects like {tid:"", quantity: 1}
    //If one object has no quantity parameter, consider the quantity to be one.
    //For example [{tid:"", quantity:2}, {tid:"", quantity:4}, {tid:""}] should return 7

    return 0; //Change this
}


//Returns true or false checking if array has the expected quantity
Validator.validateArray = function(array, quantity){
    var nb = Validator.countQuantity(array);
    return quantity == nb;
}

module.exports = Validator;