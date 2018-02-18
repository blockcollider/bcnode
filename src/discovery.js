
var swarm = require('discovery-swarm')
var moment = require('moment');
var crypto = require('crypto');
var ee = require("events").EventEmitter;
var string = require("./utils/strings.js");
var Log = require('./log.js');

var log = new Log(); 

function Discovery(opts) {

    var options = {
        port: 16600
    }

    if(opts != undefined){

        Object.keys(opts).map(function(k){
            options[k] = opts[k]; 
        });

    }

    Object.keys(options).map(function(k){
        this[k] = options[k];
    });

    this.swarm = swarm();
}


Discovery.prototype = {

    events: new ee(),

    start: function() {

        var self = this;

            self.hash = string.blake2bl("bc+"+moment().format("YYYY"));

            self.swarm.listen(self.port);

            self.swarm.join(self.hash); 

      log.info("banner key assigned "+self.hash);

            return self.swarm;

    }, 

    stop: function(){

        var self = this;

            self.swarm.leave(self.hash);

    }
    
}

module.exports = Discovery;


