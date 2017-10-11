
var Lock = require("./lock.js");
var Log = require("./log.js");

    global._BlockColliderVersion = "0.0.1";
    global.log = new Log(); 
    global._GenesisPath = "./genesis.json";

var path = require('path'+''); // make browserify skip it
var fs = require('fs'); 
var async = require('async');
var Identity = require("./identity.js");
var Network = require("./network.js");
var RoverBase = require("./roverbase.js");
var Storage = require("./storage.js");
var colors = require('colors');


function getColor(tag){

    if(tag == "wav") return colors.bgCyan(tag);

    if(tag == "lsk") return colors.bgRed(tag);

    if(tag == "eth") return colors.bgMagenta(tag);

    if(tag == "btc") return colors.bgYellow(tag);

    if(tag == "neo") return colors.bgGreen(tag);

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

                  var networkInterfaces = network.connect(); 

                  var dht = networkInterfaces.dht;

                  var p2p = networkInterfaces.p2p;

			  	  var storage = new Storage();

                  var blockQueue = async.queue(function(msg, cb){
                      storage.addBlock(msg, cb); 
                  });

			  		  storage.init(function() {

						base.launchRover("btc");
						base.launchRover("eth");
						base.launchRover("neo");
						//base.launchRover("lsk");
						//base.launchRover("wav");
						//base.launchRover("rsk");
						//base.launchRover("xcp");
						//base.launchRover("urb");
                        
                        /* Rover Base Events */
						base.events.on("pow", function(msg){
                            console.log("--------------POW---------------");
							console.log(msg);
						});

						base.events.on("metric", function(msg){
                            console.log("--------------METRIC---------------");
							console.log(msg);
						});

						base.events.on("log", function(msg){
							console.log(msg);
						});

						base.events.on("block", function(msg){
							blockQueue.push(msg, function(err, msg){
                                if(err) { log.error(err); } else {
								    //elselog.info("new "+getColor(msg.id)+" block "+msg.data.blockNumber+" TXs "+msg.data.transactions.length);
								    log.info("new "+getColor(msg.id)+" block "+msg.data.blockNumber);
                                }
							});
						});

                        /* Storage Events */
                        storage.events.on("blockadded", function(block){
                            dht.quasarPublish("block", block);
                        });

                        /* DHT Events */
                        dht.subscribe("block", function(block){
                            storage.addBlock(block, function(err, s){
                                if(err) { log.error(err); } else {

                                }
                            });
                        });

                        dht.subscribe("tx", function(tx){
                            storage.addBlockTransaction(tx);
                        });

			  		});
               });

        }

    });


