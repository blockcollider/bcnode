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
const { uniqBy } = require('ramda')

const debug = require('debug')('bcnode:p2p:node')
const { config } = require('../config')
const { toObject } = require('../helper/debug')
const { getVersion } = require('../helper/version')
const logging = require('../logger')

const { BcBlock } = require('../protos/core_pb')
const { ManagedPeerBook } = require('./book')
const Bundle = require('./bundle').default
const Engine = require('../engine').default
const Signaling = require('./signaling').websocket
const { PeerManager, DATETIME_STARTED_AT } = require('./manager/manager')
const { validateBlockSequence } = require('../bc/validation')
const { Multiverse } = require('../bc/multiverse')
const { BlockPool } = require('../bc/blockpool')
const { blockByTotalDistanceSorter } = require('../bc/helper')

const { PROTOCOL_PREFIX, NETWORK_ID } = require('./protocol/version')

const { PEER_QUORUM_SIZE } = require('./quorum')

export class PeerNode {
  _logger: Object // eslint-disable-line no-undef
  _engine: Engine // eslint-disable-line no-undef
  _interval: IntervalID // eslint-disable-line no-undef
  _bundle: Bundle // eslint-disable-line no-undef
  _manager: PeerManager // eslint-disable-line no-undef
  _peer: PeerInfo // eslint-disable-line no-undef
  _multiverse: Multiverse
  _blockPool: BlockPool

  constructor (engine: Engine) {
    this._engine = engine
    this._multiverse = new Multiverse()
    this._blockPool = new BlockPool(engine._persistence, engine._pubsub)
    this._logger = logging.getLogger(__filename)
    this._manager = new PeerManager(this)

    if (config.p2p.stats.enabled) {
      this._interval = setInterval(() => {
        debug(`Peers count ${this.manager.peerBookConnected.getPeersCount()}`)
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

  get reportSyncPeriod (): Function {
    return this._engine.receiveSyncPeriod
  }

  get blockpool (): BlockPool {
    return this._blockPool
  }

  get multiverse (): Multiverse {
    return this._multiverse
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

        // TODO JSON.stringify?
        pull(pull.values([block.serializeBinary()]), conn)
      })
    })
  }

  // get the best multiverse from all peers
  triggerBlockSync () {
    const peerMultiverses = []
    // Notify miner to stop mining
    this.reportSyncPeriod(true)

    this.peerBook.getAllArray().map(peer => {
      this.manager.createPeer(peer)
        .getMultiverse()
        .then((multiverse) => {
          debug('Got multiverse from peer', peer.id.toB58String(), toObject(multiverse))
          peerMultiverses.push(multiverse)

          if (peerMultiverses.length >= PEER_QUORUM_SIZE) {
            const candidates = peerMultiverses.map((peerMultiverse) => {
              if (peerMultiverse.length > 0 && validateBlockSequence(peerMultiverse)) {
                return peerMultiverse
              } else {
                return null
              }
            }).filter((itm) => {
              return itm !== null
            }) || []

            if (candidates.length >= PEER_QUORUM_SIZE) {
              const uniqueCandidates = uniqBy((candidate) => candidate[0].getHash(), candidates)
              if (uniqueCandidates.length === 1) {
                // TODO: Commit as active multiverse and begin full sync from known peers
              } else {
                const peerMultiverseByDifficultySum = uniqueCandidates
                  .map(peerBlocks => peerBlocks[0])
                  .sort(blockByTotalDistanceSorter)

                const winningMultiverse = peerMultiverseByDifficultySum[0]
                // TODO split the work among multiple correct candidates
                // const syncCandidates = candidates.filter((candidate) => {
                //   if (winner.getHash() === candidate[0].getHash()) {
                //     return true
                //   }
                //   return false
                // })
                const lowestBlock = this.multiverse.getLowestBlock()
                // TODO handle winningMultiverse[0] === undefined, see sentry BCNODE-6F
                if (lowestBlock && lowestBlock.getHash() !== winningMultiverse[0].getHash()) {
                  this._blockPool.maximumHeight = lowestBlock.getHeight()
                  // insert into the multiverse
                  winningMultiverse.map(block => this.multiverse.addBlock(block))
                  // TODO: Use RXP
                  // Report not syncing
                  this.reportSyncPeriod(false)
                }
              }
            }
          }
        })
    })
  }
}

export default PeerNode
