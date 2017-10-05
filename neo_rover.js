
//
//


const _ = require('lodash');
const buffer = require('buffer');
const async = require('async');
const request = require('request');
const crypto = require('crypto');
const big = require('big.js');
const string = require('./strings.js');
const Log = require("./log.js");
const neo = require('./neo_dist/neo.blockchain.neo').neo; // must be removed when they fix their NPM lib.

const neoBlockchain = new neo('light', 'mainnet');

//const neoNode = neoBlockchain.nodeWithBlock(-1, 'latency', false);
const neoNode = neoBlockchain.nodeWithBlock(-1, 'latency', false);

const LRU = require("lru-cache")
  , options = { max: 500
              , maxAge: 1000 * 60 * 60 }
  , blockCache = LRU(options)
  , otherCache = LRU(50) // sets just the max size 



const log = new Log();

const ID = "neo";
const DEFAULT_TYPE = "log";
const FAILED_RETRY_DELAY = 3000;
const SUCCESS_RETRY_DELAY = 3000;

process.on("uncaughtError", function(e){

    console.trace(e);
    console.trace("critical error "+ID+" rover, exiting...");
    process.exit(3);

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

	//  going to need to extract the script and verification fields in this.

	var obj = {}

        obj.blockNumber = block.index;
		obj.prevHash = block.previousblockhash; 
		obj.blockHash = block.hash;
		obj.root = block.merkleroot; 
		obj.size = block.size;
        obj.nonce = block.nonce;
		obj.nextConsensus = block.nextconsensus;
		obj.timestamp = block.time; 
		obj.version = block.version; 
		obj.transactions = block.tx.reduce(function(all, t){

                var tx = {
                    txHash: t.txid,
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

function onNewBlock(block) {
        
     transmitRoverBlock(block);

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



var Controller = {

    dpt: false,

    interfaces: [],

    init: function(config) {

          send("log", "quorum unecessary");



          function cycle() {

				neoNode.getBestBlockHash().then(function(a){

					if(blockCache.has(a) === true){
						
						setTimeout(cycle, FAILED_RETRY_DELAY);

					} else {

						blockCache.set(a, true);						

						neoNode.getBlockByHash(a).then(function(b){

							onNewBlock(b);

							setTimeout(cycle, SUCCESS_RETRY_DELAY);

						}).catch(function(err){

                            console.trace(err);
                            setTimeout(5000, cycle);
                            
                        });

					}

				}).catch(function(err){

                    console.trace(err);
                    setTimeout(5000, cycle);

                });

          }

          cycle();

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
