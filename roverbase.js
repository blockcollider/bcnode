

var child = require('child_process');
var time = require("./time.js");
var ee = require('events').EventEmitter;
var log = global.log;

function serializeEthereumBlock(block) {
    // double sha256 (header hash + block number)
}

function serializeBitcoinBlock(block) {
    // double sha256 (header hash + block number)
}


function RoverBase() {
    this.running = [];
}


RoverBase.prototype = {

    events: new ee(), 

    load: function(roverId){

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
                if(msg.type != undefined){

				    msg.utc = time.now();

                    self.events.emit(msg.type, msg);

                } else {
                    self.events.emit("log", msg);
                }
            });

            n.on("exit", function(){
                log.info(roverId+" exited");
            });

            n.send({ func: "init" });

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
