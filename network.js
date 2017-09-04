
module.exports = Network;
var Gossipmonger = require('./dht.js'),
    TcpTransport = require('gossipmonger-tcp-transport'),
    util = require('util');

var log = global.log;

function Network(){

    if (!global._HelixIdentity)
        log.error("cannot start network module without load identity configuration");
        process.exit(3);

}


var t1, t2;
var g1, g2;
var id1 = "id1",
    id2 = "id2";

t1 = TcpTransport.listen({port: 9991}, function () {

	t2 = TcpTransport.listen({port: 9992}, function () {
		init();
	});

});

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

