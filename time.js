
var moment = require('moment');
var sntp = require("sntp");
var big = require('big.js');

var log = global.log;

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

               log.warn("unable to establish delta NTP time sync servers"); 

               cb(null, 0);

            } else {

                try { 

                var offset = Math.abs(t.t);

                var seconds = big(offset).div(1000).toFixed(2);

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
