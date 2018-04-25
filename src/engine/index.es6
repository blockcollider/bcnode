/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { EventEmitter } = require('events')
const { equals, all, values, fromPairs } = require('ramda')

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
const { prepareWork, prepareNewBlock, mine } = require('../bc/miner')
const { getGenesisBlock } = require('../bc/genesis')
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
    this._server = new Server(this, this._rpc)
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
        try {
          const newGenesisBlock = getGenesisBlock()
          await this.persistence.put('bc.block.1', newGenesisBlock)
          await this.persistence.put('bc.block.latest', newGenesisBlock)
          this._logger.debug('Genesis block was missing so we stored it')
        } catch (e) {
          this._logger.error(`Error while creating genesis block ${e.message}`)
          this.requestExit()
          process.exit(1)
        }
      }
    } catch (e) {
      this._logger.warn(`Could not store rovers to persistence, reason ${e.message}`)
    }

    if (MONITOR_ENABLED) {
      this._monitor.start()
    }

    this._logger.debug('Engine initialized')
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

    this._emitter.on('peerConnected', ({ peer }) => {
      if (this._server) {
        this._server._wsBroadcastPeerConnected(peer)
      }
    })

    this._emitter.on('peerDisconnected', ({ peer }) => {
      if (this._server) {
        this._server._wsBroadcastPeerDisonnected(peer)
      }
    })
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
        this.collectBlock(rovers, block).then(() => {
          this._logger.debug('Success in collectBlock event handler')
          this._mining = false
        }).catch(err => {
          const reason = JSON.stringify(errToObj(err), null, 2)
          this._logger.error(`Mining failed, reason: ${reason}`)
          this._mining = false
        })
      })
    })
  }

  async collectBlock (rovers: string[], block: BcBlock) {
    this._collectedBlocks[block.getBlockchain()] += 1

    if (!this._canMine && all((numCollected: number) => numCollected >= 2, values(this._collectedBlocks))) {
      this._canMine = true
    }

    // start mining only if all known chains are being rovered
    if (this._canMine && !this._mining && equals(new Set(this._knownRovers), new Set(rovers))) {
      this._mining = true
      let currentBlocks
      let lastPreviousBlock
      let previousBcBlocks

      // get latest block from each child blockchain
      try {
        const getKeys: string[] = rovers.map(chain => `${chain}.block.latest`)
        currentBlocks = await Promise.all(getKeys.map((key) => {
          return this._persistence.get(key).then(block => {
            this._logger.debug(`Got "${key}"`)
            return block
          })
        }))
        this._logger.debug(`Got ${currentBlocks.length} blocks from persistence`)
      } catch (err) {
        this._logger.warn(`Error while getting current blocks, reason: ${err.message}`)
        throw err
      }

      // get latest known BC block
      try {
        lastPreviousBlock = await this._persistence.get('bc.block.latest')
        this._logger.debug(`Got last previous block (height: ${lastPreviousBlock.getHeight()}) from persistence`)
      } catch (err) {
        this._logger.warn(`Error while getting last previous BC block, reason: ${err.message}`)
        throw err
      }

      // get BC blocks to get timestamp for timeBonus calculation for
      try {
        const lastChildBlockHeaders = lastPreviousBlock.getChildBlockHeadersList()
        const lastBcBlockKeys = lastChildBlockHeaders.map(block => {
          const height = lastPreviousBlock.getHeight() - block.getChildBlockConfirmationsInParentCount() + 1
          return `bc.block.${height}`
        })
        this._logger.debug(`Getting previous bc blocks with keys: ${JSON.stringify(lastBcBlockKeys)}`)
        const blocks = await Promise.all(lastBcBlockKeys.map(key => this._persistence.get(key)))
        previousBcBlocks = fromPairs(blocks.map((block, idx) => ([lastChildBlockHeaders[idx].getBlockchain(), block])))
        this._logger.debug(`Successfuly got ${blocks.length} previous bc blocks with keys: ${JSON.stringify(lastBcBlockKeys)}`)
      } catch (err) {
        this._logger.warn(`Error while getting one or more previous BC blocks, reason: ${err.message}`)
        throw err
      }

      this._logger.debug(`Preparing new block `)

      const currentTimestamp = (Date.now() / 1000) << 0
      const work = prepareWork(lastPreviousBlock, currentBlocks)
      const newBlock = prepareNewBlock(
        currentTimestamp,
        lastPreviousBlock,
        previousBcBlocks,
        currentBlocks,
        block,
        [], // TODO add transactions
        this._minerKey
      )

      this._logger.debug(`Mining with work: "${work}", difficutly: ${newBlock.getDifficulty()}, ${JSON.stringify(this._collectedBlocks, null, 2)}`)

      const solution = mine(
        currentTimestamp,
        work,
        this._minerKey,
        newBlock.getMerkleRoot(),
        newBlock.getDifficulty()
      )

      // Set timestamp after mining
      newBlock.setTimestamp(currentTimestamp)
      newBlock.setDistance(solution.distance)
      newBlock.setNonce(solution.nonce)

      return this._processMinedBlock(newBlock)
    } else {
      if (!this._canMine) {
        this._logger.info(`Not mining because not collected enough blocks from all chains yet - ${JSON.stringify(this._collectedBlocks, null, 2)}`)
        return
      }
      if (!this._mining) {
        this._logger.debug('Not starting mining new block while already mining one')
        return
      }
      this._logger.debug(`Not mining because not all known chains are being rovered (rovered: ${JSON.stringify(rovers)}, known: ${JSON.stringify(this._knownRovers)})`)
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
        this._logger.debug('New BC block stored in DB')

        // TODO broadcast BC block here
        return this._broadcastMinedBlock(newBlock)
      })
      .catch((err) => {
        this._logger.error(`Unable to store BC block in DB, reason: ${err.message}`)
      })
  }
}
