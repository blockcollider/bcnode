/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { Networks } = require('bitcore-lib')
const { Pool } = require('bitcore-p2p')
const { merge } = require('ramda')

const logging = require('../../logger')

export type Peer = { // eslint-disable-line no-undef
  host: string,
  bestHeight: number,
  version: number,
  subversion: string,
  updated?: number
}

type State = {
  maximumPeers: number,
  quorum: number,
  peers: { [host: string]: Peer },
  bestHeight: ?number
}

const DEFAULT_STATE: State = {
  maximumPeers: 96,
  quorum: 31,
  peers: {},
  bestHeight: null
}

export const isSatoshiPeer = (peer: Peer) => (peer.subversion && peer.subversion.indexOf('/Satoshi:0.1') > -1)

export class Network {
  _state: Object; // eslint-disable-line no-undef
  _logger: Object; // eslint-disable-line no-undef
  _pool: ?Pool; // eslint-disable-line no-undef
  _poolConnected: bool; // eslint-disable-line no-undef

  constructor (config: Object = {}) {
    this._logger = logging.getLogger(__filename)
    this._state = merge(DEFAULT_STATE, config)
    this._poolConnected = false
  }

  get quorum (): number {
    return this._state.quorum
  }

  get discoveredPeers (): number {
    return Object.keys(this._state.peers).length
  }

  get satoshiPeers (): number {
    const peerPairs = Object.entries(this._state.peers)
    // $FlowFixMe Object.entries returns type Array<[string, mixed]>, should be a generic
    return peerPairs.filter(([host, peer]) => isSatoshiPeer(peer)).length
  }

  get bestHeight (): number {
    return this._state.bestHeight
  }

  set bestHeight (height: number) {
    if (this._state.bestHeight !== null && height < this._state.bestHeight) {
      this._logger.warn(`Network bh: ${this._state.bestHeight}, tried to store bh ${height}`)
      return
    }
    this._state.bestHeight = height
  }

  hasQuorum () {
    return this.discoveredPeers >= this._state.quorum &&
      this.satoshiPeers >= this._state.quorum
  }

  addPeer (peer: Peer) {
    // TODO update all peers height after adding peer - or else in peerready callback
    // wrong bestHeight is assumed because all peers here except of the newly added one have
    // the bestHeigh from time they were added
    const { peers } = this._state
    peers[peer.host] = {
      bestHeight: peer.bestHeight,
      version: peer.version,
      subversion: peer.subversion,
      updated: new Date()
    }
  }

  removePeer (peer: Peer) {
    const { peers } = this._state

    if (peers[peer.host] === undefined) {
      return
    }

    delete peers[peer.host]
  }

  /**
   * Called after establishing quorum to get the best known height of all connected peers
   */
  updateBestHeight () {
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

  get pool (): Pool {
    if (!this._pool) {
      this._pool = new Pool({
        network: Networks.livenet,
        maxSize: this._state.maximumPeers,
        relay: false
      })
    }

    return this._pool
  }

  connect () {
    if (!this._poolConnected) {
      // connect to the network
      try {
        this.pool.connect()
        this.pool.listen()
        this._poolConnected = true
        this._logger.debug('Connected to network')
      } catch (err) {
        this._logger.error('Error while connecting to network', err)
      }
    } else {
      this._logger.warn('Pool is already connected')
    }
  }

  disconnect () {
    if (this._poolConnected) {
      // connect to the network
      try {
        this.pool.disconnect()
        this._poolConnected = false
        this._logger.debug('Disconnected from network')
      } catch (err) {
        this._logger.error('Error while disconnecting from network', err)
      }
    } else {
      this._logger.warn('Pool was not connected')
    }
  }
}
