

const util = require('util');
const fs = require('fs-extra')
const portscanner = require('portscanner')
const kad = require('kad');
const ee = require('events').EventEmitter; 
const Gossipmonger = require('./dht.js');
const TcpTransport = require('gossipmonger-tcp-transport');
const quasar = require('kad-quasar');
const { Transform } = require('stream');
const Discovery = require('./discovery.js'); 
const Crypt = require("./crypt.js");
const string = require("./utils/strings.js");
const levelup = require('levelup');
const time = require("./utils/time.js");

////var DHT = require('bittorrent-dht')

var crypt = new Crypt(); 

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


}


var t1, t2;
var g1, g2;
var id1 = "id1",
    id2 = "id2";

Network.prototype = {

  transport: false,

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

        return self;

    },

    connect: function(opts){

    var self = this;

    log.info("starting DHT at port "+self.gossipTcpPort);

    var dbDir = self.networkPath+"/dht";
    var dbFile = self.networkPath+"/dht/block.db";

      fs.ensureDirSync(dbDir);

        var events = new ee();

        var node = kad({
      identity: string.sha(self.networkKey),
          transport: new kad.UDPTransport(),
          storage: levelup(dbFile),
          contact: { hostname: 'localhost', port: self.gossipTcpPort  }
        });

            node.listen(self.gossipTcpPort);

            node.plugin(quasar);

        var discovery = new Discovery();

        var scan = discovery.start({
                maxConnections: 45,
                id: self.networkKey
            });

    log.info("polling peer network");

            scan.on("connection", function(peer, info, type){

                peer.write(crypt.writeStr("i*localhost*"+self.gossipTcpPort));

                peer.on("data", function(data){

                    var msg = crypt.readStr(data.toString(""));

                    var d = msg.split("*");

                    var type = d[0];

                    if(type == "i"){

                        // URGENT: Must include strict typing here 

                        var host = d[1];
                        var port = d[2];

                        var payload = {
                            hostname: host,
                            port: port
                        }

                        var req = [
                           string.blake2bls(data.toString("")),
                           payload
                        ];

                        node.join(req, function(err){

                            if(err) { log.error(err); } else {

                            }

                        });

                    } else if(type == "b") {

                        /* block sync from collider chain*/
            var from = d[1];
            var to = d[1];

          }

                });

            });

        node.use((req, res, next) => {
          //let [identityString] = request.contact

      console.log(req);
      //if(req.method == "STORE"){
      //    console.log(req);
      //}

          //if .includes(identityString)) {
          //  return next(new Error('You have been blacklisted'));
          //}
          next();

        });

    //node.rpc.serializer.prepend(new Transform({
    //  transform: function(data, encoding, callback) {

    //  },
    //  objectMode: true
    //}));

    //node.rpc.deserializer.append(new Transform({
    //  transform: function(data, encoding, callback) {

    //  },
    //  objectMode: true
    //}));

    //node.quasarSubscribe("block", function(msg){

    //});

    //node.quasarSubscribe("tx", function(msg){

    //});
        //
        node.subscribe = function(type, cb){
            if(type != undefined){
                node.quasarSubscribe(type, cb);
            }
        }

        node.publish = function(type, data){

            if(data != undefined && data.constructor == Object){
                data.networkKey = self.networkKey;
                data.timestamp = time.unix(); 
                node.quasarPublish(type, data);
            } 

        }

        node.on("join", function(peer){
       var peers = Object.keys(node.router);
      console.log(peers);
            //log.info("node connected to "+node.router.length+" peers");
        });

        node.on("error", function(err){
            log.error(err);
        });

        return {
            events: events,
            dht: node,
            p2p: scan
        }

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

