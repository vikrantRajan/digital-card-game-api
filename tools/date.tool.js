

var Utils = {};

// -------- Conversion and validations -------
Utils.isNumber = function(value){
    return !isNaN(parseFloat(value)) && isFinite(value);
};

// -------- Date & timestamp -------
Utils.isDate = function(date){
    if(!date) return false;
    var d = new Date(date);
    return (d && Object.prototype.toString.call(d) === '[object Date]' && !isNaN( d.getTime() ));
}

Utils.isJsDate = function(date){
    return (date && Object.prototype.toString.call(date) === '[object Date]' && !isNaN( date.getTime() ));
}

Utils.getMonday = function(date) {
    var d = new Date(date); //Copy date
    var day_index = Utils.getDayIndex(d);
    var diff = d.getDate() - day_index;
    return Utils.getStartOfDay(d.setDate(diff));
}

Utils.getMondayUTC = function(date) {
    var d = new Date(date); //Copy date
    var day_index = Utils.getDayIndexUTC(d);
    var diff = d.getUTCDate() - day_index;
    return Utils.getStartOfDayUTC(d.setUTCDate(diff));
}

Utils.getStartOfYear = function(date){
    var d = new Date(date); //Copy date
    return new Date(d.getFullYear(), 0, 1);
}

Utils.getStartOfYearUTC = function(date){
    var d = new Date(date); //Copy date
    return new Date(Date.UTC(d.getUTCFullYear(), 0, 1, 0, 0, 0));
}

Utils.getStartOfDay = function(date){
    var d = new Date(date); //Copy date
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

Utils.getEndOfDay = function(date){
    var d = Utils.addDays(date, 1); //Add day
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

Utils.getStartOfDayUTC = function(date){
    var d = new Date(date); //Copy date
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

Utils.getEndOfDayUTC = function(date){
    var d =  Utils.addDays(date, 1); //Add day
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

Utils.getDayIndex = function(date){
    var d = new Date(date); //Copy date
    var day_index = (d.getDay() + 6) % 7; //Offset to start on monday instead of sunday
    return day_index;
}

Utils.getDayIndexUTC = function(date){
    var d = new Date(date); //Copy date
    var day_index = (d.getUTCDay() + 6) % 7; //Offset to start on monday instead of sunday
    return day_index;
}

Utils.addDays = function(date, offset) {
    var d = new Date(date); //Copy date
    return new Date(d.setDate(d.getDate() + offset));
}

Utils.addHours = function(date, offset) {
    var d = new Date(date); //Copy date
    return new Date(d.setTime(d.getTime() + (offset*60*60*1000)));
}

Utils.getNextWeek = function(date) {
    return Utils.addDays(date, 7);
}

Utils.dateToISO = function(date){
    var d = new Date(date); //Copy date
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
};

Utils.ISOtoDate = function(iso_date){
    if(Utils.isJsDate(iso_date)){
        return new Date(iso_date); //Already a date
    }
    if(typeof iso_date === "string"){
        var reg = new RegExp(/^\d+-\d+-\d+T\d+:\d+:\d+.\d+Z$/);
        if(iso_date.match(reg)){
            //sql return date format
            return new Date(iso_date);
        }
        else{
            var b = iso_date.split(/\D/);
            return new Date(b[0], b[1]-1, b[2], "0", "0", "0");
        }
    }
    return new Date(undefined);
};

//Warning: does not perform checks like ISOtoDate, make sure iso_date is a string "yyyy-mm-dd"
Utils.ISOtoDateUTC = function(iso_date){
    var b = iso_date.split(/\D/);
    return new Date(Date.UTC(b[0], b[1]-1, b[2], "0", "0", "0"));
}

Utils.TimestampToDate = function(timestamp){
    return new Date(timestamp);
};

Utils.TimestampToISO = function(timestamp){
    return Utils.dateToISO(Utils.TimestampToDate(timestamp));
};

Utils.DateToTimestamp = function(date){
    var d =  new Date(date); //Copy date
    return Math.round(d.getTime()/1000);
};

Utils.dateToTag = function(date){
    var d =  new Date(date); //Copy date
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate();
    if (day.length < 2) day = '0' + day;
    return [month, day].join('-');
};

Utils.dateToString = function(date){
    var d =  new Date(date); //Copy date
    var monthNames = [
        "January", "Febuary", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];

    var day = d.getDate();
    var monthIndex = d.getMonth();
    var year = d.getFullYear();

    return day + ' ' + monthNames[monthIndex] + ' ' + year;
};

module.exports = Utils;