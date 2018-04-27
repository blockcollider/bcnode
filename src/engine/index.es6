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
const { fork, ChildProcess } = require('child_process')
const { resolve } = require('path')

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
const { prepareWork, prepareNewBlock } = require('../bc/miner')
const { getGenesisBlock } = require('../bc/genesis')
const { BcBlock } = require('../protos/core_pb')
const { errToObj } = require('../helper/error')
const { getVersion } = require('../helper/version')
const ts = require('../utils/time').default // ES6 default export

const DATA_DIR = process.env.BC_DATA_DIR || config.persistence.path
const MONITOR_ENABLED = process.env.BC_MONITOR === 'true'
const MINER_WORKER_PATH = resolve(__filename, '..', '..', 'bc', 'miner_worker.js')

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
  _workerProcess: ?ChildProcess
  _unfinishedBlock: ?BcBlock

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
    // Start NTP sync
    ts.start()
  }

  /**
   * Initialize engine internals
   *
   * - Open database
   * - Store name of available rovers
   */
  async init () {
    const roverNames = Object.keys(rovers)
    const { npm, git: { long } } = getVersion()
    const versionData = {
      version: npm,
      commit: long,
      db_version: 1
    }
    // TODO get from CLI / config
    try {
      await this._persistence.open()
      let res = await this.persistence.put('rovers', roverNames)
      if (res) {
        this._logger.debug('Stored rovers to persistence')
      }
      res = await this.persistence.put('appversion', versionData)
      if (res) {
        this._logger.debug('Stored appversion to persistence')
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
        this.collectBlock(rovers, block).then((pid: number|false) => {
          if (pid !== false) {
            this._logger.debug(`collectBlock handler: successfuly send to mining worker (PID: ${pid})`)
          }
        }).catch(err => {
          const reason = JSON.stringify(errToObj(err), null, 2)
          this._logger.error(`Could not send to mining worker, reason: ${reason}`)
          this._mining = false
          this._unfinishedBlock = undefined
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

      const currentTimestamp = ts.nowSeconds()
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
      newBlock.setTimestamp(currentTimestamp)
      this._unfinishedBlock = newBlock

      this._logger.debug(`Starting miner process with work: "${work}", difficulty: ${newBlock.getDifficulty()}, ${JSON.stringify(this._collectedBlocks, null, 2)}`)
      const proc: ChildProcess = fork(MINER_WORKER_PATH)
      this._workerProcess = proc
      if (this._workerProcess !== null) {
        // $FlowFixMe - Flow can't find out that ChildProcess is extended form EventEmitter
        this._workerProcess.on('message', this._handleWorkerFinishedMessage.bind(this))
        // $FlowFixMe - Flow can't find out that ChildProcess is extended form EventEmitter
        this._workerProcess.on('error', this._handleWorkerError.bind(this))
        // $FlowFixMe - Flow can't find out that ChildProcess is extended form EventEmitter
        this._workerProcess.on('exit', this._handleWorkerExit.bind(this))
        // $FlowFixMe - Flow can't find out that ChildProcess is extended form EventEmitter
        this._workerProcess.send({
          currentTimestamp,
          work,
          minerKey: this._minerKey,
          merkleRoot: newBlock.getMerkleRoot(),
          difficulty: newBlock.getDifficulty(),
          difficultyData: {
            currentTimestamp,
            lastPreviousBlock: lastPreviousBlock.serializeBinary(),
            // $FlowFixMe
            previousBcBlocks: Object.entries(previousBcBlocks).map(([chain, block: BcBlock]) => [chain, block.serializeBinary()]),
            currentBlocks: currentBlocks.map(block => block.serializeBinary()),
            block: block.serializeBinary(),
            newBlockHeaders: newBlock.getChildBlockHeadersList().map(header => header.serializeBinary())
          }})
        // $FlowFixMe - Flow can't properly find worker pid
        return Promise.resolve(this._workerProcess.pid)
      }
      return Promise.resolve(false)
    } else {
      if (!this._canMine) {
        this._logger.info(`Not mining because not collected enough blocks from all chains yet - ${JSON.stringify(this._collectedBlocks, null, 2)}`)
        return Promise.resolve(false)
      }
      if (this._mining) {
        this._logger.info('Not starting mining new block while already mining one')
        return Promise.resolve(false)
      }
      this._logger.debug(`Not mining because not all known chains are being rovered (rovered: ${JSON.stringify(rovers)}, known: ${JSON.stringify(this._knownRovers)})`)
      return Promise.resolve(false)
    }
  }

  _handleWorkerFinishedMessage (solution: { distance: number, nonce : string, difficulty: number, timestamp: number }) {
    if (!this._unfinishedBlock) {
      throw new Error(`There is not unfininshed block to use solution for`)
    }
    this._unfinishedBlock.setNonce(solution.nonce)
    // $FlowFixMe
    this._unfinishedBlock.setDistance(solution.distance)
    this._unfinishedBlock.setTimestamp(solution.timestamp)
    this._unfinishedBlock.setDifficulty(solution.difficulty)

    this._processMinedBlock(this._unfinishedBlock)
  }

  _handleWorkerError (error: Error) {
    this._logger.warn(`Mining worker process errored, reason: ${error.message}`)
    this._unfinishedBlock = undefined
    this._mining = false
    // $FlowFixMe - Flow can't properly find worker pid
    this._workerProcess.kill('SIGKILL')
    this._workerProcess = undefined
  }

  _handleWorkerExit (code: number, signal: string) {
    if (code !== 0) {
      this._logger.warn(`Mining worker process exited with code ${code}, signal ${signal}`)
      this._unfinishedBlock = undefined
      this._mining = false
    } else {
      this._logger.debug(`Mining worker fininshed its work (code: ${code})`)
    }
    this._workerProcess = undefined
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
    ts.stop()
    return this._rovers.killRovers()
  }

  _broadcastMinedBlock (newBlock: BcBlock): Promise<*> {
    this._logger.info('Broadcasting mined block')

    const method = 'newblock'
    this.node.broadcastNewBlock(method, newBlock)
    this._unfinishedBlock = undefined
    this._mining = false

    return Promise.resolve(true)
  }

  _processMinedBlock (newBlock: BcBlock): Promise<*> {
    const newBlockObj = newBlock.toObject()
    this._logger.info(`Mined new block: ${JSON.stringify(newBlockObj, null, 2)}`)
    debugSaveObject(`bc/block/${newBlockObj.timestamp}-${newBlockObj.hash}.json`, newBlockObj)

    const tasks = [
      // FIXME: This collides with genesis block
      this.persistence.put('bc.block.latest', newBlock),
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
