

var fs = require('fs');
var child = require('child_process');
var time = require("../utils/time.js");
var ee = require('events').EventEmitter;
var socket = require("socket.io")(6600);
var events = new ee();
var log = global.log;
var timeOffset = 0;

global._RoverRestartDelay = 5000;

socket.on("connection", function(client){

    var id = global._BlockColliderIdentity;
    var base = {
        publicKey: id.colliderBase.publicKey,
        address: id.colliderBase.address
    }
    
    client.emit("setup", base);

    client.on("pow", function(msg){
        events.emit("pow", msg); 
    });

    client.on("metric", function(msg){
        events.emit("metric", msg); 
    });

    client.on("tx", function(msg){
        events.emit("tx", msg); 
    });

});

var heart = setInterval(function(){

    socket.emit("ping", timeOffset);

}, 5000);

function updateSNTPOffset(){

    time.offset(function(err, offset){

        if(err) { console.trace(err); } else {

            timeOffset = offset;

        }

    });

}

function RoverBase(opts) {

    var options = {
        port: 6600
    }

    if(opts != undefined ){
        Object.keys(opts).map(function(k){
            options[k] = opts[k]
        });
    }

    this.running = [];

}


RoverBase.prototype = {

    events: events, 

    launchRover: function(roverId){

        var self = this;

        var running = self.running.map(function(r){
            return r.id;
        });

        if(running.indexOf(roverId) > -1){

            log.info("rover "+roverId+" already started");
            return;

        } else {

            log.info(roverId+" rover leaving base");

            var n = child.fork("./rovers/"+roverId+"_rover.js");
            var meta = {
                id: roverId,
                process: n
            }

            n.on("message", function(msg){

                var type = "log";
				var id = "coin";

                if(msg.type != undefined){
                    type = msg.type;
				    msg.utc = time.now();


                } 

				if(msg.id != undefined){
					id = msg.id;
				}

                socket.emit(type, msg);
                events.emit(type, msg);

            });

            n.on("exit", function(){

                var restartSeconds = global._RoverRestartDelay / 1000;

                log.info(roverId+" exited restarting in " + restartSeconds + "s");

                self.running = self.running.filter(function(r){

                    if(r.id != roverId){
                        return r;
                    }

                });

                setTimeout(function() {

                    self.launchRover(roverId);
                    
                }, global._RoverRestartDelay);

            });

            n.send({ func: "init", args: [{
                identity: global._BlockColliderIdentity 
            }] });

            self.running.push(meta);

            return self.events;

        }

    },

    killAll: function() {

        var self = this;

            self.running.map(function(r){

                console.log(r);

            });

    }

}

updateSNTPOffset();

module.exports = RoverBase;

// btc_rover.js
// eth_rover.js
// urbit_rover.js
// lisk_rover.js
// xcp_rover.js
// waves_rover.js
