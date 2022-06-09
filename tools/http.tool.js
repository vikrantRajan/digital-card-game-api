
var http = require('http');
var url = require('url');

var Utils = {};


// -------- Http -----------------
Utils.get = function(path, callback) {
    
    var hostname = url.parse(path).hostname;
    var pathname = url.parse(path).pathname;
    
    var post_options = {
        host: hostname,
        port: '80',
        path: pathname,
        method: 'GET'
    };
      
    var request = http.request(post_options, function(res) {
        res.setEncoding('utf8');
        var oData = "";
        res.on('data', function (chunk) {
            oData += chunk;
        });
        res.on('end', function(){
            callback(oData, res.statusCode);
        });
    });
    
    request.end();
  };
  
  Utils.post = function(path, data, callback) {
      
    var post_data = JSON.stringify(data);
    var hostname = url.parse(path).hostname;
    var pathname = url.parse(path).pathname;
    
    var post_options = {
        host: hostname,
        port: '80',
        path: pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': post_data.length
        }
    };
      
    var request = http.request(post_options, function(res) {
        res.setEncoding('utf8');
        var oData = "";
        res.on('data', function (chunk) {
            oData += chunk;
        });
        res.on('end', function(){
            callback(oData, res.statusCode);
        });
    });
      
    request.write(post_data);
    request.end();
  };
  
  module.exports = Utils;