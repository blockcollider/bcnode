/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { EventEmitter } = require('events')
const { xprod, equals, all, values, filter, reject, addIndex } = require('ramda')

const config = require('../../config/config')
const { debugSaveObject } = require('../debug')
const logging = require('../logger')
const { Monitor } = require('../monitor')
const { Node } = require('../p2p')
const RoverManager = require('../rover/manager').default
const rovers = require('../rover/manager').rovers
const Server = require('../server/index').default
const PersistenceRocksDb = require('../persistence').RocksDb
const { RpcServer } = require('../rpc/index')
const { prepareWork, prepareNewBlock, mine } = require('../miner/miner')
const { getGenesisBlock } = require('../miner/genesis')
const { BcBlock } = require('../protos/core_pb')
const { errToObj } = require('../helper/error')

const DATA_DIR = process.env.BC_DATA_DIR || config.persistence.path
const MONITOR_ENABLED = process.env.BC_MONITOR === 'true'

export default class Engine {
  _logger: Object; // eslint-disable-line no-undef
  _monitor: Monitor; // eslint-disable-line no-undef
  _node: Node; // eslint-disable-line no-undef
  _persistence: PersistenceRocksDb; // eslint-disable-line no-undef
  _rovers: RoverManager; // eslint-disable-line no-undef
  _rpc: RpcServer; // eslint-disable-line no-undef
  _server: Server; // eslint-disable-line no-undef
  _emitter: EventEmitter; // eslint-disable-line no-undef
  _knownRovers: string[]; // eslint-disable-line no-undef
  _minerKey: string; // eslint-disable-line no-undef
  _collectedBlocks: Object; // eslint-disable-line no-undef
  _canMine: bool; // eslint-disable-line no-undef
  _mining: bool;

  constructor (logger: Object, opts: { rovers: string[], minerKey: string}) {
    this._logger = logging.getLogger(__filename)
    this._knownRovers = opts.rovers
    this._minerKey = opts.minerKey
    this._monitor = new Monitor(this, {})
    this._node = new Node(this)
    this._persistence = new PersistenceRocksDb(DATA_DIR)
    this._rovers = new RoverManager()
    this._emitter = new EventEmitter()
    this._rpc = new RpcServer(this)
    this._server = new Server(this._rpc)
    this._collectedBlocks = {}
    for (let roverName of this._knownRovers) {
      this._collectedBlocks[roverName] = 0
    }
    this._canMine = false
    this._mining = false
  }

  /**
   * Initialize engine internals
   *
   * - Open database
   * - Store name of available rovers
   */
  async init () {
    const roverNames = Object.keys(rovers)
    // TODO get from CLI / config
    const minerPublicAddress = this._minerKey
    try {
      await this._persistence.open()
      const res = await this.persistence.put('rovers', roverNames)
      if (res) {
        this._logger.debug('Stored rovers to persistence')
      }
      try {
        await this.persistence.get('bc.block.1')
        this._logger.debug('Genesis block present, everything ok')
      } catch (_) { // genesis block not found
        const newGenesisBlock = getGenesisBlock(minerPublicAddress)
        try {
          await this.persistence.put('bc.block.1', newGenesisBlock)
          await this.persistence.put('bc.block.latest', newGenesisBlock)
          this._logger.debug('Genesis block was missing so we stored it')
        } catch (e) {
          this._logger.error(`Error while creating genesis block ${e.message}`)
          process.exit(1)
        }
      }
    } catch (e) {
      this._logger.warn(`Could not store rovers to persistence, reason ${e.message}`)
    }

    if (MONITOR_ENABLED) {
      this._monitor.start()
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
      process.nextTick(() => {
        this.collectBlock(rovers, block)
      })
    })
  }

  collectBlock (rovers: string[], block: BcBlock) {
    this._collectedBlocks[block.getBlockchain()] += 1

    if (!this._canMine && all((numCollected: number) => numCollected >= 2, values(this._collectedBlocks))) {
      this._canMine = true
    }

    // start mining only if all known chains are being rovered
    if (this._canMine && !this._mining && equals(new Set(this._knownRovers), new Set(rovers))) {
      const getKeys: string[] = rovers.map(chain => `${chain}.block.latest`)

      Promise.all(getKeys.map((key) => {
        return this._persistence.get(key).then(block => {
          this._logger.debug(`Got "${key}"`)
          return block
        })
      })).then(currentBlocks => {
        this._logger.debug(`Got ${currentBlocks.length} blocks from persistence`)
        return this._persistence.get('bc.block.latest').then(bcBlock => {
          return [currentBlocks, bcBlock]
        })
      }).then(([currentBlocks, previousBcBlock]) => {
        this._logger.debug(`Starting mining now`)
        const work = prepareWork(previousBcBlock, currentBlocks)
        const newBlock = prepareNewBlock(
          previousBcBlock,
          previousBcBlock.getChildBlockHeadersList(),
          currentBlocks,
          block,
          [], // TODO add transactions
          this._minerKey
        )

        this._mining = true
        const solution = mine(
          work,
          this._minerKey,
          newBlock.getMerkleRoot(),
          newBlock.getDifficulty()
        )
        this._mining = false

        // Set timestamp after mining
        newBlock.setTimestamp(Date.now() / 1000 << 0)
        // $FlowFixMe - add annotation to mine method
        newBlock.setDistance(solution.distance)
        // $FlowFixMe - add annotation to mine method
        newBlock.setNonce(solution.nonce)

        return this._processMinedBlock(newBlock)
      }).catch(e => {
        const reason = JSON.stringify(errToObj(e), null, 2)
        this._logger.error(`Mining failed, reason: ${reason}`)
        this._mining = false
      })
    } else {
      if (!this._canMine) {
        this._logger.info(`Not mining because not collected enough blocks from all chains yet (status ${JSON.stringify(this._collectedBlocks)})`)
        return
      }
      if (!this._mining) {
        this._logger.info('Not starting mining new block while already mining one')
        return
      }
      this._logger.warn(`Not mining because not all known chains are being rovered (rovered: ${JSON.stringify(rovers)}, known: ${JSON.stringify(this._knownRovers)})`)
    }
  }

  /**
   * Start Server
   *
   * @param opts Options to start server with
   */
  startServer (opts: Object) {
    this.server.run(opts)
  }

  requestExit () {
    return this._rovers.killRovers()
  }

  _broadcastMinedBlock (newBlock: BcBlock): Promise<*> {
    this._logger.info('Broadcasting mined block')

    const method = 'newblock'
    this.node.broadcastNewBlock(method, newBlock)

    return Promise.resolve(true)
  }

  _processMinedBlock (newBlock: BcBlock): Promise<*> {
    const newBlockObj = newBlock.toObject()
    this._logger.info(`Mined new block: ${JSON.stringify(newBlockObj, null, 2)}`)
    debugSaveObject(`bc/block/${newBlockObj.timestamp}-${newBlockObj.hash}.json`, newBlockObj)

    const tasks = [
      // FIXME: This collides with genesis block
      // this.persistence.put('bc.block.latest', newBlock),
      this.persistence.put(`bc.block.${newBlock.getHeight()}`, newBlock)
    ]

    return Promise.all(tasks)
      .then(() => {
        this._logger.info('New BC block stored in DB')

        // TODO broadcast BC block here
        return this._broadcastMinedBlock(newBlock)
      })
      .catch((err) => {
        this._logger.error(`Unable to store BC block in DB, reason: ${err.message}`)
      })
  }
}
