/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { inspect } = require('util')

const PeerInfo = require('peer-info')
const waterfall = require('async/waterfall')
const pull = require('pull-stream')

const debug = require('debug')('bcnode:p2p:node')
const config = require('../../config/config')
const { getVersion } = require('../helper/version')
const logging = require('../logger')

const { BcBlock } = require('../protos/core_pb')
const { ManagedPeerBook } = require('./book')
const Bundle = require('./bundle').default
const Engine = require('../engine').default
const Signaling = require('./signaling').websocket
const { PeerManager, DATETIME_STARTED_AT } = require('./manager/manager')

const { PROTOCOL_PREFIX, NETWORK_ID } = require('./protocol/version')

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
        this._logger.info(`Peers count ${this.manager.peerBookConnected.getPeersCount()}`)
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

  get peerBook (): ManagedPeerBook {
    return this.manager.peerBook
  }

  _pipelineStartNode () {
    debug('_pipelineStartNode')

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

        peerInfo.meta = {
          p2p: {
            networkId: NETWORK_ID
          },
          ts: {
            connectedAt: DATETIME_STARTED_AT,
            startedAt: DATETIME_STARTED_AT
          },
          version: {
            protocol: PROTOCOL_PREFIX,
            ...getVersion()
          }
        }
        this._peer = peerInfo

        cb(null, peerInfo)
      },

      // Create node
      (peerInfo: PeerInfo, cb: Function) => {
        this._logger.info('Creating P2P node')
        const opts = {
          signaling: Signaling.initialize(peerInfo),
          relay: false
        }
        this._bundle = new Bundle(peerInfo, this.peerBook, opts)

        cb(null, this._bundle)
      },

      // Start node
      (bundle: Object, cb: Function) => {
        this._logger.info('Starting P2P node')

        bundle.start((err) => {
          cb(err, bundle)
        })
      },

      // Register event handlers
      (bundle: Object, cb: Function) => {
        this._logger.info('Registering event handlers')

        this.bundle.on('peer:discovery', (peer) => {
          return this.manager.onPeerDiscovery(peer)
        })

        this.bundle.on('peer:connect', (peer) => {
          return this.manager.onPeerConnect(peer)
        })

        this.bundle.on('peer:disconnect', (peer) => {
          return this.manager.onPeerDisconnect(peer)
        })

        cb(null)
      },

      // Register protocols
      (cb: Function) => {
        this._logger.info('Registering protocols')
        this.manager.registerProtocols(this.bundle)
        cb(null)
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
