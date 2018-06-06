/**
 * Copyright (c) 2017-present, Block Collider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Multiverse } from '../bc/multiverse'
import type { BcBlock } from '../protos/core_pb'

const ROVERS = Object.keys(require('../rover/manager').rovers)

const debug = require('debug')('bcnode:engine')
const { EventEmitter } = require('events')
const { equals, all, values } = require('ramda')
const { fork, ChildProcess } = require('child_process')
const { resolve } = require('path')
const { writeFileSync } = require('fs')
const LRUCache = require('lru-cache')

const config = require('../../config/config')
const { debugSaveObject, isDebugEnabled, ensureDebugPath } = require('../debug')
const logging = require('../logger')
const { Monitor } = require('../monitor')
const { Node } = require('../p2p')
const RoverManager = require('../rover/manager').default
const rovers = require('../rover/manager').rovers
const Server = require('../server/index').default
const PersistenceRocksDb = require('../persistence').RocksDb
const { PubSub } = require('./pubsub')
const { RpcServer } = require('../rpc/index')
const { prepareWork, prepareNewBlock } = require('../bc/miner')
const { getGenesisBlock } = require('../bc/genesis')
const { isValidBlock } = require('../bc/validation')
const { getBlockchainsBlocksCount } = require('../bc/helper')
const { Block } = require('../protos/core_pb')
const { errToString } = require('../helper/error')
const { getVersion } = require('../helper/version')
const ts = require('../utils/time').default // ES6 default export

const DATA_DIR = process.env.BC_DATA_DIR || config.persistence.path
const MONITOR_ENABLED = process.env.BC_MONITOR === 'true'
const PERSIST_ROVER_DATA = process.env.PERSIST_ROVER_DATA === 'true'
const MINER_WORKER_PATH = resolve(__filename, '..', '..', 'bc', 'miner_worker.js')

type UnfinishedBlockData = {
  lastPreviousBlock: ?BcBlock,
  block: ?Block,
  currentBlocks: ?{ [blokchain: string]: Block },
  iterations: ?number,
  timeDiff: ?number
}

export default class Engine {
  _logger: Object; // eslint-disable-line no-undef
  _monitor: Monitor; // eslint-disable-line no-undef
  _knownBlocksCache: LRUCache<string, BcBlock>; // eslint-disable-line no-undef
  _node: Node; // eslint-disable-line no-undef
  _persistence: PersistenceRocksDb; // eslint-disable-line no-undef
  _pubsub: PubSub; //  eslint-disable-line no-undef
  _rovers: RoverManager; // eslint-disable-line no-undef
  _rpc: RpcServer; // eslint-disable-line no-undef
  _server: Server; // eslint-disable-line no-undef
  _emitter: EventEmitter; // eslint-disable-line no-undef
  _knownRovers: string[]; // eslint-disable-line no-undef
  _minerKey: string; // eslint-disable-line no-undef
  _collectedBlocks: Object; // eslint-disable-line no-undef
  _verses: Multiverse[]; // eslint-disable-line no-undef
  _canMine: bool; // eslint-disable-line no-undef
  _workerProcess: ?ChildProcess
  _unfinishedBlock: ?BcBlock
  _subscribers: Object
  _unfinishedBlockData: ?UnfinishedBlockData
  _peerIsSyncing: boolean
  _peerIsResyncing: boolean

  constructor (logger: Object, opts: { rovers: string[], minerKey: string}) {
    this._logger = logging.getLogger(__filename)
    this._knownRovers = opts.rovers
    this._minerKey = opts.minerKey
    this._monitor = new Monitor(this, {})
    this._persistence = new PersistenceRocksDb(DATA_DIR)
    this._pubsub = new PubSub()
    this._node = new Node(this)
    this._rovers = new RoverManager()
    this._emitter = new EventEmitter()
    this._rpc = new RpcServer(this)
    this._server = new Server(this, this._rpc)
    this._collectedBlocks = {}
    this._subscribers = {}
    this._verses = []
    for (let roverName of this._knownRovers) {
      this._collectedBlocks[roverName] = 0
    }
    this._canMine = false
    this._unfinishedBlockData = { block: undefined, lastPreviousBlock: undefined, currentBlocks: {}, timeDiff: undefined, iterations: undefined }

    this._knownBlocksCache = LRUCache({
      max: 1024
    })

    this._peerIsSyncing = false
    this._peerIsResyncing = false
    // Start NTP sync
    ts.start()
  }
  /**
   * Get multiverse
   * @returns {Multiverse|*}
   */
  get multiverse (): Multiverse {
    return this.node.multiverse
  }

  /**
   * Get pubsub wrapper instance
   * @returns {PubSub}
   */
  get pubsub (): PubSub {
    return this._pubsub
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
    const newGenesisBlock = getGenesisBlock()
    const versionData = {
      version: npm,
      commit: long,
      db_version: 1
    }
    // TODO get from CLI / config
    try {
      await this._persistence.open()
      this.multiverse.addBlock(newGenesisBlock)
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
        await this.persistence.get('bc.block.latest')
        this._logger.info('Genesis block present, everything ok')
      } catch (_) { // genesis block not found
        try {
          await this.persistence.put('bc.block.1', newGenesisBlock)
          await this.persistence.put('bc.block.latest', newGenesisBlock)
          this._logger.info('Genesis block saved to disk ' + newGenesisBlock.getHash())
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

    this.pubsub.subscribe('state.block.height', '<engine>', (msg) => {
      const block = msg.data
      this._persistence.put(msg.key, block)
        .then(() => {
          this._logger.info('block #' + block.getHeight() + ' saved with hash ' + block.getHash())
        })
        .catch((err) => {
          this._logger.error(err)
        })
    })
    this.pubsub.subscribe('update.block.latest', '<engine>', (msg) => {
      const block = msg.data
      this._persistence.put('bc.block.latest', block)
        .then(() => {
          this.pubsub.publish('state.block.height', { key: 'bc.block.' + block.getHeight(), data: block })
        })
        .catch((err) => {
          this._logger.error(err)
        })
    })
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
          this._logger.error(`Could not send to mining worker, reason: ${errToString(err)}`)
          this._cleanUnfinishedBlock()
        })
      })
    })
  }

  async collectBlock (rovers: string[], block: BcBlock) {
    this._collectedBlocks[block.getBlockchain()] += 1

    // TODO: Adjust minimum count of collected blocks needed to trigger mining
    // if (!this._canMine && all((numCollected: number) => numCollected >= 2, values(this._collectedBlocks))) { //--> MAINNET
    if (!this._canMine && all((numCollected: number) => numCollected >= 1, values(this._collectedBlocks))) { // --> TESTNET
      this._canMine = true
    }
    if (PERSIST_ROVER_DATA === true) {
      this._writeRoverData(block)
    }
    // start mining only if all known chains are being rovered
    if (this._canMine && !this._peerIsSyncing && equals(new Set(this._knownRovers), new Set(rovers))) {
      return this.startMining(rovers, block)
    } else {
      if (!this._canMine) {
        const msg = Object.keys(this._collectedBlocks).reduce((all, a) => {
          const val = this._collectedBlocks[a]
          all = all + a + ':' + val + '  '
          return all
        }, '')
        this._logger.info(`generating multiverse of ${msg}`)
        return Promise.resolve(false)
      }
      if (this._peerIsSyncing) {
        this._logger.info(`mining and ledger updates disabled until initial multiverse threshold is met`)
        return Promise.resolve(false)
      }
      this._logger.debug(`consumed blockchains manually overridden, mining services disabled, active multiverse rovers: ${JSON.stringify(rovers)}, known: ${JSON.stringify(this._knownRovers)})`)
      return Promise.resolve(false)
    }
  }

  blockFromPeer (newBlock: BcBlock) {
    this._logger.info('received new block from peer', newBlock.getHeight(), newBlock.getMiner(), newBlock.toObject())
    // TODO: Validate new block mined by peer
    if (!this._knownBlocksCache.get(newBlock.getHash())) {
      debug(`Adding received block into cache of known blocks - ${newBlock.getHash()}`)
      // Add to cache
      this._knownBlocksCache.set(newBlock.getHash(), newBlock)

      const beforeBlockHighest = this.multiverse.getHighestBlock()
      const addedToMultiverse = this.multiverse.addBlock(newBlock)
      const afterBlockHighest = this.multiverse.getHighestBlock()

      // $FlowFixMe
      this._logger.debug('beforeBlockHighest: ' + beforeBlockHighest.getHash())
      // $FlowFixMe
      this._logger.debug('afterBlockHighest: ' + afterBlockHighest.getHash())
      // $FlowFixMe
      this._logger.debug('addedToMultiverse: ' + addedToMultiverse)

      if (beforeBlockHighest !== afterBlockHighest) { // TODO @schnorr
        this.pubsub.publish('update.block.latest', { key: 'bc.block.latest', data: newBlock })
      } else if (addedToMultiverse === true) {
        this.pubsub.publish('state.block.height', { key: 'bc.block.' + newBlock.getHeight(), data: newBlock })
      } else {
        // determine if the block is above the minimum to be considered for an active multiverse
        if (newBlock.getHeight() > 8 &&
            newBlock.getHeight() > (afterBlockHighest.getHeight() - 8)) { // if true update or create candidate multiverse
          const approved = this._verses.reduce((approved, multiverse) => {
            const candidateApproved = multiverse.addBlock(newBlock)
            if (candidateApproved === true) {
              approved.push(multiverse)
            }
            return approved
          }, [])
          if (approved.length === 0) { // if none of the multiverses accepted the new block create its own and request more information from the peer
            const newMultiverse = new Multiverse()
            newMultiverse.addBlock(newBlock)
            this._verses.push(newMultiverse)
            // @korczis --> send PeerQuery to peer
            const peerQuery = {
              queryHash: newBlock.getHash(),
              queryHeight: newBlock.getHeight(),
              low: newBlock.getHeight() - 7,
              hig: newBlock.getHeight() + 2
            }
          } else { // else check if any of the multiverses are ready for comparison
            const candidates = approved.filter((m) => {
              if (Object.keys(m._blocks).length >= 7) {
                return m
              }
              return false
            })
            if (candidates.length > 0) {
              // here we would sort by highest block totalDistance and compare with current
              // if its better, we restart the miner, enable resync, purge the db, and set _blocks to a clone of _blocks on the candidate
              //
              // const ordered = candidates.sort((a, b) => {
              //  if(a.getTotalDistance() > b.getTotalDistance()) {
              //    return 1
              //  }
              //  if(a.getTotalDistance() < b.getTotalDistance()) {
              //    return -1
              //  }
              //  return 0
              // })
              // const bestCandidate = ordered.shift()
              // const highCandidateBlock = bestCandidateBlock.getHighestBlock()
              // const lowCandidateBlock = bestCandidateBlock.getLowestBlock()
              // if (highCandidateBlock.getTotalDistance() > afterBlockHighest.getTotalDistance() &&
              // lowCandidateBlock.getTotalDistance() > this.multiverse.getLowestBlock()) {
              //     this.multiverse._blocks = _.cloneDeep(lowCandidateBlock._blocks)
              //     delete bestCandidate
              // }
            }
          }
        } else if (this._peerIsResyncing === true) { // if we are resyncing pass the block to block pool
          // pass
        } else {
          // ignore
        }
        // here trigger a cleanup for multiverses that are older than 2 minutes
        // console.log(missingBlocks)
      }
    } else {
      debug(`Received block is already in cache of known blocks - ${newBlock.getHash()}`)
    }
  }

  receiveSyncPeriod (peerIsSyncing: bool) {
    this._peerIsSyncing = peerIsSyncing
  }

  _cleanUnfinishedBlock () {
    debug('Cleaning unfinished block')
    this._unfinishedBlock = undefined
    this._unfinishedBlockData = undefined
  }

  _handleWorkerFinishedMessage (solution: { distance: number, nonce : string, difficulty: number, timestamp: number, iterations: number, timeDiff: number }) {
    if (this._unfinishedBlock === undefined || this._unfinishedBlock === null) {
      this._logger.warn('There is not an unfinished block to use solution for')
      return
    }

    const { nonce, distance, timestamp, difficulty, iterations, timeDiff } = solution

    // $FlowFixMe
    this._unfinishedBlock.setNonce(nonce)
    // $FlowFixMe
    this._unfinishedBlock.setDistance(distance)
    // $FlowFixMe
    this._unfinishedBlock.setTotalDistance(this._unfinishedBlock.getTotalDistance() + distance)
    // $FlowFixMe
    this._unfinishedBlock.setTimestamp(timestamp)
    // $FlowFixMe
    this._unfinishedBlock.setDifficulty(difficulty)

    if (this._unfinishedBlockData) {
      this._unfinishedBlockData.iterations = iterations
      this._unfinishedBlockData.timeDiff = timeDiff
    }

    if (!isValidBlock(this._unfinishedBlock)) {
      this._logger.warn(`The mined block is not valid`)
      this._cleanUnfinishedBlock()
      return
    }

    if (this._unfinishedBlock !== undefined && isDebugEnabled()) {
      this._writeMiningData(this._unfinishedBlock, solution)
    }

    this._processMinedBlock(this._unfinishedBlock, solution)
      .then((res) => {
        // If block was successfully processed then _cleanUnfinishedBlock
        if (res) {
          const newBlockObj = {
            ...this._unfinishedBlock.toObject(),
            iterations: solution.iterations,
            timeDiff: solution.timeDiff
          }

          this.pubsub.publish('block.mined', { type: 'block.mined', data: newBlockObj })

          this._cleanUnfinishedBlock()
        }
      })
  }

  _handleWorkerError (error: Error) {
    this._logger.warn(`Mining worker process errored, reason: ${error.message}`)
    this._cleanUnfinishedBlock()
    // $FlowFixMe - Flow can't properly type subprocess
    this._workerProcess.kill()
    // $FlowFixMe - Flow can't properly type subprocess
    this._workerProcess.disconnect()
    this._workerProcess = undefined
  }

  _handleWorkerExit (code: number, signal: string) {
    if (code === 0 || code === null) { // 0 means worker exited on it's own correctly, null that is was terminated from engine
      this._logger.debug(`Mining worker finished its work (code: ${code})`)
    } else {
      this._logger.warn(`Mining worker process exited with code ${code}, signal ${signal}`)
      this._cleanUnfinishedBlock()
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

  _writeRoverData (newBlock: BcBlock) {
    const dataPath = ensureDebugPath(`bc/rover-block-data.csv`)
    const rawData = JSON.stringify(newBlock)
    writeFileSync(dataPath, `${rawData}\r\n`, { encoding: 'utf8', flag: 'a' })
  }

  _writeMiningData (newBlock: BcBlock, solution: { iterations: number, timeDiff: number }) {
    // block_height, block_difficulty, block_distance, block_total_distance, block_timestamp, iterations_count, mining_duration_ms, btc_confirmation_count, btc_current_timestamp, eth_confirmation_count, eth_current_timestamp, lsk_confirmation_count, lsk_current_timestamp, neo_confirmation_count, neo_current_timestamp, wav_confirmation_count, wav_current_timestamp
    const row = [
      newBlock.getHeight(), newBlock.getDifficulty(), newBlock.getDistance(), newBlock.getTotalDistance(), newBlock.getTimestamp(), solution.iterations, solution.timeDiff
    ]

    this._knownRovers.forEach(roverName => {
      if (this._unfinishedBlockData && this._unfinishedBlockData.currentBlocks) {
        const methodNameGet = `get${roverName[0].toUpperCase() + roverName.slice(1)}List` // e.g. getBtcList
        // $FlowFixMe - flow does not now about methods of protobuf message instances
        const blocks = this._unfinishedBlockData.currentBlocks[methodNameGet]()
        row.push(blocks.map(block => block.getBlockchainConfirmationsInParentCount()).join('|'))
        row.push(blocks.map(block => block.getTimestamp() / 1000 << 0).join('|'))
      }
    })
    row.push(getBlockchainsBlocksCount(newBlock))
    const dataPath = ensureDebugPath(`bc/mining-data.csv`)
    writeFileSync(dataPath, `${row.join(',')}\r\n`, { encoding: 'utf8', flag: 'a' })
  }

  /**
   * Broadcast new block
   *
   * - peers
   * - pubsub
   * - ws
   *
   * This function is called by this._processMinedBlock()
   * @param newBlock
   * @param solution
   * @returns {Promise<boolean>}
   * @private
   */
  _broadcastMinedBlock (newBlock: BcBlock, solution: Object): Promise<*> {
    this._logger.info('Broadcasting mined block')

    this.node.broadcastNewBlock(newBlock)
    this._cleanUnfinishedBlock()

    try {
      const newBlockObj = {
        ...newBlock.toObject(),
        iterations: solution.iterations,
        timeDiff: solution.timeDiff
      }

      this.pubsub.publish('block.mined', { type: 'block.mined', data: newBlockObj })
    } catch (e) {
      console.log('ERROR BROADCASTING', e)
    }

    return Promise.resolve(true)
  }

  /**
   * Deals with unfinished block after the solution is found
   *
   * @param newBlock
   * @param solution
   * @returns {Promise<boolean>} Promise indicating if the block was successfully processed
   * @private
   */
  _processMinedBlock (newBlock: BcBlock, solution: Object): Promise<*> {
    // TODO: reenable this._logger.info(`Mined new block: ${JSON.stringify(newBlockObj, null, 2)}`)

    // Trying to process null/undefined block
    if (newBlock === null || newBlock === undefined) {
      this._logger.warn('Failed to process work provided by miner')
      return Promise.resolve(false)
    }

    try {
      // Received block which is already in cache
      if (this._knownBlocksCache.has(newBlock.getHash())) {
        this._logger.warn('Recieved duplicate new block ' + newBlock.getHeight() + ' (' + newBlock.getHash() + ')')
        return Promise.resolve(false)
      }

      // Add to multiverse and call persist
      this._knownBlocksCache.set(newBlock.getHash(), newBlock)

      const beforeBlockHighest = this.multiverse.getHighestBlock()
      const addedToMultiverse = this.multiverse.addBlock(newBlock)
      const afterBlockHighest = this.multiverse.getHighestBlock()

      console.log('beforeBlockHighest height -> ' + beforeBlockHighest.getHeight() + ' ' + beforeBlockHighest.getHash())
      console.log('afterBlockHighest height -> ' + afterBlockHighest.getHeight() + ' ' + afterBlockHighest.getHash())
      console.log('addedToMultiverse: ' + addedToMultiverse)

      if (beforeBlockHighest.getHash() !== afterBlockHighest.getHash()) {
        this.pubsub.publish('update.block.latest', { key: 'bc.block.latest', data: newBlock })
      } else if (addedToMultiverse === true) {
        this.pubsub.publish('state.block.height', { key: 'bc.block.' + newBlock.getHeight(), data: newBlock })
      }

      // Store block in _debug folder and return promise indicating success
      debugSaveObject(`bc/block/${newBlock.getTimestamp()}-${newBlock.getHash()}.json`, newBlock.toObject())
      return Promise.resolve(true)
    } catch (err) {
      this._logger.warn(`failed to process work provided by miner, err: ${errToString(err)}`)
      return Promise.resolve(false)
    }
  }

  async startMining (rovers: string[] = ROVERS, block: BcBlock): Promise<*> {
    debug('Starting mining', rovers || ROVERS, block.toObject())

    let currentBlocks
    let lastPreviousBlock

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

    this._logger.debug(`Preparing new block`)

    const currentTimestamp = ts.nowSeconds()
    if (this._unfinishedBlock !== undefined && getBlockchainsBlocksCount(this._unfinishedBlock) >= 6) {
      this._cleanUnfinishedBlock()
    }
    const [newBlock, finalTimestamp] = prepareNewBlock(
      currentTimestamp,
      lastPreviousBlock,
      currentBlocks,
      block,
      [], // TODO add transactions
      this._minerKey,
      this._unfinishedBlock
    )
    const work = prepareWork(lastPreviousBlock.getHash(), newBlock.getBlockchainHeaders())
    newBlock.setTimestamp(finalTimestamp)
    this._unfinishedBlock = newBlock
    this._unfinishedBlockData = {
      lastPreviousBlock,
      currentBlocks: newBlock.getBlockchainHeaders(),
      block,
      iterations: undefined,
      timeDiff: undefined
    }

    // if blockchains block count === 5 we will create a block with 6 blockchain blocks (which gets bonus)
    // if it's more, do not restart mining and start with new ones
    if (this._workerProcess && this._unfinishedBlock) {
      this._logger.debug(`Restarting mining with a new rovered block`)
      // $FlowFixMe
      this._workerProcess.kill()
      // $FlowFixMe
      this._workerProcess.disconnect()
    }

    // if (!this._workerProcess) {
    this._logger.debug(`Starting miner process with work: "${work}", difficulty: ${newBlock.getDifficulty()}, ${JSON.stringify(this._collectedBlocks, null, 2)}`)
    const proc: ChildProcess = fork(MINER_WORKER_PATH)
    this._workerProcess = proc
    // } else {
    //   this._logger.debug(`Sending work to existing miner process (pid: ${this._workerProcess.pid}), work: "${work}", difficulty: ${newBlock.getDifficulty()}, ${JSON.stringify(this._collectedBlocks, null, 2)}`)
    // }
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
        offset: ts.offset,
        work,
        minerKey: this._minerKey,
        merkleRoot: newBlock.getMerkleRoot(),
        difficulty: newBlock.getDifficulty(),
        difficultyData: {
          currentTimestamp,
          lastPreviousBlock: lastPreviousBlock.serializeBinary(),
          // $FlowFixMe
          newBlockHeaders: newBlock.getBlockchainHeaders().serializeBinary()
        }})
      // $FlowFixMe - Flow can't properly find worker pid
      return Promise.resolve(this._workerProcess.pid)
    }
    return Promise.resolve(false)
  }

  stopMining (): Promise<*> {
    debug('Stopping mining')

    if (!this._workerProcess) {
      return Promise.resolve(false)
    }

    this._workerProcess.kill()
    this._workerProcess = null
    return Promise.resolve(true)
  }

  restartMining (rovers: string[] = ROVERS, block: BcBlock): Promise<boolean> {
    debug('Restarting mining', rovers, block.toObject())

    this.stopMining()
    return this.startMining(rovers || ROVERS, block)
      .then(res => {
        return Promise.resolve(!res)
      })
  }
}
