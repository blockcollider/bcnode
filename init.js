
var Lock = require("./lock.js");
var Log = require("./log.js");
var path = require('path'+''); // make browserify skip it
var fs = require('fs'); 

    global.log = new Log(); 

var Config = require("./config.js");

var config = new Config();

    config.load(function(err, data){

        if(err) {
            throw Error(err);
        } else {
            console.log(data);
        }

    });

// metrics/distance/ratcliff-obershelp

