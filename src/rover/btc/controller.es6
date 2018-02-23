'use strict';

export default class Controller {
  constructor () {
    this._dpt = false

    this._interfaces = []
  }

  get dpt () {
    return this._dpt
  }

  get interfaces () {
    return this._interfaces
  }

  init (config) {
    var network = new Network(config);

    var pool = network.connect();

    var poolTimeout = setTimeout(function () {
      pool.disconnect().connect();
    }, 3000);

    pool.on('peerready', function (peer, addr) {
      clearTimeout(poolTimeout);
      // console.log("Connect: " + peer.version, peer.subversion, peer.bestHeight, peer.host);

      if (network.quorum != true && network.discoveredPeers >= network.quorum) {
        try {
          network.quorum = true;
          network.lastBlock = network.setState();
          network.discoveredPeers++;
          network.indexPeer(peer);
          send('log', 'quorum established');
        } catch (err) {
          log.error(err);
        }
      } else if (network.quorum != true && peer.subversion.indexOf('/Satoshi:0.1') > -1) {
        try {
          network.discoveredPeers++;
          network.indexPeer(peer);
        } catch (err) {
          if (peer != undefined && peer.status != undefined) {
            peer.disconnect();
          }
        }
      } else {
        try {
          if (peer != undefined && peer.status != undefined) {
            peer.disconnect();
          }
        } catch (err) {
          log.error(err);
        }
      }
    });

    pool.on('peerdisconnect', function (peer, addr) {
      network.removePeer(peer);
    });

    pool.on('peererror', function (peer, err) {
      // log.error("Peer Error");
      // log.error(err);
    });

    pool.on('seederror', function (err) {
      log.error('Seed Error');
      console.trace(err);
    });

    pool.on('peertimeout', function (err) {});

    pool.on('timeout', function (err) {});

    pool.on('error', function (err) {});

    // attach peer events
    pool.on('peerinv', function (peer, message) {
      try {
        // console.log("PeerINV: " + peer.version, peer.subversion, peer.bestHeight, peer.host);

        if (peer.subversion != undefined && peer.subversion.indexOf('/Satoshi:') > -1) {
          try {
            var peerMessage = new Messages().GetData(message.inventory);
            peer.sendMessage(peerMessage);
          } catch (err) {
            log.error(err);

            try {
              pool._removePeer(peer);
            } catch (err) {
              log.error(err);
            }
          }
        }
      } catch (err) {
        console.trace(err);
      }
    });

    pool.on('peerblock', function (peer, _ref) {
      var net = _ref.net,
        block = _ref.block;

      // log.info("PeerBlock: " + peer.version, peer.subversion, peer.bestHeight, peer.host);
      // console.log("peer best height submitting block: "+peer.bestHeight);
      // console.log("LAST BLOCK "+network.state.bestHeight);

      if (network.state.bestHeight != undefined && block.header.version === BLOCK_VERSION) {
        // if(network.state.bestHeight != undefined)  {

        block.lastBlock = network.state.bestHeight;

        if (block.lastBlock != undefined && block.lastBlock != false) {
          onNewBlock(peer, block, function (err, num) {
            block.blockNumber = num;
            network.state.bestHeight = num;
          });
        }
      } else {
        try {
          pool._removePeer(peer);
        } catch (err) {
          log.error(err);
        }
      }
    });

    setInterval(function () {
      log.info(ID + ' rover peers ' + pool.numberConnected());
    }, 60000);
  }

  close () {
    this.interfaces.map((c) => {
      c.close();
    });
  }
}
