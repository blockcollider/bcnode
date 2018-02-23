const crypto = require('crypto')

export function getPrivateKey () {
  return crypto.randomBytes(32)
}

export default class Network {
  constructor (config) {
    if (config) {
      Object.keys(config).map((k) => {
        config[k] = options[k]
      })
    }

    const options = Network.options

    Object.keys(options).map((k) => {
      this[k] = options[k]
    })
  }

  removePeer (peer) {
    var self = this

    if (self.peerData[peer.host] != undefined) {
      delete self.peerData[peer.host]
    }

    if (self.peers[peer.host] == undefined) {
      return
    }

    delete self.peers[peer.host]
  }

  indexPeer (peer) {
    var self = this

    // if(self.peers[peer.host] != undefined) return;

    self.peers[peer.host] = {
      bestHeight: peer.bestHeight,
      version: peer.version,
      subversion: peer.subversion,
      updated: new Date()
    }
  }

  setState (key) {
    var self = this

    var peers = Object.keys(self.peers).reduce(function (all, h) {
      var a = self.peers[h]

      if (a != undefined) {
        a.host = h
        all.push(a)
      }

      return all
    }, [])

    var report = peers.reduce(function (all, peer) {
      var val = peer.bestHeight
      if (all[val] == undefined) {
        all[val] = 1
      } else {
        all[val]++
      }

      return all
    }, {})

    if (Object.keys(report).length < 1) {
      return false
    }

    var ranks = Object.keys(report).sort(function (a, b) {
      if (report[a] > report[b]) {
        return -1
      }

      if (report[b] > report[a]) {
        return 1
      }

      return 0
    })

    if (ranks == undefined || ranks.length < 1) return false

    self.state.bestHeight = ranks[0]

    return ranks[0]
  }

  connect () {
    var self = this

    var pool = new Pool({
      network: Networks.livenet,
      maxSize: self.maximumPeers,
      relay: false
    })

    // connect to the network

    try {
      pool.connect()

      return pool
    } catch (err) {
      pool.listen()

      return pool
    }
  }
}

Network.options =  {
  maximumPeers: 96,
  discoveredPeers: 0,
  lastBlock: false,
  quorum: 31,
  peers: {},
  state: {},
  peerData: {},
  key: getPrivateKey(),
  identity: {
    // TODO: This should not be hardcoded
    identityPath: '/Users/mtxodus1/Library/Application Support/.blockcollider'
  }
}
