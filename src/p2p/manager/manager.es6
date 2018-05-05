/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Bundle } from './../bundle'

const debug = require('debug')('bcnode:p2p:manager')
const { mergeDeepRight } = require('ramda')
const PeerInfo = require('peer-info')
const pull = require('pull-stream')

const { PeerBook } = require('../peer/book')
const { PeerNode } = require('../node')
const logging = require('../../logger')

const { PROTOCOL_PREFIX } = require('../protocol/version')

export class PeerManager {
  _logger: Object // eslint-disable-line no-undef
  _peerBook: PeerBook // eslint-disable-line no-undef
  _peerNode: PeerNode // eslint-disable-line no-undef

  constructor (node: PeerNode) {
    debug('constructor()')
    this._logger = logging.getLogger(__filename)
    this._peerNode = node
    this._peerBook = new PeerBook(this)
  }

  get bundle (): Bundle {
    return this._peerNode.bundle
  }

  get engine (): Object {
    return this.peerNode._engine
  }

  get peerBook (): PeerBook {
    return this._peerBook
  }

  get peerNode (): PeerNode {
    return this._peerNode
  }

  onPeerDiscovery (peer: PeerInfo) {
    const peerId = peer.id.toB58String()
    debug('Event - peer:discovery', peerId)

    if (this.peerBook.has(peer) && this.peerBook.get(peer).meta) {
      debug(`Discovered peer ${peerId} already in PeerBook`)
      // console.log(this.peerBook.get(peer))
      return
    }

    return this.bundle.dial(peer, (err) => {
      if (err) {
        debug(`Error while dialing discovered peer ${peerId}`, err)
        this._logger.warn(`Error while dialing discovered peer ${peerId}`, err)
        return err
      }

      this._logger.info(`Discovered peer successfully dialed ${peerId}`)
      this._checkPeerStatus(peer)
    })
  }

  onPeerConnect (peer: PeerInfo) {
    const peerId = peer.id.toB58String()
    debug('Event - peer:connect', peerId)

    // FIXME: This should be done as part of discovery, not after ANOTHER CLIENT CONNECTED TO US
    // this.checkPeerStatus(peer)
  }

  onPeerDisconnect (peer: PeerInfo) {
    const peerId = peer.id.toB58String()
    debug('Event - peer:disconnect', peerId)
    // wait for 1s for both libp2p-switch/dial and libp2p-switch/connection muxedConn `close` handlers
    // to finish
    setTimeout(() => {
      if (this.peerBook.has(peer)) {
        this._logger.info('Peer disconnected', peerId)
        this.peerBook.remove(peer)
      }
      this.engine._emitter.emit('peerDisconnected', { peer })
    }, 1000)
  }

  _checkPeerStatus (peer: PeerInfo) {
    const peerId = peer.id.toB58String()
    debug('Checking peer status', peerId)

    const meta = {
      ts: {
        connectedAt: Date.now()
      }
    }

    debug('Dialing /status protocol', peerId)
    this.bundle.dialProtocol(peer, `${PROTOCOL_PREFIX}/status`, (err, conn) => {
      const peerId = peer.id.toB58String()

      if (err) {
        debug('Error dialing /status protocol', peerId, err)
        this._logger.error('Error dialing /status protocol', peerId)
        throw err
      }

      debug('Pulling latest /status', peerId)
      pull(
        conn,
        pull.collect((err, wireData) => {
          if (err) {
            debug('Error pulling latest /status', peerId, err)
            throw err
          }

          debug('Getting latest peer info', peerId)
          conn.getPeerInfo((err, peerInfo) => {
            if (err) {
              debug('Error getting latest peer info', peerId, err)
              throw err
            }

            debug('Updating peer with meta/status', peerId)

            const status = JSON.parse(wireData[0])
            peerInfo.meta = mergeDeepRight(meta, status)
            // this.peerBook.put(peerInfo)

            this.engine._emitter.emit('peerConnected', { peer })
          })
        })
      )
    })
  }
}
