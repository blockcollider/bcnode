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

const { ManagedPeerBook } = require('../book/book')
const { getVersion } = require('../../helper/version')
const { PeerNode } = require('../node')
const logging = require('../../logger')

const { PROTOCOL_PREFIX, NETWORK_ID } = require('../protocol/version')

const BC_P2P_PASSIVE = !!process.env.BC_P2P_PASSIVE

export const DATETIME_STARTED_AT = Date.now()

export class PeerManager {
  _logger: Object // eslint-disable-line no-undef
  _peerBook: ManagedPeerBook // eslint-disable-line no-undef
  _peerBookConnected: ManagedPeerBook // eslint-disable-line no-undef
  _peerBookDiscovered: ManagedPeerBook // eslint-disable-line no-undef
  _peerNode: PeerNode // eslint-disable-line no-undef

  constructor (node: PeerNode) {
    debug('constructor()')
    this._logger = logging.getLogger(__filename)
    this._peerNode = node

    this._peerBook = new ManagedPeerBook(this, 'main')
    this._peerBookConnected = new ManagedPeerBook(this, 'connected')
    this._peerBookDiscovered = new ManagedPeerBook(this, 'discovered')
  }

  get bundle (): Bundle {
    return this._peerNode.bundle
  }

  get engine (): Object {
    return this.peerNode._engine
  }

  get peerBook (): ManagedPeerBook {
    return this._peerBook
  }

  get peerBookConnected (): ManagedPeerBook {
    return this._peerBookConnected
  }

  get peerBookDiscovered (): ManagedPeerBook {
    return this._peerBookDiscovered
  }

  get peerNode (): PeerNode {
    return this._peerNode
  }

  onPeerDiscovery (peer: PeerInfo) {
    const peerId = peer.id.toB58String()
    debug('Event - peer:discovery', peerId)

    if (!this.peerBookDiscovered.has(peer)) {
      // TODO: Meta info ???
      this.peerBookDiscovered.put(peer)
      debug(`Adding newly discovered peer '${peerId}' to discoveredPeerBook, count: ${this.peerBookDiscovered.getPeersCount()}`)
    } else {
      debug(`Discovered peer ${peerId} already in discoveredPeerBook`)
      return
    }

    if (!BC_P2P_PASSIVE && !this.peerBookConnected.has(peer)) {
      debug(`Dialing newly discovered peer ${peerId}`)
      return this.bundle.dial(peer, (err) => {
        if (err) {
          debug(`Error while dialing discovered peer ${peerId}`, err)
          this._logger.warn(`Error while dialing discovered peer ${peerId}`,
            err)
          return err
        }

        this._logger.info(`Discovered peer successfully dialed ${peerId}`)
      })
    }
  }

  onPeerConnect (peer: PeerInfo) {
    const peerId = peer.id.toB58String()
    debug('Event - peer:connect', peerId)

    if (!this.peerBookConnected.has(peer)) {
      this.peerBookConnected.put(peer)
      debug(`Connected new peer '${peerId}', adding to connectedPeerBook, count: ${this.peerBookConnected.getPeersCount()}`)
    } else {
      debug(`Peer '${peerId}', already in connectedPeerBook`)
      return
    }

    this._checkPeerStatus(peer)
  }

  onPeerDisconnect (peer: PeerInfo) {
    const peerId = peer.id.toB58String()
    debug('Event - peer:disconnect', peerId)

    if (this.peerBookConnected.has(peer)) {
      this.peerBookConnected.remove(peer)
      this.engine._emitter.emit('peerDisconnected', { peer })
      debug(`Peer disconnected '${peerId}', removing from connectedPeerBook, count: ${this.peerBookConnected.getPeersCount()}`)
    } else {
      debug(`Peer '${peerId}', already removed from connectedPeerBook`)
    }
  }

  registerProtocols (bundle: Bundle) {
    bundle.handle(`${PROTOCOL_PREFIX}/status`, (protocol, conn) => {
      const status = {
        p2p: {
          networkId: NETWORK_ID
        },
        ts: {
          startedAt: DATETIME_STARTED_AT
        },
        version: {
          protocol: PROTOCOL_PREFIX,
          ...getVersion()
        }
      }

      pull(pull.values([JSON.stringify(status)]), conn)
    })

    //   this.bundle.handle(`${PROTOCOL_PREFIX}/newblock`, (protocol, conn) => {
    //     pull(
    //       conn,
    //       pull.collect((err, wireData) => {
    //         if (err) {
    //           console.log('ERROR _handleMessageNewBlock()', err, wireData)
    //           return
    //         }
    //
    //         try {
    //           const bytes = wireData[0]
    //           const raw = new Uint8Array(bytes)
    //           const block = BcBlock.deserializeBinary(raw)
    //           this._engine.blockFromPeer(block)
    //         } catch (e) {
    //           this._logger.error(`Error decoding block from peer, reason: ${e.message}`)
    //         }
    //       })
    //     )
    //   })
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

            if (this.peerBookConnected.has(peer)) {
              debug('Updating peer with meta/status', peerId)
              const existingPeer = this.peerBookConnected.get(peer)

              const status = JSON.parse(wireData[0])
              existingPeer.meta = mergeDeepRight(meta, status)
            } else {
              debug('Unable to update peer meta/status, not in peerBookConnected', peerId)
            }

            this.engine._emitter.emit('peerConnected', { peer })
          })
        })
      )
    })
  }
}
