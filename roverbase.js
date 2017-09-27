

var child = require('child_process');
var time = require("./time.js");
var ee = require('events').EventEmitter;
var socket = require("socket.io")(6600);
var events = new ee();
var log = global.log;


socket.on("connection", function(client){

    var id = global._BlockColliderIdentity;
    var base = {
        publicKey: id.colliderBase.publicKey,
        address: id.colliderBase.address
    }
    
    client.emit("setup", base);

    client.on("work", function(msg){
        console.log("-------------------WORK-----------------------");
        console.log(msg);
        events.emit("work", msg); 
    });

});




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

            var n = child.fork(roverId+"_rover.js");
            var meta = {
                id: roverId,
                process: n
            }

            n.on("message", function(msg){

                var type = "log";
                if(msg.type != undefined){
                    type = msg.type;
				    msg.utc = time.now();
                } 

                socket.emit(type, msg);
                events.emit(type, msg);

            });

            n.on("exit", function(){
                log.info(roverId+" exited");
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


module.exports = RoverBase;

// btc_rover.js
// eth_rover.js
// urbit_rover.js
// lisk_rover.js
// xcp_rover.js
// waves_rover.js
