

//var magic = 0xd9b4bef9
//var defaultPort = 8333
//
//var dnsSeeds = [
//  'seed.bitcoin.sipa.be',
//  'dnsseed.bluematt.me',
//  'dnsseed.bitcoin.dashjr.org',
//  'seed.bitcoinstats.com',
//  'seed.bitnodes.io',
//  'bitseed.xf2.org',
//  'seed.bitcoin.jonasschnelli.ch'
//]
//var webSeeds = [
//  'wss://us-west.seed.webcoin.io:8192'
//  // TODO: add more
//]
//
//module.exports = {
//  magic,
//  defaultPort,
//  dnsSeeds,
//  webSeeds
//}


const Log = require("./log.js");
const _ = require('lodash');
const buffer = require('buffer');
const string = require('./strings.js');

const crypto = require('crypto');
const Pool = require('bitcore-p2p').Pool;
const Messages = require('bitcore-p2p').Messages;
const Networks = require('bitcore-lib').Networks;
const PrivateKey = require('bitcore-lib').PrivateKey;
const LRUCache = require('lru-cache')
const Transaction = require('btc-transaction').Transaction;
const convBin = require('binstring')
const big = require('big.js');

const txCache = new LRUCache({ max: 3000 })
const blocksCache = new LRUCache({ max: 110 })
const async = require('async');
const DB = require('./db.js');



var log = new Log();

const MARKED_BTC_REGEX = [];
const ID = "btc";
const DEFAULT_TYPE = "log";

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

function transmitRoverBlock(block){

    var coinbaseTransaction = false; 

	var obj = {}

        obj.blockNumber = block.blockNumber;
		obj.prevHash = string.swapOrder(block.header.prevHash.toString("hex"));
		obj.blockHash = block.header.hash;
		obj.root = block.header.merkleRoot;
		//obj.gasLimit = stringToInt(d.header.gasLimit);
		//obj.gasUsed = stringToInt(d.header.gasUsed);
		obj.timestamp = block.header.time; 
		obj.nonce = block.header.nonce; 
		obj.version = block.header.version; 
		obj.difficulty = block.header.getDifficulty(); 
		obj.transactions = block.transactions.reduce(function(all, t){

                var tx = {
                    txHash: t.hash,
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

function onNewBlock(height, block) {

    function next(tx) { 
        onNewTx(tx, block);
    }

    var hash = block.header.hash;
    var timestamp = block.header.time;

	if (blocksCache.has(hash)) return;

    log.info("block: "+hash+" timestamp: "+timestamp);

	blocksCache.set(hash, true)

    var cbTx = block.transactions[0]; 

    var buf = convBin(cbTx.toString("hex"), { in : 'hex', out: 'buffer' });
    
    var coinbaseTx = Transaction.deserialize(buf);

    var blockNumber = coinbaseTx.ins[0].script.getBlockHeight();

    console.log("blockNumber: "+blockNumber);

    if(blockNumber != undefined && isNaN(Number(blockNumber)) == false){

        var n = Number(blockNumber) - 1;

        //if(big(n).eq(block.lastBlock) == true){
        
             transmitRoverBlock(block);

        ///}

    }

	for (let tx of block.transactions) onNewTx(tx, block)


}


function Network (config) {

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
        this[k] = options[k];
    });

    this.db = new DB({ path: this.identity.identityPath });

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

            if(peer[key] != undefined) {

                var val = peer[key];
                if(all[val] == undefined){
                    all[val] = 1;
                } else {
                    all[val]++;
                }
                
            }
            
            return all;

        }, {});

        if(Object.keys(report).length < 2) return;

        var ranks = Object.keys(report).sort(function(a, b){

            if(report[a] > report[b]){
                return -1;
            }

            if(report[b] > report[a]){
                return 1;
            }

            return 0;

        });

        if(ranks == undefined || ranks.length < 2) return;

        self.state[key] = ranks[0];

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

        pool.on('peerready', function(peer, addr) {
            
            console.log("Connect: " + peer.version, peer.subversion, peer.bestHeight, peer.host);

            self.peerData[peer.host] = addr;

            if(self.quorum != true && self.discoveredPeers >= self.quorum){

                self.quorum = true;
                self.lastBlock = self.setState("bestHeight");

                send("log", "quorum established");

            } else if(self.quorum != true && peer.subversion.indexOf("/Satoshi:") > -1){

                self.lastBlock = self.setState("bestHeight");
                self.discoveredPeers++;
                self.indexPeer(peer);

            }

        });

        pool.on('peerdisconnect', function(peer, addr) {

            console.log("Disconnect: " + peer.host);

            self.removePeer(peer);
            self.setState("bestHeight");

        });

        pool.on("peererror", function(err){
            console.log("peererror");
        });

        pool.on("error", function(err){

        });

        // attach peer events
        pool.on('peerinv', (peer, message) => {

            try { 

                //console.log("PeerINV: " + peer.version, peer.subversion, peer.bestHeight, peer.host);

                if(peer.subversion != undefined && peer.subversion.indexOf("/Satoshi:") > -1){

                    const peerMessage = new Messages().GetData(message.inventory);
                    peer.sendMessage(peerMessage);

                } else {

                    //pool._deprioritizeAddr(self.peerData[peer.host]);
                    //pool._removeConnectedPeer(self.peerData[peer.host]);

                }

            } catch(err) { 
                console.trace(err);
            }

        });

        pool.on('peerblock', (peer, { network, block }) => {

            console.log("PeerBlock: " + peer.version, peer.subversion, peer.bestHeight, peer.host);
            console.log("peer best height submitting block: "+peer.bestHeight);

            if(self.lastBlock != undefined && self.lastBlock != false) {

                block.lastBlock = self.lastBlock;

                onNewBlock(peer, block);

            }

        });

        // Erors with bloom filter will need custom parser 
        //pool.on('peertx', (peer, { network, block }) => {
        //    self.indexPeer(peer); 
        //    self.setState("bestHeight");
        //});

        self.poolInterval = setInterval(function() {

            log.info(ID+" rover peers "+pool.numberConnected());

        }, 45000);

    }

}


var Controller = {

    dpt: false,

    interfaces: [],

    start: function(config) {

        var network = new Network(config);

            network.connect();

            Controller.interfaces.push(network);

    },

    init: function(config) {
        Controller.start(config);
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
