/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const merge = require('deepmerge')
const { inspect } = require('util')

const PeerInfo = require('peer-info')
const waterfall = require('async/waterfall')
const pull = require('pull-stream')

const config = require('../../config/config')
const { getVersion } = require('../helper/version')
const logging = require('../logger')

const { BcBlock } = require('../protos/core_pb')
const { BcPeerBook } = require('./peer/book')
const { Blacklist } = require('./blacklist')
const BLACKLIST_REASON = require('./blacklist').REASON
const Bundle = require('./bundle').default
const Engine = require('../engine').default
const Signaling = require('./signaling').websocket

const PROTOCOL_VERSION = '0.0.1'
const PROTOCOL_PREFIX = `/bc/${PROTOCOL_VERSION}`
const NETWORK_ID = 1

const DATETIME_NOW = Date.now()

// const debug = require('debug')('p2p')('node')

// type StatusMsg = {
//   networkId: number,
//   peerId: ?string,
// }

export default class Node {
  _logger: Object // eslint-disable-line no-undef
  _engine: Engine // eslint-disable-line no-undef
  _blacklist: Blacklist // eslint-disable-line no-undef
  _interval: IntervalID // eslint-disable-line no-undef
  _peers: BcPeerBook // eslint-disable-line no-undef
  _node: Bundle // eslint-disable-line no-undef

  constructor (engine: Engine) {
    this._engine = engine
    this._logger = logging.getLogger(__filename)
    this._blacklist = new Blacklist(this)
    this._peers = new BcPeerBook()

    if (config.p2p.stats.enabled) {
      this._interval = setInterval(() => {
        this._logger.info(`Peers count ${this._peers.getPeersCount()}`)
      }, config.p2p.stats.interval * 1000)
    }
  }

  get node (): Bundle {
    return this._node
  }

  start () {
    const pipeline = [
      // Create peer info
      (cb) => {
        this._logger.info('Creating local peer info')
        PeerInfo.create(cb)
      },

      // Join p2p network
      (peerInfo, cb) => {
        const peerId = peerInfo.id.toB58String()
        this._logger.info(`Joining p2p network as peer ${peerId}`)

        peerInfo.multiaddrs.add(Signaling.getAddress(peerInfo))
        peerInfo.multiaddrs.add(`/ip4/0.0.0.0/tcp/0/ipfs/${peerId}`)

        const opts = {
          signaling: Signaling
        }
        this._node = new Bundle(peerInfo, this._peers, opts)

        this._node.start((err) => {
          if (err) {
            return cb(err)
          }

          this._registerEventHandlers()
          this._registerMessageHandlers()

          cb(null)
        })
      }
    ]

    waterfall(pipeline, (err) => {
      if (err) {
        this._logger.error(err)
        throw err
      }

      // if (this._peers.getPeersCount() >= PEERS_MAX_COUNT) {
      //   return
      // }

      /**
       * Peer discovered
       */
      this._node.on('peer:discovery', (peer) => {
        if (this._peers.has(peer)) {
          return
        }

        const peerId = peer.id.toB58String()
        if (this._blacklist.isBlacklisted(peer)) {
          this._logger.info(`User is blacklisted ${peerId}`)
          return
        }

        this._logger.info(`Peer discovered ${peerId}`)
        return this._node.dial(peer, (err) => {
          if (err) {
            this._logger.warn(`Error while dialing discovered peer ${peerId}`)
            throw err
          }
        })
      })

      /**
       * Peer connected
       */
      this._node.on('peer:connect', (peer) => {
        if (err) {
          this._logger.error(err)
          throw err
        }

        const peerId = peer.id.toB58String()
        const peerAddr = peer._connectedMultiaddr
        if (!peerAddr.toString().endsWith(`/ipfs/${peerId}`)) {
          return
        }

        this._logger.info(`Peer connected ${peerId}`)
        this._node.dialProtocol(peer, `${PROTOCOL_PREFIX}/status`, (err, conn) => {
          if (err) {
            this._node.hangUp(peer, () => {
              this._logger.error(`${peerId} disconnected, reason: ${err.message}`)
            })
          }

          const meta = {
            p2p: {
              networkId: NETWORK_ID
            },
            ts: {
              startedAt: DATETIME_NOW
            },
            version: {
              protocol: PROTOCOL_PREFIX,
              ...getVersion()
            }
          }

          pull(pull.values([JSON.stringify(meta)]), conn)
        })
      })

      /**
       * Peer disconnected
       */
      this._node.on('peer:disconnect', (peer) => {
        if (!this._peers.has(peer)) {
          return
        }

        this._node.hangUp(peer, (err) => {
          this._engine._emitter.emit('peerDisconnected', { peer })

          if (err) {
            // this._logger.error(`${peer.id.toB58String()} disconnected, reason: ${err.message}`)
            throw err
          }

          if (this._peers.has(peer)) {
            this._logger.info('Peer disconnected', peer.id.toB58String())
            this._peers.remove(peer)
          }
        })
      })
    })

    return true
  }

