

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
const LRUCache = require('lru-cache')

const txCache = new LRUCache({ max: 3000 })
const blocksCache = new LRUCache({ max: 110 })

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

	var obj = {}

		//obj.number = stringToInt(d.header.number);
		obj.prevHash = string.swapOrder(block.header.prevHash.toString("hex"));
		obj.blockHash = block.header.hash;
		obj.root = d.header.merkleRoot;
		//obj.gasLimit = stringToInt(d.header.gasLimit);
		//obj.gasUsed = stringToInt(d.header.gasUsed);
		//obj.nonce = stringToInt(d.header.nonce);
		obj.timestamp = block.header.timestamp; 
		obj.nonce = block.header.nonce; 
		//obj.difficulty = stringToInt(d.header.difficulty);
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

	//console.log(obj.transactions[0]);

	send("block", obj);

}

function getPrivateKey() {
    return crypto.randomBytes(32);
}


function onNewTx(tx, block){

	if (txCache.has(tx.hash)) return;

	txCache.set(tx.hash, true)

} 

function onNewBlock(block) {

    var hash = block.header.hash;
    var timestamp = block.header.time;

	if (blocksCache.has(hash)) return;

    //console.log(Object.keys(block.header));

    log.info("block: "+hash+" timestamp: "+timestamp);

	blocksCache.set(hash, true)

	for (let tx of block.transactions) onNewTx(tx, block)

    transmitRoverBlock(block);

}

function Network (key) {

    if(key != undefined){
        this.key = key;
    } else {
        this.key = getPrivateKey();
    }

    this.minimumPeers = 6;

    this.peers = [] 

}

Network.prototype = {

    addPeer: function(peer){

        var self = this;

        if(peer == undefined || peer.endpoint == undefined){
            return;
        }

        var port;
        var host = peer.endpoint.address;
        var protocol = "http";

        if(HOSTS.indexOf(host) > -1){
            return;
        }

        if(peer.endpoint.tcpPort != undefined){

            port = peer.endpoint.tcpPort;

            var target = protocol+"://"+host+":"+port;

            log.info("new peer: "+target);

            self.peers.push(target);

        }

    },

    connect: function() {

        var self = this;

        var pool = new Pool({
            network: Networks.livenet, 
            maxSize: 60, 
            relay: false 
        });

        // connect to the network
        pool.connect();

        // attach peer events
        pool.on('peerinv', (peer, message) => {
            const peerMessage = new Messages().GetData(message.inventory);
            peer.sendMessage(peerMessage);
        });

        pool.on('peerblock', (peer, { network, block }) => {
            onNewBlock(block);
        });

        self.poolInterval = setInterval(function() {

            log.info(ID+" rover peers "+pool.numberConnected());

        }, 45000);

    }

}


var Controller = {

    dpt: false,

    interfaces: [],

    start: function() {

        var network = new Network();

            network.connect();

            Controller.interfaces.push(network);

    },

    init: function() {

        Controller.start();
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
            Controller[func].call(args);
        }

    }

});
