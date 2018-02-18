
//
//

const _ = require('lodash');
const buffer = require('buffer');
const async = require('async');
const request = require('request');
const crypto = require('crypto');
const big = require('big.js');
const liskAPI = require("lisk-js");
const string = require('../utils/strings.js');
const Log = require("../log.js");

const LRU = require("lru-cache")
  , options = { max: 500
              , maxAge: 1000 * 60 * 60 }
  , blockCache = LRU(options)
  , otherCache = LRU(50) // sets just the max size 


const ID = "lsk";

var log = new Log();

const DEFAULT_TYPE = "log";

process.on("uncaughtError", function(e){
    console.trace(e);
    console.trace("critical error "+ID+" rover, exiting...");
    process.exit(3);
});

process.on('disconnect', function() {
  console.log('parent exited')
  process.exit();
});

function send(type, data){

    var d;
    var t;

    if(data == undefined){
        t = DEFAULT_TYPE;
        d = type;
    } else {
        t = type;
        d = data;
    }

    var meta = {
        id: ID,
        type: t,
        data: d 
    }

    process.send(meta);

}

function getMerkleRoot(txs){

    return txs.reduce(function(all, tx){

        all = string.blake2b(all+tx.id);

        return all;

    }, "");

}

function transmitRoverBlock(block){

    var coinbaseTransaction = false; 

	var obj = {}

        obj.blockNumber = block.height;
		obj.prevHash = block.previousBlock; 
		obj.blockHash = block.id;
		obj.root = getMerkleRoot(block.transactions); 
		obj.fee = block.totalFee;
		obj.size = block.payloadLength;
        obj.payloadHash = block.payloadHash;
		obj.generator = block.generatorId;
		obj.generatorPublicKey = block.generatorPublicKey; 
        obj.blockSignature = block.blockSignature;
        obj.confirmations = block.confirmations;
        obj.totalForged = block.totalForged;
		obj.timestamp = block.timestamp; 
		obj.version = block.version; 
		obj.transactions = block.transactions.reduce(function(all, t){

                var tx = {
                    txHash: t.id,
                    //inputs: t.inputs,
                    //outputs: t.outputs,
                    marked: false 
                } 

                all.push(tx);

            return all;

		}, []); 

	send("block", obj);

}

function getPrivateKey() {
    return crypto.randomBytes(32);
}


var handleTx = function(tx) {
  async.reduce(tx.outputs, {
    "utxos" : new Array(),
    "keys" : new Array(),
    "amount" : 0,
    "n" : 0
    }, function(memo, out, next) {
      if (out.script.isPublicKeyHashOut()) {
        ////db.get(out.script.toAddress(), function (err, result) {
        ////  if (!(err)) {
        //    var key = new PrivateKey(result);
        //    memo.keys.push(key);
        //    var utxo = new Transaction.UnspentOutput({
        //      "txid" : tx.transaction.id,
        //      "vout" : memo.n,
        //      "address" : out.script.toAddress(),
        //      "script" : out.script,
        //      "satoshis" : out.satoshis,
        //      "output" : out
        //    });
        //    memo.utxos.push(utxo);
        //    memo.amount += out.satoshis;
        ////  };
        //  memo.n++;
        //  next(null, memo);
        ////});
      };
    },
    function(err, results) {

    });
};


function onNewTx(tx, block){

	if (txCache.has(tx.hash)) return;

	txCache.set(tx.hash, true)

    if(tx.isCoinbase() == true){


    }

    //handleTx(tx);

} 

function onNewBlock(block, done) {
        
    var params = {
      "blockId": block.id 
    }
 
    liskAPI.getTransactionsList(params, function(err, success, response) {
        if(err) { console.trace(err); done(); } else {

            block.transactions = response.transactions;
            transmitRoverBlock(block);
            done();

        }
    });

}


