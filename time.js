
var moment = require('moment');
var sntp = require("sntp");
var big = require('big.js');

var log = global.log;

if(log === undefined){

    var Log = require("./log.js");
    log = new Log();
}

var time = {

    now: function() {
        return moment().utc().format();
    },

    local: function() {
        return moment().format();
    },

    unix: function() {
        return moment().unix();
    },

    offset: function(cb){

        sntp.time({}, function(err, t){

            if(err) { 

               console.trace(err);
               log.warn("unable to establish delta NTP time sync servers"); 

               cb(null, 1);

            } else {

                try { 

                var offset = Math.abs(t.t);

                var seconds = big(offset).div(1000).times(-1).toFixed(0);

                cb(null, seconds);

                } catch(err){

                    log.warn("unable to establish delta NTP time sync servers"); 

                    cb(null, 0); 

                }

            }

        });

    } 

}

module.exports = time;
