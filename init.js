
var Lock = require("./lock.js");
var Log = require("./log.js");

    global._BlockColliderVersion = "0.0.1";
    global.log = new Log(); 
    global._GenesisPath = "./genesis.json";

var path = require('path'+''); // make browserify skip it
var fs = require('fs'); 
var Identity = require("./identity.js");
var Network = require("./network.js");
var RoverBase = require("./roverbase.js");
var colors = require('colors');


function getColor(tag){

    if(tag == "wav") return colors.cyan(tag);

    if(tag == "lsk") return colors.red(tag);

    if(tag == "eth") return colors.magenta(tag);

    if(tag == "btc") return colors.yellow(tag);

    if(tag == "neo") return colors.green(tag);

}

function readFile(){

    try {
        return require(global._GenesisPath);
    } catch(err) {
        log.error("unable to parse GENESIS file "+global._GenesisPath); 
    }

}

var identity = new Identity();

    identity.load(function(err, data){

        if(err) {

			log.error(err);
			process.exit(3);

        } else {

            log.info("identity setup complete");

			global._BlockColliderIdentity = identity;

            var network = new Network(); 

            var base = new RoverBase(); 

                network.setup(function() {

                    network.connect(); 

                    base.launchRover("btc");
                    base.launchRover("eth");
                    base.launchRover("neo");
                    base.launchRover("wav");
                    base.launchRover("lsk");
                    //base.launchRover("rsk");
                    //base.launchRover("xcp");
                    //base.launchRover("urb");

                    base.events.on("pow", function(msg){
                        console.log(msg);
                    });

                    base.events.on("log", function(msg){
                        console.log(msg);
                    });

                    base.events.on("block", function(msg){
                        log.info("new "+getColor(msg.id)+" block "+msg.data.blockNumber+" TXs "+msg.data.transactions.length);
                    });

               });

        }

    });


