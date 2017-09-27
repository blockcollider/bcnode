

var fs = require('fs-extra')
var portscanner = require('portscanner')
var ee = require('events').EventEmitter; 
var BlockCollider = require('./blockcollider.js');
var Gossipmonger = require('./dht.js');
var TcpTransport = require('gossipmonger-tcp-transport');
var util = require('util');

var time = require("./time.js");

var log = global.log;

function getOpenPort(a, cb){

	var b = a+1000;

	portscanner.findAPortNotInUse(a, b, function(err, port) {

		if(err) { 
			log.error("unable to find local network interface to listen on");
			process.exit(3);
		} else {
			cb(null, port);
		}

	});

}

function Network(opts){

    log.info("initializing network");

    if (!global._BlockColliderIdentity) {
        log.error("cannot start network module without load identity configuration");
        process.exit(3);
    }

    var self = this;

    var config = global._BlockColliderIdentity;

    if(opts != undefined){

        Object.keys(opts).map(function(k){
            self[k] = opts[k];
        });
        
    }

    if(!self.networkFile){
        self.networkFile = "network.json";
        self.networkPath = config.identityPath;
    }

    if(!self.networkKey){
        self.networkKey = config.networkKey;
	}

    self.blockCollider = new BlockCollider();

}


var t1, t2;
var g1, g2;
var id1 = "id1",
    id2 = "id2";

Network.prototype = {

	transport: false,

    events: new ee(),

	saveToDisk: function(obj, cb){

		fs.ensureDir(obj.networkPath, function(err){

			if(err) { cb(err); } else {

                if(obj.createdDate == undefined){

				    obj.createdDate = time.now();

                }

				var str = JSON.stringify(obj);	

				fs.writeFile(obj.networkPath+"/"+obj.networkFile, str, "utf8", function(err){
					if(err) { cb(err); } else {
						cb(null, obj);
					}
				});

			}

		});

	},

    setup: function(cb) {

        var self = this;

        var file = self.networkPath+"/"+self.networkFile;

        fs.pathExists(file, function(err, exists){

            if(err) { 
                log.error(err);
                process.exit(3);
            } 

            if(exists == true){

                fs.readFile(file, "utf8", function(err, data){

                    if(err) { 
                        log.error(err);
                        process.exit(3);
                    } 

                    var d = JSON.parse(data);

                    Object.keys(d).map(function(k){
                        self[k] = d[k];
                    });

                    cb(null, d);

                });

            } else {
                
				getOpenPort(10066, function(err, port){
					
					self.gossipTcpPort = port;

                    self.saveToDisk(self, cb);

				});

            }

        });

        return self.events;

    },

    connect: function(){


		//var self = this;

		//var gossipmonger = new Gossipmonger(
		//	{ // peerInfo
		//		id: "localId",
		//		transport: { // default gossipmonger-tcp-transport data
		//			host: "localhost",
		//			port: 9742
		//		}
		//	},
		//	{ 
		//		seeds: [
		//			{id: "seed1", 
		//				transport: {
		//					host: "34.232.77.145",
		//					port: 9993
		//				}
		//			},
		//		]
		//	});

		//gossipmonger.on('error', function (error) {
		//	console.dir(error); 
		//});

		//gossipmonger.on('new peer', function (newPeer) {
		//	console.log("found new peer " + newPeer.id + " at " + newPeer.transport);
		//});

		//gossipmonger.on('peer dead', function (deadPeer) {
		//	console.log("peer " + deadPeer.id + " is now assumed unreachable");
		//});

		//gossipmonger.on('peer live', function (livePeer) {
		//	console.log("peer " + livePeer.id + " is live again");
		//});

		//gossipmonger.on('update', function (peerId, key, value) {
		//	console.log("peer " + peerId + " updated key " + key + " with " + value);
		//});

		///* **IMPORTANT**
		// * Typically, one would create a `transport`, start it (call listen())
		// * and then pass it in as `options.transport` in Gossipmonger constructor. This
		// * makes the implementation of Gossipmonger less complex and simpler.
		// * For development purposes, Gossipmonger comes with a default transport, so
		// * it's easier to get a feel for it, but because of that, if you don't provide
		// * a `transport`, the default one will be used but **you need to start it**.
		// * The call illustrated below will start the default transport. If this isn't done,
		// * you will not receive communications from other gossipmongers. */
		//gossipmonger.transport.listen(function () {
		//	console.log('default transport is listening');
		//});

		//gossipmonger.gossip(); // start gossiping

		//gossipmonger.update("this is that key", 10);

    }
}



function init () {

    g1 = new Gossipmonger({id: id1, transport: {host: 'localhost', port: 9991}}, {
        seeds: [
            {id: id2, transport: {host: '0.0.0.0', port: 9992}},
            //{id: id3, transport: {host: 'localhost', port: 9993}}
        ],
        transport: t1
    });

    g2 = new Gossipmonger({id: id2, transport: {host: '0.0.0.0', port: 9992}}, {
        seeds: [
            //{id: id2, transport: {host: 'localhost', port: 9992}},
            //{id: id3, transport: {host: 'localhost', port: 9993}}
        ],
        transport: t2
    });

    [g1, g2].forEach(function (g) {

        //g.on('deltas receive', function (remote, deltas) {
        //    console.log('[' + g.localPeer.id + '] deltas receive: ' + util.inspect(remote) + ' ' + util.inspect(deltas));
        //});
        //g.on('deltas send', function (remote, deltas) {
        //    console.log('[' + g.localPeer.id + '] deltas send: ' + util.inspect(remote) + ' ' + util.inspect(deltas));
        //});
        //g.on('digest receive', function (remote, digest) {
        //    console.log('[' + g.localPeer.id + '] digest receive: ' + util.inspect(remote) + ' ' + util.inspect(digest));
        //});    
        //g.on('digest send', function (remote, digest) {
        //    console.log('[' + g.localPeer.id + '] digest send: ' + util.inspect(remote) + ' ' + util.inspect(digest));
        //});  
        g.on('new peer', function (peer) {
            console.log('[' + g.localPeer.id + '] new peer: ' + util.inspect(peer));
        }); 
        g.on('peer dead', function (peer) {
            console.log('[' + g.localPeer.id + '] peer dead: ' + util.inspect(peer));
        });     
        g.on('peer live', function (peer) {
            console.log('[' + g.localPeer.id + '] peer live: ' + util.inspect(peer));
        });     
        g.on('unknown peer', function (peer) {
            console.log('[' + g.localPeer.id + '] unknown peer: ' + util.inspect(peer));
        });
        
        g.on('update', function (peerId, key, value) {
            console.log('[' + g.localPeer.id + '] update: ' + peerId + ', ' + key + ', ' + util.inspect(value));
        });

        g.gossip();

    });


	setInterval(function() {

        g1.update("key" + Math.floor(Math.random() * 10), Math.random());

	}, 3000);

}

module.exports = Network;

