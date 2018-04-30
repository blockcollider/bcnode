/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { inspect } = require('util')

const { mergeDeepRight } = require('ramda')
const PeerInfo = require('peer-info')
const waterfall = require('async/waterfall')
const pull = require('pull-stream')

const config = require('../../config/config')
const { getVersion } = require('../helper/version')
const logging = require('../logger')

const { BcBlock } = require('../protos/core_pb')
const { PeerBook } = require('./book')
const Bundle = require('./bundle').default
const Engine = require('../engine').default
const Signaling = require('./signaling').websocket
const PeerManager = require('./manager').PeerManager

const PROTOCOL_VERSION = '0.0.1'
const PROTOCOL_PREFIX = `/bc/${PROTOCOL_VERSION}`
const NETWORK_ID = 1

const DATETIME_NOW = Date.now()

// const debug = require('debug')('p2p')('node')

// type StatusMsg = {
//   networkId: number,
//   peerId: ?string,
// }

export class PeerNode {
  _logger: Object // eslint-disable-line no-undef
  _engine: Engine // eslint-disable-line no-undef
  _interval: IntervalID // eslint-disable-line no-undef
  _bundle: Bundle // eslint-disable-line no-undef
  _manager: PeerManager // eslint-disable-line no-undef
  _peer: PeerInfo // eslint-disable-line no-undef

  constructor (engine: Engine) {
    this._engine = engine
    this._logger = logging.getLogger(__filename)
    this._manager = new PeerManager(this)

    if (config.p2p.stats.enabled) {
      this._interval = setInterval(() => {
        this._logger.info(`Peers count ${this.peerBook.getPeersCount()}`)
      }, config.p2p.stats.interval * 1000)
    }
  }

  get bundle (): Bundle {
    return this._bundle
  }

  get manager (): PeerManager {
    return this._manager
  }

  get peer (): PeerInfo {
    return this._peer
  }

  get peerBook (): PeerBook {
    return this.manager.peerBook
  }

  _pipelineStartNode () {
    return [
      // Create PeerInfo for local node
      (cb: Function) => {
        this._logger.info('Generating peer info')
        PeerInfo.create(cb)
      },

      // Join p2p network
      (peerInfo: PeerInfo, cb: Function) => {
        const peerId = peerInfo.id.toB58String()
        this._logger.info(`Registering addresses for ${peerId}`)

        peerInfo.multiaddrs.add(Signaling.getAddress(peerInfo))
        peerInfo.multiaddrs.add(`/ip4/0.0.0.0/tcp/0/ipfs/${peerId}`)

        this._peer = peerInfo

        cb(null, peerInfo)
      },

      // Crate node
      (peerInfo: PeerInfo, cb: Function) => {
        this._logger.info('Creating P2P node')
        const opts = {
          signaling: Signaling.initialize(peerInfo),
          relay: false
        }
        this._bundle = new Bundle(peerInfo, this.peerBook, opts)

        cb(null, this._bundle)
      },

      // Register event handlers
      (bundle: Object, cb: Function) => {
        this._logger.info('Registering event handlers')

        this.bundle.on('peer:discovery', (peer) => {
          const peerId = peer.id.toB58String()
          console.log('Event - peer:discovery', peerId)

          if (this.peerBook.has(peer)) {
            console.log(`Discovered peer ${peerId} already in PeerBook`)
            // console.log(this.peerBook.get(peer))
            return
          }

          this.bundle.dial(peer, (err) => {
            if (err) {
              this._logger.warn(`Error while dialing discovered peer ${peerId}`)
              return err
            }

            console.log(`Discovered peer successfully dialed ${peerId}`)
          })
        })

        this.bundle.on('peer:connect', (peer) => {
          const peerId = peer.id.toB58String()
          console.log('Event - peer:connect', peerId)

          const meta = {
            ts: {
              connectedAt: Date.now()
            }
          }

          this.bundle.dialProtocol(peer, `${PROTOCOL_PREFIX}/status`, (err, conn) => {
            if (err) {
              console.log('ERROR', err)
              throw err
            }

            pull(
              conn,
              pull.collect((err, wireData) => {
                if (err) {
                  throw err
                }

                const status = JSON.parse(wireData[0])
                peer.meta = mergeDeepRight(meta, status)

                this._engine._emitter.emit('peerConnected', { peer })
              })
            )
          })
        })

        this.bundle.on('peer:disconnect', (peer) => {
          console.log('Event - peer:disconnect', peer.id.toB58String())

          if (this.peerBook.has(peer)) {
            this.peerBook.remove(peer)
          }

          this._engine._emitter.emit('peerDisconnected', { peer })
        })

        cb(null)
      },

      // Register protocols
      (cb: Function) => {
        this._logger.info('Registering protocols')

        this.bundle.handle(`${PROTOCOL_PREFIX}/status`, (protocol, conn) => {
          const status = {
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

          pull(pull.values([JSON.stringify(status)]), conn)
        })

        this.bundle.handle(`${PROTOCOL_PREFIX}/newblock`, (protocol, conn) => {
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
        })

        cb(null)
      },

      // Start node
      (cb: Function) => {
        this._logger.info('Starting P2P node')

        this.bundle.start((err) => { cb(err, this.bundle) })
      }
    ]
  }

  start () {
    waterfall(this._pipelineStartNode(), (err) => {
      if (err) {
        this._logger.error(err)
        throw err
      }

      this._logger.info('P2P node started')
    })

    return true
  }

  broadcastNewBlock (block: BcBlock) {
    this._logger.debug(`Broadcasting msg to peers, ${inspect(block.toObject())}`)

    const url = `${PROTOCOL_PREFIX}/newblock`
    this.peerBook.getAllArray().map(peer => {
      this._logger.debug(`Sending to peer ${peer}`)
      this.bundle.dialProtocol(peer, url, (err, conn) => {
        if (err) {
          this._logger.error('Error sending message to peer', peer.id.toB58String(), err)
          return err
        }

        pull(pull.values([block.serializeBinary()]), conn)
      })
    })
  }
}

export default PeerNode
