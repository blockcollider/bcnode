


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


//var Peer = require('bitcore-p2p').Peer;
//
//var peer = new Peer({host: 'seed.bitcoinstats.com'});
//
//peer.on('ready', function() {
//  console.log(peer.version, peer.subversion, peer.bestHeight);
//});
//
//peer.on('disconnect', function() {
//  console.log('connection closed');
//});
//// handle events
//peer.on('inv', function(message) {
//	console.log(message);
//	console.log("_______________________INV____________________________");
//});
//
//peer.on('tx', function(message) {
//	console.log(message);
//	console.log("_______________________TX____________________________");
//});
//
//peer.on('addr', function(message) {
//	console.log(message);
//	console.log("_______________________ADDR____________________________");
//  // message.addresses[]
//});
//
//peer.connect();
//
var Pool = require('bitcore-p2p').Pool;
var Networks = require('bitcore-lib').Networks;

console.log(Networks.livenet);

var pool = new Pool({network: Networks.livenet});

// connect to the network
pool.connect();

// attach peer events
pool.on('peerinv', function(peer, message) {
	console.log(message);
  // a new peer message has arrived
});

