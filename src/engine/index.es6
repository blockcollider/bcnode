/* e
 * Copyright (c) 2017-present, Block Collider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { BcBlock } from '../protos/core_pb'

const ROVERS = Object.keys(require('../rover/manager').rovers)

const debug = require('debug')('bcnode:engine')
const { EventEmitter } = require('events')
const { equals, all, values, clone } = require('ramda')
const { fork, ChildProcess } = require('child_process')
const { resolve } = require('path')
const { writeFileSync } = require('fs')
const LRUCache = require('lru-cache')
const BN = require('bn.js')
const semver = require('semver')

const { config } = require('../config')
const { debugSaveObject, isDebugEnabled, ensureDebugPath } = require('../debug')
const { Multiverse } = require('../bc/multiverse')
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
const { BlockPool } = require('../bc/blockpool')
const { isValidBlock } = require('../bc/validation')
const { getBlockchainsBlocksCount } = require('../bc/helper')
const { Block } = require('../protos/core_pb')
const { errToString } = require('../helper/error')
const { getVersion } = require('../helper/version')
const { blockByTotalDistanceSorter } = require('./helper')
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
  _rawBlocks: LRUCache<number, Block>; // eslint-disable-line no-undef
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
  _rawBlock: ?Object
  _subscribers: Object
  _unfinishedBlockData: ?UnfinishedBlockData
  _peerIsSyncing: boolean
  _peerIsResyncing: boolean

  constructor (logger: Object, opts: { rovers: string[], minerKey: string}) {
    this._logger = logging.getLogger(__filename)
    this._knownRovers = opts.rovers
    this._minerKey = opts.minerKey
    this._rawBlock = {}
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

    this._rawBlocks = LRUCache({
      max: 5
    })

    this._peerIsSyncing = false
    this._peerIsResyncing = false
    // Start NTP sync
    ts.start()
  }

  get minerKey (): ?string {
    return this._minerKey
  }

  /**
   * Get multiverse
   * @returns {Multiverse|*}
   */
  get multiverse (): Multiverse {
    return this.node.multiverse
  }

  /**
   * Get blockpool
   * @returns {BlockPool|*}
   */
  get blockpool (): BlockPool {
    return this.node.blockpool
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
    const self = this
    const roverNames = Object.keys(rovers)
    const { npm, git: { long } } = getVersion()
    const newGenesisBlock = getGenesisBlock()
    const versionData = {
      version: npm,
      commit: long,
      db_version: 1
    }
    const DB_LOCATION = resolve(`${__dirname}/../../${this.persistence._db.location}`)
    const DELETE_MESSAGE = `Your DB version is old, please delete data folder '${DB_LOCATION}' and run bcnode again`
    // TODO get from CLI / config
    try {
      await this._persistence.open()
      try {
        let version = await this.persistence.get('appversion')
        if (semver.lt(version.version, '0.6.0')) {
          this._logger.warn(DELETE_MESSAGE)
          process.exit(8)
        }
      } catch (_) {
        // version was not stored - very old version so log a request to delete _data and exit
        this._logger.warn(DELETE_MESSAGE)
        process.exit(8)
      }
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
        const latestBlock = await this.persistence.get('bc.block.latest')
        self._logger.info('highest block height on disk ' + latestBlock.getHeight())
        self.multiverse.addBlock(latestBlock)
        self.multiverse._selective = true
        this._logger.info('Genesis block present, everything ok')
      } catch (_) { // genesis block not found
        try {
          await this.persistence.put('bc.block.1', newGenesisBlock)
          await this.persistence.put('bc.block.latest', newGenesisBlock)
          self.multiverse.addBlock(newGenesisBlock)
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
      self.storeHeight(block)
    })

    this.pubsub.subscribe('update.checkpoint.start', '<engine>', (msg) => {
      self._peerIsResyncing = true
    })

    this.pubsub.subscribe('state.resync.failed', '<engine>', (msg) => {
      self._logger.info('pausing mining to reestablish multiverse')
      self._peerIsResyncing = true
      self.stopMining()
      self.blockpool.purge()
        .then((res) => {

        })
        .catch((err) => {
          self._logger.error(err)
        })
    })

    this.pubsub.subscribe('state.checkpoint.end', '<engine>', (msg) => {
      self._peerIsResyncing = false
    })

    this.pubsub.subscribe('update.block.latest', '<engine>', (msg) => {
      self.stopMining()
      self.updateLatestAndStore(msg.data)
        .then((res) => {
          // if a fresh block is available rerun it with the updated latest block
          if (self._rawBlocks.has('bc.block.latestchild')) {
            self.startMining(self._rovers, self._rawBlock)
          }
        })
    })
  }

  /**
   * Store a block in persistence unless its Genesis Block
   * @returns Promise
   */
  async storeHeight (block: BcBlock) {
    const self = this
    // Block is genesis block
    if (block.getHeight() < 2) {
      return
    }
    try {
      await self.persistence.put('bc.block.' + block.getHeight(), block)
      return Promise.resolve(block)
    } catch (err) {
      self._logger.warn('unable to store block ' + block.getHeight() + ' - ' + block.getHash())
      return Promise.reject(err)
    }
  }

  /**
   * Store a block in persistence unless its Genesis Block
   * @returns Promise
   */
  async updateLatestAndStore (block: BcBlock) {
    const self = this
    try {
      const previousLatest = await self.persistence.get('bc.block.latest')
      let persistNewBlock = false
      console.log('comparing new block ' + block.getHeight() + ' with the latest block at ' + block.getHeight())
      if (previousLatest.getHeight() < (block.getHeight() - 7)) {
        persistNewBlock = true
      }
      if (previousLatest.getHash() === block.getPreviousHash()) {
        persistNewBlock = true
      }
      if (persistNewBlock === true &&
         block.getTimestamp() > previousLatest.getTimestamp()) { // notice you cannot create two blocks in the same second (for when BC moves to 1s block propogation waves)
        await self.persistence.put('bc.block.latest', block)
        await self.persistence.put('bc.block.' + block.getHeight(), block)
        if (self._workerProcess === undefined) {
          self._workerProcess = false
        }
      } else {
        self._logger.warn('new purposed latest block does not match the last')
      }
      return Promise.resolve(true)
    } catch (err) {
      await self.persistence.put('bc.block.latest', block)
      await self.persistence.put('bc.block.' + block.getHeight(), block)
      return Promise.resolve(true)
    }
  }

  /**
   * Get node
   * @return {Node}
   */
  get node (): Node {
    return this._node
  }

  /**
   * Get rawBlock
   * @return {Object}
   */
  get rawBlock (): ?Object {
    return this._rawBlock
  }

  /**
   * Get rawBlock
   * @return {Object}
   */
  set rawBlock (block: Object): ?Object {
    this._rawBlock = block
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

  async collectBlock (rovers: string[], block: Block) {
    const self = this
    this._collectedBlocks[block.getBlockchain()] += 1

    // TODO: Adjust minimum count of collected blocks needed to trigger mining
    if (!this._canMine && all((numCollected: number) => numCollected >= 1, values(self._collectedBlocks))) {
      this._canMine = true
    }

    if (PERSIST_ROVER_DATA === true) {
      this._writeRoverData(block)
    }
    // start mining only if all known chains are being rovered
    if (this._canMine && !this._peerIsSyncing && equals(new Set(this._knownRovers), new Set(rovers))) {
      self._rawBlocks.set('bc.block.latestchild', block)
      self.rawBlock = block
      return self.startMining(rovers, block)

        .catch((err) => {
          self._logger.error(err)
        })
    } else {
      if (!this._canMine) {
        const keys = Object.keys(this._collectedBlocks)
        const values = '|' + keys.reduce((all, a, i) => {
          const val = this._collectedBlocks[a]
          if (i === (keys.length - 1)) {
            all = all + a + ':' + val
          } else {
            all = all + a + ':' + val + ' '
          }
          return all
        }, '') + '|'
        this._logger.info('constructing multiverse from blockchains ' + values)
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

  blockFromPeer (conn: Object, newBlock: BcBlock) {
    const self = this
    // TODO: Validate new block mined by peer
    if (newBlock !== undefined && !self._knownBlocksCache.get(newBlock.getHash())) {
      self._logger.info('!!!!!!!!!! received new block from peer', newBlock.getHeight(), newBlock.getMiner(), newBlock.toObject())
      debug(`Adding received block into cache of known blocks - ${newBlock.getHash()}`)
      // Add to cache
      this._knownBlocksCache.set(newBlock.getHash(), newBlock)

      const beforeBlockHighest = self.multiverse.getHighestBlock()
      const addedToMultiverse = self.multiverse.addBlock(newBlock)
      const afterBlockHighest = self.multiverse.getHighestBlock()

      // $FlowFixMe
      this._logger.debug('(' + self.multiverse._id + ') beforeBlockHighest: ' + beforeBlockHighest.getHash())
      // $FlowFixMe
      this._logger.debug('(' + self.multiverse._id + ') afterBlockHighest: ' + afterBlockHighest.getHash())
      // $FlowFixMe
      this._logger.debug('(' + self.multiverse._id + ') addedToMultiverse: ' + addedToMultiverse)

      if (addedToMultiverse === false) {
        this._logger.warn('(' + self.multiverse._id + ') !!!! Block failed to join multiverse')
        this._logger.warn('(' + self.multiverse._id + ') !!!!     height: ' + newBlock.getHeight())
        this._logger.warn('(' + self.multiverse._id + ') !!!!     hash: ' + newBlock.getHash())
        this._logger.warn('(' + self.multiverse._id + ') !!!!     previousHash: ' + newBlock.getPreviousHash())
        this._logger.warn('(' + self.multiverse._id + ') !!!!     distance: ' + newBlock.getDistance())
        this._logger.warn('(' + self.multiverse._id + ') !!!!     totalDistance: ' + newBlock.getTotalDistance())
      }

      if (beforeBlockHighest !== afterBlockHighest) { // TODO @schnorr
        self.pubsub.publish('update.block.latest', { key: 'bc.block.latest', data: newBlock })
      } else if (addedToMultiverse === true) { // !important as update block latest also stored height
        self.pubsub.publish('state.block.height', { key: 'bc.block.' + newBlock.getHeight(), data: newBlock })
      } else {
        // determine if the block is above the minimum to be considered for an active multiverse
        if (newBlock.getHeight() > 6 &&
            newBlock.getHeight() > (afterBlockHighest.getHeight() - 8)) { // if true update or create candidate multiverse
          const approved = self._verses.reduce((approved, multiverse) => {
            const candidateApproved = multiverse.addBlock(newBlock)
            if (candidateApproved === true) {
              approved.push(multiverse)
            }
            return approved
          }, [])
          if (approved.length === 0) { // if none of the multiverses accepted the new block create its own and request more information from the peer
            const newMultiverse = new Multiverse(true)
            newMultiverse.addBlock(newBlock)
            self._verses.push(newMultiverse)

            this._logger.info('new multiverse created for block ' + newBlock.getHeight() + ' ' + newBlock.getHash())
            // this.node.triggerBlockSync() // --> give me multiverse

            conn.getPeerInfo((err, peerInfo) => {
              if (err) {
                console.trace(err)
                self._logger.error(err)
                return false
              }

              const peerQuery = {
                queryHash: newBlock.getHash(),
                queryHeight: newBlock.getHeight(),
                low: Math.max(newBlock.getHeight() - 9, 1),
                high: newBlock.getHeight() + 2
              }
              debug('Querying peer for blocks', peerQuery)

              console.log('***********************CANDIDATE 1*******************')
              const bestPeer = this.node.manager.createPeer(peerInfo)
                .query(peerQuery)
                .then((blocks) => {
                  debug('Got query response', blocks)
                  blocks.map((block) => newMultiverse.addBlock(block))
                  if (Object.keys(newMultiverse).length > 6) {
                    const bestCandidate = newMultiverse
                    const highCandidateBlock = bestCandidate.getHighestBlock()
                    const lowCandidateBlock = bestCandidate.getLowestBlock()
                    if (new BN(highCandidateBlock.getTotalDistance()).gt(new BN(afterBlockHighest.getTotalDistance())) &&
                    highCandidateBlock.getHeight() >= afterBlockHighest.getHeight() &&
                    new BN(lowCandidateBlock.getTotalDistance()).gt(new BN(self.multiverse.getLowestBlock().getTotalDistance()))) {
                      self.multiverse._blocks = clone(bestCandidate._blocks)
                      self._logger.info('applied new multiverse ' + bestCandidate.getHighestBlock().getHash())
                      self._peerIsResyncing = true
                      self.blockpool._checkpoint = lowCandidateBlock
                      self.pubsub.publish('update.block.latest', { key: 'bc.block.latest', data: highCandidateBlock })
                      // sets multiverse for removal
                      bestCandidate._created = 0
                      bestPeer.query({
                        queryHash: newBlock.getHash(),
                        queryHeight: newBlock.getHeight(),
                        low: 1,
                        high: newBlock.getHeight() + 2
                      })
                        .then((blocks) => {
                          const tasks = blocks.map((block) => {
                            return self.blockpool.addBlock(block)
                          })
                          Promise.all(tasks)
                            .then((res) => {
                              // TODO: @korczis ->  this is breaking
                            })
                            .catch((err) => {
                              console.trace(err)
                            })
                        })
                        .catch((err) => {
                          self._logger.error(new Error('unable to complete resync with peer'))
                          console.trace(err)
                        })
                    }
                  }
                })
            })
          } else { // else check if any of the multiverses are ready for comparison
            const candidates = approved.filter((m) => {
              if (Object.keys(m._blocks).length >= 6) {
                return m
              }
              return false
            })
            if (candidates.length > 0) {
              // here we sort by highest block totalDistance and compare with current
              // if its better, we restart the miner, enable resync, purge the db, and set _blocks to a clone of _blocks on the candidate
              console.log('***********************CANDIDATE 2*******************')
              const ordered = candidates.sort(blockByTotalDistanceSorter)
              const bestCandidate = ordered.shift()
              const highCandidateBlock = bestCandidate.getHighestBlock()
              const lowCandidateBlock = bestCandidate.getLowestBlock()
              if (new BN(highCandidateBlock.getTotalDistance()).gt(new BN(afterBlockHighest.getTotalDistance())) &&
              highCandidateBlock.getHeight() >= afterBlockHighest.getHeight() &&
              new BN(lowCandidateBlock.getTotalDistance()).gt(new BN(self.multiverse.getLowestBlock().getTotalDistance()))) {
                self.multiverse._blocks = clone(bestCandidate._blocks)
                self._logger.info('applied new multiverse ' + bestCandidate.getHighestBlock().getHash())
                self._peerIsResyncing = true
                self.blockpool._checkpoint = lowCandidateBlock
                self.pubsub.publish('update.block.latest', { key: 'bc.block.latest', data: highCandidateBlock })
                // sets multiverse for removal
              }
            }
          }
        } else if (self._peerIsResyncing === true) { // if we are resyncing pass the block to block pool
          self.blockpool.addBlock(newBlock)
            .then((state) => {
              self._logger.info('pass to block pool ' + newBlock.getHeight() + ' ' + newBlock.getHash())
            })
            .catch((err) => {
              self._logger.error(err)
            })
          // pass
        } else {
          self._logger.info('ignoring block ' + newBlock.getHeight() + ' ' + newBlock.getHash())
          // ignore
        }
        // remove candidates older beyond a threshold
        const keepCandidateThreshold = (Date.now() * 0.001) - (120 * 1000) // 120 seconds / 2 mins
        this._verses = this._verses.filter(m => {
          if (m._created > keepCandidateThreshold) {
            return m
          }
        })
      }
    } else {
      console.log(`Received block is already in cache of known blocks - ${newBlock.getHash()}`)
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
    this._unfinishedBlock.setTotalDistance(new BN(this._unfinishedBlock.getTotalDistance()).add(new BN(distance)).toString())
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
          this._broadcastMinedBlock(this._unfinishedBlock, solution)

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

    if (newBlock === undefined) {
      return Promise.reject(new Error('cannot broadcast empty block'))
    }

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
      if (newBlock !== undefined) {
        debugSaveObject(`bc/block/${newBlock.getTimestamp()}-${newBlock.getHash()}.json`, newBlock.toObject())
      }
      return Promise.resolve(true)
    } catch (err) {
      this._logger.warn(`failed to process work provided by miner, err: ${errToString(err)}`)
      return Promise.resolve(false)
    }
  }

  async startMining (rovers: string[] = ROVERS, block: Block): Promise<*> {
    const self = this
    if (block === undefined) {
      return Promise.reject(new Error('cannot start mining on empty block'))
    }
    debug('Starting mining', rovers || ROVERS, block.toObject())

    let currentBlocks
    let lastPreviousBlock

    // get latest block from each child blockchain
    try {
      const getKeys: string[] = ROVERS.map(chain => `${chain}.block.latest`)
      currentBlocks = await Promise.all(getKeys.map((key) => {
        return self.persistence.get(key).then(block => {
          this._logger.debug(`Got "${key}"`)
          return block
        })
      }))
      this._logger.info(`Loaded ${currentBlocks.length} blocks from persistence`)
      // get latest known BC block
      try {
        lastPreviousBlock = await self.persistence.get('bc.block.latest')
        self._logger.info(`Got last previous block (height: ${lastPreviousBlock.getHeight()}) from persistence`)
        self._logger.debug(`Preparing new block`)

        const currentTimestamp = ts.nowSeconds()
        if (this._unfinishedBlock !== undefined && getBlockchainsBlocksCount(this._unfinishedBlock) >= 6) {
          this._cleanUnfinishedBlock()
        }
        const [newBlock, finalTimestamp] = prepareNewBlock(
          currentTimestamp,
          lastPreviousBlock,
          currentBlocks,
          block,
          [], // TODO: Transactions added here for AT period
          self._minerKey,
          self._unfinishedBlock
        )
        const work = prepareWork(lastPreviousBlock.getHash(), newBlock.getBlockchainHeaders())
        newBlock.setTimestamp(finalTimestamp)
        self._unfinishedBlock = newBlock
        self._unfinishedBlockData = {
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
          return self.restartMining()
        }

        // if (!this._workerProcess) {
        this._logger.debug(`Starting miner process with work: "${work}", difficulty: ${newBlock.getDifficulty()}, ${JSON.stringify(this._collectedBlocks, null, 2)}`)
        const proc: ChildProcess = fork(MINER_WORKER_PATH)
        this._workerProcess = proc
        // } else {
        //   this._logger.debug(`Sending work to existing miner process (pid: ${this._workerProcess.pid}), work: "${work}", difficulty: ${newBlock.getDifficulty()}, ${JSON.stringify(this._collectedBlocks, null, 2)}`)
        // }
        if (self._workerProcess !== null) {
          // $FlowFixMe - Flow can't find out that ChildProcess is extended form EventEmitter
          self._workerProcess.on('message', this._handleWorkerFinishedMessage.bind(this))
          // $FlowFixMe - Flow can't find out that ChildProcess is extended form EventEmitter
          self._workerProcess.on('error', this._handleWorkerError.bind(this))
          // $FlowFixMe - Flow can't find out that ChildProcess is extended form EventEmitter
          self._workerProcess.on('exit', this._handleWorkerExit.bind(this))
          // $FlowFixMe - Flow can't find out that ChildProcess is extended form EventEmitter
          self._workerProcess.send({
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
          return Promise.resolve(self._workerProcess.pid)
        }
      } catch (err) {
        console.trace(err)
        self._logger.warn(`Error while getting last previous BC block, reason: ${err.message}`)
        return Promise.reject(err)
      }
      return Promise.resolve(false)
    } catch (err) {
      self._logger.warn(`Error while getting current blocks, reason: ${err.message}`)
      return Promise.reject(err)
    }
  }

  stopMining (): bool {
    debug('Stopping mining')

    if (!this._workerProcess) {
      return false
    }

    this._workerProcess.removeAllListeners()
    this._workerProcess.kill()
    this._workerProcess.disconnect()
    this._workerProcess = null
    return true
  }

  restartMining (rovers: string[] = ROVERS): Promise<boolean> {
    debug('Restarting mining', rovers)

    this.stopMining()
    return this.startMining(rovers || ROVERS)
      .then(res => {
        return Promise.resolve(!res)
      })
  }
}
