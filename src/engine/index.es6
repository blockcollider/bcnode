/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { EventEmitter } = require('events')

const config = require('../../config/config')
const logging = require('../logger')
const { Node } = require('../p2p')
const RoverManager = require('../rover/manager').default
const rovers = require('../rover/manager').rovers
const Server = require('../server/index').default
const PersistenceRocksDb = require('../persistence').RocksDb
const { RpcServer } = require('../rpc/index')
// const { Block } = require('../protos/core_pb')
const { BlockIn, BlockchainHash } = require('../protos/miner_pb')
const Miner = require('../miner').MinerNative

export default class Engine {
  _logger: Object; // eslint-disable-line no-undef
  _node: Node; // eslint-disable-line no-undef
  _persistence: PersistenceRocksDb; // eslint-disable-line no-undef
  _rovers: RoverManager; // eslint-disable-line no-undef
  _rpc: RpcServer; // eslint-disable-line no-undef
  _server: Server; // eslint-disable-line no-undef
  _emitter: EventEmitter; // eslint-disable-line no-undef

  constructor (logger: Object) {
    this._logger = logging.getLogger(__filename)
    this._node = new Node(this)
    this._persistence = new PersistenceRocksDb(config.persistence.path)
    this._rovers = new RoverManager()
    this._emitter = new EventEmitter()
    this._rpc = new RpcServer(this)
    this._server = new Server(this._rpc)
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

    const blocks = {
      btc: '00000000000000000026651a7e8638c65ec69991d8f5e437ee54867adbf07c49',
      eth: '0x63ef70aa2161f7e23f35996c1f420c8b24a67be231b2ec9147477f6c4c3d868e',
      neo: '0x27a022e66691fc40d264ef615cd1299c9247814fde451390c602160ae954881b',
      wav: '2YzcfeKZW65PvzQP42ocD6XYJMKibRrj2xcvJJwZTqnmrhCyj4TZBymNmh9FAFXBaghvfGbGmpUvg5DjQ5xS3W6C',
      lsk: '4571951483005954606'
    }

    this._emitter.on('collectBlock', ({ block }) => {
      blocks[block.getBlockchain()] = block.getHash()

      const blockIn = new BlockIn()

      blockIn.setThreshold(0.5)
      const hashes = [
        new BlockchainHash(['btc', blocks.btc]),
        new BlockchainHash(['eth', blocks.eth]),
        new BlockchainHash(['neo', blocks.neo]),
        new BlockchainHash(['wav', blocks.wav]),
        new BlockchainHash(['lsk', blocks.lsk])
      ]
      blockIn.setHashesList(hashes)

      const miner = new Miner()
      const blockOut = miner.mine(blockIn)
      this._logger.info(`Mined new block: ${JSON.stringify(blockOut.toObject(), null, 4)}`)
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