function Network (config) {

    var self = this;

    var options = {
        maximumPeers: 112,
        discoveredPeers: 0,
        lastBlock: false,
        quorum: 91,
        peers: {},
        state: {},
        peerData: {},
        key: getPrivateKey(),
        identity: {
            identityPath: "/Users/mtxodus1/Library/Application Support/.blockcollider" 
        }
    }

    if(config != undefined){
        Object.keys(config).map(function(k){
           config[k] = options[k]; 
        });
    }

    Object.keys(options).map(function(k){
        self[k] = options[k];
    });


}

// vim /Users/mtxodus1/Documents/GitHub/bcnode/node_modules/bitcore-p2p/lib/peer.js

Network.prototype = {

    removePeer: function(peer){

        var self = this;

        if(self.peerData[peer.host] != undefined) {
            delete self.peerData[peer.host];
        }

        if(self.peers[peer.host] == undefined) return;

        delete self.peers[peer.host];

    },

    indexPeer: function(peer){

        var self = this;

        //if(self.peers[peer.host] != undefined) return;

        self.peers[peer.host] = {
            bestHeight: peer.bestHeight,
            version: peer.version,
            subversion: peer.subversion,
            updated: new Date()
        }

    },

    setState: function(key) {

        var self = this;

        var peers = Object.keys(self.peers).reduce(function(all, h){

            var a = self.peers[h];

            if(a != undefined){
                a.host = h;
                all.push(a);
            }

            return all;

        }, []);

        var report = peers.reduce(function(all, peer){

            var val = peer.bestHeight;
            if(all[val] == undefined){
                all[val] = 1;
            } else {
                all[val]++;
            }
                
            return all;

        }, {});

        if(Object.keys(report).length < 1) return false;

        var ranks = Object.keys(report).sort(function(a, b){

            if(report[a] > report[b]){
                return -1;
            }

            if(report[b] > report[a]){
                return 1;
            }

            return 0;

        });

        if(ranks == undefined || ranks.length < 1) return false;

        self.state.bestHeight = ranks[0];

        return ranks[0];

    },

    connect: function() {

        var self = this;

        var pool = new Pool({
            network: Networks.livenet, 
            maxSize: self.maximumPeers, 
            relay: false 
        });

        // connect to the network
        pool.connect();

        return pool;


    }

}


function getLastHeight(cb){

    liskAPI.api().sendRequest('blocks/getHeight', function (response) {
      //if(err) { cb(err); } else {
            cb(null, response.height);
      //}
    });

}

var Controller = {

    dpt: false,

    interfaces: [],

    init: function(config) {

          send("log", "quorum unecessary");

          function cycle() {

              getLastHeight(function(err, h){

                  var params = {
                       height: h
                  }

                  liskAPI.getBlocks(params, function(err, success, response){

                    if(err) { 
                       console.trace(err);
                       setTimeout(function(){
                           cycle();
                       }, 2000);
                    } else {

                        var block = response.blocks.pop();

                        if(blockCache.has(block.id) != true){
                           blockCache.set(block.id, true);
                           onNewBlock(block, cycle); 
                        } else {
                           cycle();
                        }

                    }

                  });

              });

          }

          cycle();

          setInterval(function(){

                liskAPI.getPeersList({}, function(error, success, response) {
                    if(error){ 
                        console.trace(error);
                    } else {

                        var t = response.peers.reduce(function(all, a){

                            if(all[a.height] == undefined){
                                all[a.height] = 1;
                            } else {
                                all[a.height]++;
                            }
                            return all;
                        }, {});

                        var tp = Object.keys(t).sort(function(a, b){

                            if(t[a] > t[b]){
                                return -1;
                            }
                            if(t[a] < t[b]){
                                return 1;
                            }
                            return 0;
                        });

                        log.info("peer sample: "+response.peers.length);
                        log.info("probable lsk block heigh "+tp[0]);
                    }
                });

          }, 60000);
    },

    close: function(){

        Controller.interfaces.map(function(c){
            c.close();
        });

    }

}


process.on("message", function(msg){

    var args = [];
    var func = "";

    if(msg.func != undefined){

        func = msg.func;

        if(msg.args != undefined){
            args = msg.args;
        }

        if(Controller[msg.func] != undefined){
            Controller[func].apply(this, args);
        }

    }

});
