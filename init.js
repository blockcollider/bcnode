
var Lock = require("./lock.js");
var Log = require("./log.js");

    global._BlockColliderVersion = "0.0.1";
    global.log = new Log(); 

var path = require('path'+''); // make browserify skip it
var fs = require('fs'); 
var Identity = require("./identity.js");
var Network = require("./network.js");

var identity = new Identity();

    identity.load(function(err, data){

        if(err) {

			log.error(err);
			process.exit(3);

        } else {

            log.info("identity setup done");

			console.log(identity);
			global._BlockColliderIdentity = identity;

            var network = new Network(); 

                network.setupConfig(function() {



                });

        }

    });