  broadcastNewBlock (method: string, block: BcBlock) {
    this._logger.debug(`Broadcasting msg to peers, ${inspect(block.toObject())}`)

    const url = `${PROTOCOL_PREFIX}/${method}`
    this._peers.getAllArray().map(peer => {
      this._logger.debug(`Sending to peer ${peer}`)
      this._node.dialProtocol(peer, url, (err, conn) => {
        if (err) {
          this._logger.error('Error sending message to peer', peer, err)
        }

        pull(pull.values([block.serializeBinary()]), conn)
      })
    })
  }

  // _handleEventPeerConnect (peer: Object) {
  //   this._logger.debug('Connection established:', peer.id.toB58String())
  //   this._node.dialProtocol(peer, `${PROTOCOL_PREFIX}/status`, (err, conn) => {
  //     if (err) {
  //       this._node.hangUp(peer, () => {
  //         this._logger.error(`${peer.id.toB58String()} disconnected, reason: ${err.message}`)
  //       })
  //     }
  //     const msg = this._statusMsg
  //     msg.peerId = peer.id.toB58String()
  //     pull(pull.values([JSON.stringify(msg)]), conn)
  //   })
  // }
  //
  // _handleEventPeerDisconnect (peer: Object) {
  //   try {
  //     this._peers.remove(peer)
  //     this._logger.info(`Peer ${peer.id.toB58String()} disconnected, removed from book`)
  //     this._engine._emitter.emit('peerDisconnected', { peer })
  //   } catch (e) {
  //     this._logger.warn(`Unable to remove peer from peer book, reason: ${e.message}`)
  //   }
  // }
  //
  // _handleEventPeerDiscovery (peer: Object) {
  //   this._logger.info(`Discovered: ${peer.id.toB58String()}`)
  //   this._node.dial(peer, (err) => {
  //     if (err) {
  //       this._logger.warn(`Error while dialing discovered peer ${peer.id.toB58String()}`)
  //     }
  //   })
  // }

  _handleMessageNewBlock (protocol: Object, conn: Object) {
    pull(
      conn,
      pull.collect((err, wireData) => {
        if (err) {
          console.log('ERROR _handleMessageNewBlock()', err, wireData)
          return
        }

        try {
          const bytes = wireData[0]
          const raw = new Uint8Array(bytes)
          const block = BcBlock.deserializeBinary(raw)
          this._logger.info('Received new block from peer', block.toObject())
        } catch (e) {
          this._logger.error(`Error decoding block from peer, reason: ${e.message}`)
        }
      })
    )
  }

  _handleMessageStatus (protocol: Object, conn: Object) {
    pull(
      conn,
      pull.collect((err, wireData) => {
        if (err) {
          this._logger.warn('Error while processing status')
          return
        }

        conn.getPeerInfo((err, peer) => {
          if (err) {
            this._logger.error(`Cannot get peer info ${err}`)
            return
          }

          const peerId = peer.id.toB58String()
          const meta = JSON.parse(wireData.toString())
          try {
            const { p2p: { networkId } } = meta
            if (networkId !== NETWORK_ID) {
              this._blacklist.add(peer, BLACKLIST_REASON.PROTOCOL_OLD_VERSION)
              this._logger.warn(`Disconnecting peer ${peerId} - network id mismatch ${networkId} / ${NETWORK_ID}`)
              this._node.hangUp(peer, () => {
                this._logger.debug(`${peerId} disconnected`)
              })
              return
            }
          } catch (err) {
            this._logger.error('Error while parsing data')
            console.log(err)
            return
          }

          peer.meta = merge(meta, {
            ts: {
              connectedAt: Date.now()
            }
          })
          console.log('PARSED_META', peer.meta)

          this._peers.put(peer)
          this._logger.info(`Status handled successfully, added peer ${peerId}`)
          this._engine._emitter.emit('peerConnected', { peer })
        })
      })
    )
  }

  _registerEventHandlers () {
    // this._node.on('peer:discovery', (peer) => this._handleEventPeerDiscovery(peer))
    // this._node.on('peer:connect', (peer) => this._handleEventPeerConnect(peer))
    // this._node.on('peer:disconnect', (peer) => this._handleEventPeerDisconnect(peer))
  }

  _registerMessageHandlers () {
    this._node.handle(`${PROTOCOL_PREFIX}/newblock`, (protocol, conn) => this._handleMessageNewBlock(protocol, conn))
    this._node.handle(`${PROTOCOL_PREFIX}/status`, (protocol, conn) => this._handleMessageStatus(protocol, conn))
  }
}
