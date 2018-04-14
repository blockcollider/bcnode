/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { EventEmitter } = require('events')
const { xprod, equals, all, values } = require('ramda')

const config = require('../../config/config')
const logging = require('../logger')
const { Node } = require('../p2p')
const RoverManager = require('../rover/manager').default
const rovers = require('../rover/manager').rovers
const Server = require('../server/index').default
const PersistenceRocksDb = require('../persistence').RocksDb
const { RpcServer } = require('../rpc/index')
// const { Block } = require('../protos/core_pb')
const { MinerRequest, BlockFingerprint } = require('../protos/miner_pb')
const Miner = require('../miner').Miner

export default class Engine {
  _logger: Object; // eslint-disable-line no-undef
  _node: Node; // eslint-disable-line no-undef
  _persistence: PersistenceRocksDb; // eslint-disable-line no-undef
  _rovers: RoverManager; // eslint-disable-line no-undef
  _rpc: RpcServer; // eslint-disable-line no-undef
  _server: Server; // eslint-disable-line no-undef
  _emitter: EventEmitter; // eslint-disable-line no-undef
  _knownRovers: string[]; // eslint-disable-line no-undef
  _collectedBlocks: Object; // eslint-disable-line no-undef
  _canMine: bool; // eslint-disable-line no-undef
  _miner: Miner; // eslint-disable-line no-undef

  constructor (logger: Object, knownRovers: string[], miner = new Miner()) {
    this._logger = logging.getLogger(__filename)
    this._knownRovers = knownRovers
    this._node = new Node(this)
    this._persistence = new PersistenceRocksDb(config.persistence.path)
    this._rovers = new RoverManager()
    this._emitter = new EventEmitter()
    this._rpc = new RpcServer(this)
    this._server = new Server(this._rpc)
    this._collectedBlocks = {}
    for (let roverName of this._knownRovers) {
      this._collectedBlocks[roverName] = 0
    }
    this._canMine = false
    this._miner = miner
  }

  /**
   * Initialize engine internals
   *
   * - Open database
   * - Store name of available rovers
   */
  async init () {
    const roverNames = Object.keys(rovers)
    try {
      await this._persistence.open()
      const res = await this.persistence.put('rovers', roverNames)
      if (res) {
        this._logger.debug('Stored rovers to persistence')
      }
    } catch (e) {
      this._logger.warn('Could not store rovers to persistence')
    }

    this._logger.info('Engine initialized')
  }

  /**
   * Get node
   * @return {Node}
   */
  get node (): Node {
    return this._node
  }

  /**
   * Get persistence
   * @return {Persistence}
   */
  get persistence (): PersistenceRocksDb {
    return this._persistence
  }

  /**
   * Get rovers manager
   * @returns RoverManager
   */
  get rovers (): RoverManager {
    return this._rovers
  }

  /**
   * Get instance of RpcServer
   * @returns RpcServer
   */
  get rpc (): RpcServer {
    return this._rpc
  }

  /**
   * Get instance of Server (Express on steroids)
   * @returns Server
   */
  get server (): Server {
    return this._server
  }

  /**
   * Start Server
   */
  startNode () {
    this._logger.info('Starting P2P node')
    this.node.start()
  }

  /**
   * Start rovers
   * @param rovers - list (string; comma-delimited) of rover names to start
   */
  startRovers (rovers: string[]) {
    this._logger.info(`Starting rovers '${rovers.join(',')}'`)

    rovers.forEach(name => {
      if (name) {
        this._rovers.startRover(name)
      }
    })

    this._emitter.on('collectBlock', ({ block }) => {
      this._collectedBlocks[block.getBlockchain()] += 1

      if (!this._canMine && all((numCollected: number) => numCollected >= 2, values(this._collectedBlocks))) {
        this._canMine = true
      }

      // start mining only if all known chains are being rovered
      if (this._canMine && equals(new Set(this._knownRovers), new Set(rovers))) {
        const minerRequest = new MinerRequest()
        minerRequest.setMerkleRoot('e3b98a4da31a127d4bde6e43033f66ba274cab0eb7eb1c70ec41402bf6273dd8')

        const getKeys: [string, bool][] = xprod(rovers, ['latest', 'previous']).map(([chain, which]) => ([`${chain}.block.${which}`, which === 'latest']))

        Promise.all(getKeys.map(([key, isLatest]) => {
          return this._persistence.get(key).then(block => {
            this._logger.debug(`Got "${key}"`)
            return new BlockFingerprint([block.getBlockchain(), block.getHash(), block.getTimestamp(), isLatest])
          })
        })).then(blocks => {
          this._logger.debug(`Got ${blocks.length} blocks from persistence`)
          minerRequest.setFingerprintsList(blocks)
          const minerResponse = this._miner.mine(minerRequest)
          this._logger.info(`Mined new block: ${JSON.stringify(minerResponse.toObject(), null, 4)}`)
          // TODO create and broadcast BC block here
        })
      } else {
        if (!this._canMine) {
          this._logger.info(`Not mining because not collected enough blocks from all chains yet (status ${JSON.stringify(this._collectedBlocks)})`)
          return
        }
        this._logger.warn(`Not mining because not all known chains are being rovered (rovered: ${JSON.stringify(rovers)}, known: ${JSON.stringify(this._knownRovers)})`)
      }
    })
  }

  /**
   * Start Server
   *
   * @param opts Options to start server with
   */
  startServer (opts: Object) {
    this.server.run(opts)
  }
}
