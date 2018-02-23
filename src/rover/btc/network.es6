// @flow
const { Networks } = require('bitcore-lib')
const { Pool } = require('bitcore-p2p')
const { merge } = require('ramda')

const logging = require('../../logger')
const { getPrivateKey } = require('../utils')

const DEFAULT_STATE = {
  maximumPeers: 96,
  discoveredPeers: 0,
  lastBlock: false,
  quorum: 31,
  peers: {},
  bestHeight: null,
  peerData: {},
  key: getPrivateKey(),
  identity: {
    // TODO: This should not be hardcoded
    identityPath: '/Users/mtxodus1/Library/Application Support/.blockcollider'
  }
}

type Peer = {
  host: string,
  bestHeight: number,
  version: number,
  subversion: number,
  updated?: number
}

export default class Network {
  _state: Object;
  _logger: Object;

  constructor (config: Object = {}) {
    this._logger = logging.logger
    this._state = merge(DEFAULT_STATE, config)
  }

  get quorum (): number {
    return this._state.quorum
  }

  get discoveredPeers (): number {
    return this._state.discoveredPeers
  }

  get lastBlock (): boolean {
    return this._state.lastBlock
  }

  hasQuorum () {
    return this._state.discoveredPeers >= this._state.quorum
  }

  addPeer (peer: Peer) {
    const { peers } = this._state
    peers[peer.host] = {
      bestHeight: peer.bestHeight,
      version: peer.version,
      subversion: peer.subversion,
      updated: new Date()
    }
  }

  removePeer (peer: Peer) {
    const { peers, peerData } = this._state

    if (peerData[peer.host] !== undefined) {
      delete peerData[peer.host]
    }

    if (peers[peer.host] === undefined) {
      return
    }

    delete peers[peer.host]
  }

  setState () {
    const newPeers = Object.keys(this._state.peers).reduce((all, host) => {
      const address = this._state.peers[host]
      if (address !== undefined) {
        address.host = host
        all.push(address)
      }
      return all
    }, [])

    const report = newPeers.reduce(function (all, peer) {
      var val = peer.bestHeight
      if (all[val] === undefined) {
        all[val] = 1
      } else {
        all[val]++
      }

      return all
    }, {})

    if (Object.keys(report).length < 1) {
      return false
    }

    const ranks = Object.keys(report).sort(function (a, b) {
      if (report[a] > report[b]) {
        return -1
      }
      if (report[b] > report[a]) {
        return 1
      }
      return 0
    })

    if (ranks === undefined || ranks.length < 1) {
      return false
    }

    this._state.bestHeight = ranks[0]

    return ranks[0]
  }

  connect () {
    const pool = new Pool({
      network: Networks.livenet,
      maxSize: this._state.maximumPeers,
      relay: false
    })

    // connect to the network
    try {
      this._logger.debug('BTC: connected to network')
      pool.connect()
      return pool
    } catch (err) {
      this._logger.error('BTC: error while connecting to network', err)
      pool.listen()
      return pool
    }
  }
}
