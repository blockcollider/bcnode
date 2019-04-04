/*
 * Copyright (c) 2017-present, Block Collider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Logger } from 'winston'
import type { RpcTransaction } from '../protos/bc_pb'

// $FlowFixMe: disable warnings from libraries
console.warn = () => {} // eslint-disable-line no-console

const crypto = require('crypto')
const { spawn } = require('child_process')
const { EventEmitter } = require('events')
const { join, resolve } = require('path')
const { existsSync, writeFileSync } = require('fs')

const debug = require('debug')('bcnode:engine')
const { max, merge, is } = require('ramda')
const { queue } = require('async')
const maxmind = require('maxmind')
const LRUCache = require('lru-cache')
const BN = require('bn.js')
const semver = require('semver')
const fkill = require('fkill')
const Random = require('random-js')
const secp256k1 = require('secp256k1')

const { config } = require('../config')
const { ensureDebugPath, isDebugEnabled } = require('../debug')
const { Multiverse } = require('../bc/multiverse')
const { getLogger } = require('../logger')
const { Monitor } = require('../monitor')
const { Node } = require('../p2p')
const { encodeTypeAndData } = require('../p2p/codec')
const { MESSAGES } = require('../p2p/protocol')
const { RoverManager } = require('../rover/manager')
const rovers = require('../rover/manager').rovers
const { Server } = require('../server/index')
const PersistenceRocksDb = require('../persistence').RocksDb
const { PubSub } = require('./pubsub')
const { RpcServer } = require('../rpc/index')
const { getGenesisBlock } = require('../bc/genesis')
const { getBootBlock } = require('../bc/bootblock')
const { BlockPool } = require('../bc/blockpool')
const { validateSequenceDifficulty } = require('../bc/validation')
const { Block, BcBlock, Transaction, TransactionOutput, TransactionInput } = require('../protos/core_pb')
const { RpcTransactionResponseStatus } = require('../protos/bc_pb')
const { errToString } = require('../helper/error')
const { getVersion } = require('../helper/version')
const { MiningOfficer } = require('../mining/officer')
const { WorkerPool } = require('../mining/pool')
const ts = require('../utils/time').default // ES6 default export
const { sortBlocks } = require('../utils/protoBuffers')
const { parseBoolean } = require('../utils/config')
const { txHash, txInputSignature, ScriptTemplates, calcTxFee } = require('../core/txUtils')
const { DexLib } = require('../core/dexLib')
const { TxHandler } = require('../primitives/txHandler')
const TxPendingPool = require('../bc/txPendingPool')
const { UnsettledTxManager } = require('../bc/unsettledTxManager')
const { Wallet } = require('../bc/wallet')
const { blake2bl } = require('../utils/crypto')
const { internalToHuman, internalToBN, humanToBN, COIN_FRACS: { NRG, BOSON } } = require('../core/coin')

const GEO_DB_PATH = resolve(__dirname, '..', '..', 'data', 'GeoLite2-City.mmdb')

const BC_NETWORK: 'main'|'test' = process.env.BC_NETWORK || 'main'
const dataDirSuffix = (BC_NETWORK === 'main') ? '' : `_${BC_NETWORK}net`
const DATA_DIR = `${process.env.BC_DATA_DIR || config.persistence.path}${dataDirSuffix}`
const MONITOR_ENABLED = process.env.BC_MONITOR === 'true'
const BC_CHECK = process.env.BC_CHECK === 'true'
const PERSIST_ROVER_DATA = process.env.PERSIST_ROVER_DATA === 'true'
const BC_BT_VALIDATION = parseBoolean(process.env.BC_BT_VALIDATION)
const BC_REMOVE_BTC = process.env.BC_REMOVE_BTC === 'true'
const BC_FETCH_MISSING_BLOCKS = !!process.env.BC_FETCH_MISSING_BLOCKS
const BC_RUST_MINER = !!process.env.BC_RUST_MINER
const BC_PREVENT_INITAL_SYNC = parseBoolean(process.env.BC_PREVENT_INITAL_SYNC)
const BC_RUST_CLI_PATH = isDebugEnabled()
  ? resolve(__dirname, '..', '..', 'rust', 'bcrust-core', 'target', 'release', 'bcrust-cli')
  : resolve(__dirname, '..', '..', 'rust', 'bcrust-core', 'target', 'debug', 'bcrust-cli')

process.on('uncaughtError', (err) => {
  console.trace(err) // eslint-disable-line no-console
  process.exit(3)
})

export class Engine {
  _logger: Logger
  _monitor: Monitor
  _knownBlocksCache: LRUCache <string, bool>
  _knownFullBlocksCache: LRUCache<string, bool>
  _knownEvaluationsCache: LRUCache <string, bool>
  _rawBlocks: LRUCache < number, Block >
  _node: Node
  _persistence: PersistenceRocksDb
  _pubsub: PubSub
  _rovers: RoverManager
  _rpc: RpcServer
  _server: Server
  _emitter: EventEmitter
  _minerKey: string // TODO only needed because of server touches that - should be passed using constructor?
  _knownRovers: string[]
  _verses: Multiverse[]
  _rawBlock: Block[]
  _subscribers: Object
  _peerIsSyncing: boolean
  _peerIsResyncing: boolean
  _storageQueue: any
  _blockCache: Block[]
  _miningOfficer: MiningOfficer
  _stepSyncTimestamps: number[]
  _geoDb: maxmind.Reader
  _workerPool: WorkerPool
  _txHandler: TxHandler
  _txPendingPool: TxPendingPool
  _unsettledTxManager: UnsettledTxManager
  _dexLib: DexLib
  _wallet: Wallet

  constructor (opts: {
    rovers: string[],
    minerKey: string
  }) {
    this._logger = getLogger(__filename)
    this._knownRovers = opts.rovers
    this._minerKey = opts.minerKey // TODO only needed because of server touches that - should be passed using constructor?
    this._rawBlock = []
    this._blockCache = []
    this._monitor = new Monitor(this, {})
    this._persistence = new PersistenceRocksDb(DATA_DIR)
    this._pubsub = new PubSub()
    this._node = new Node(this)
    this._rovers = new RoverManager()
    this._emitter = new EventEmitter()
    this._rpc = new RpcServer(this)
    this._server = new Server(this, this._rpc)
    this._subscribers = {}
    this._verses = []
    this._stepSyncTimestamps = []
    this._storageQueue = queue((fn, cb) => {
      return fn.then((res) => {
        cb(null, res)
      }).catch((err) => {
        cb(err)
      })
    })

    this._dexLib = new DexLib(this._persistence)

    // Open Maxmind Geo DB
    this._geoDb = maxmind.openSync(GEO_DB_PATH)

    process.on('uncaughtError', (err) => {
      this._logger.error(err)
    })

    this._knownEvaluationsCache = LRUCache({
      max: config.engine.knownBlocksCache.max
    })

    this._knownBlocksCache = LRUCache({
      max: config.engine.knownBlocksCache.max
    })

    this._knownFullBlocksCache = LRUCache({
      max: config.engine.knownFullBlocksCache.max
    })

    this._rawBlocks = LRUCache({
      max: config.engine.rawBlocksCache.max
    })

    this._peerIsSyncing = false
    this._peerIsResyncing = false

    this._txHandler = new TxHandler(this._persistence)
    this._txPendingPool = new TxPendingPool(this._persistence)
    this._unsettledTxManager = new UnsettledTxManager(this._persistence)

    this._wallet = new Wallet(this._persistence, this._unsettledTxManager)

    // Start NTP sync
    ts.start()
  }

  get geoDb (): maxmind.Reader {
    return this._geoDb
  }

  // TODO only needed because of server touches that - should be passed using constructor?
  get minerKey (): string {
    return this._minerKey
  }

  /**
   * Get WorkerPool
   * @returns {WorkerPool|*}
   */
  get workerPool (): WorkerPool {
    return this._workerPool
  }

  /**
   * Get multiverse
   * @returns {Multiverse|*}
   */
  get multiverse (): Multiverse {
    return this.node.multiverse
  }

  set multiverse (multiverse: Multiverse) {
    this.node.multiverse = multiverse
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

  get dexLib (): DexLib {
    return this._dexLib
  }

  get unsettledTxManager (): UnsettledTxManager {
    return this._unsettledTxManager
  }

  initRustMiner () {
    this._logger.info('Starting rust miner', BC_RUST_CLI_PATH)
    const env = isDebugEnabled() ? { RUST_BACKTRACE: 'full' } : {}
    if (existsSync(BC_RUST_CLI_PATH)) {
      const proc = spawn(BC_RUST_CLI_PATH, [], { env: merge(process.env, env) })
      proc.stdout.on('data', (data) => {
        this._logger.info(`bcrust-cli: ${data}`)
      })
      proc.stderr.on('data', (data) => {
        this._logger.info(`bcrust-cli: ${data}`)
      })
      proc.on('close', (code) => {
        this._logger.info(`bcrust-cli: process exited with code ${code}`)
        this.initRustMiner()
      })
    } else {
      this._logger.error("bcrust-cli: rust miner binary doesn't exist")
    }
  }

  /**
   * Initialize engine internals
   *
   * - Open database
   * - Store name of available rovers
   */
  async init () {
    if (BC_RUST_MINER) {
      this.initRustMiner()
    }
    const roverNames = Object.keys(rovers)
    const {
      npm,
      git: {
        long
      }
    } = getVersion()
    const newGenesisBlock = getGenesisBlock()
    const versionData = {
      version: npm,
      commit: long,
      db_version: 1
    }
    const DB_LOCATION = resolve(`${__dirname}/../../${this.persistence._db.location}`)
    const DELETE_MESSAGE = `DB data structure is stale, delete data folder '${DB_LOCATION}' and run bcnode again`
    // TODO get from CLI / config
    try {
      await this._persistence.open()
      let version = await this.persistence.get('appversion')
      // silently continue if version === null - the version is not present so
      // a) very old db
      // b) user just remove database so let's store it
      if (version && semver.lt(version.version, '0.7.7')) { // GENESIS BLOCK 0.9
        this._logger.warn(DELETE_MESSAGE)
        process.exit(8)
      }
      let res = await this.persistence.put('rovers', roverNames)
      if (res) {
        this._logger.debug('stored rovers to persistence')
      }
      res = await this.persistence.put('appversion', versionData)
      if (res) {
        this._logger.debug('stored appversion to persistence')
      }

      if (BC_REMOVE_BTC === true) {
        this._logger.warn('REMOVE BTC BLOCK LATEST FLAG TRIGGERED')
        try {
          await this.persistence.del('btc.block.latest')
        } catch (err) {
          this._logger.debug(err)
        }
        try {
          await this.persistence.del('btc.block.546786')
        } catch (err) {
          this._logger.debug(err)
        }
        try {
          await this.persistence.del('btc.block.546785')
        } catch (err) {
          this._logger.debug(err)
        }
        try {
          await this.persistence.del('btc.block.546784')
        } catch (err) {
          this._logger.debug(err)
        }
      }
      try {
        const latestBlock = await this.persistence.get('bc.block.latest')
        if (!latestBlock) {
          this._logger.warn(`Genesis block not found - assuming fresh DB and storing it`)
          throw new Error('Genesis not found - fallback to store it')
        }
        await this.multiverse.addNextBlock(latestBlock)
        await this.persistence.put('synclock', newGenesisBlock)
        await this.persistence.put('bc.block.oldest', newGenesisBlock)
        await this.persistence.put('bc.block.parent', newGenesisBlock)
        await this.persistence.put('bc.dht.quorum', 0)
        await this.persistence.get('bc.block.1')
      } catch (_) { // genesis block not found
        try {
          await this.persistence.put('synclock', newGenesisBlock)
          await this.persistence.put('bc.block.1', newGenesisBlock)
          // set minted nrg in genesis block
          const tx = newGenesisBlock.getTxsList()[0]
          const txOutputs = tx.getOutputsList()
          let sumSoFar = 0
          for (let output of txOutputs) {
            sumSoFar += parseInt(internalToHuman(output.getValue(), NRG))
          }
          this._logger.info(`set minted nrg: ${sumSoFar} in genesis block`)
          await this.persistence.setNrgMintedSoFar(sumSoFar)

          await this.persistence.put('bc.block.latest', newGenesisBlock)
          await this.persistence.put('bc.block.parent', newGenesisBlock)
          await this.persistence.put('bc.block.oldest', newGenesisBlock)
          await this.persistence.put('bc.block.checkpoint', newGenesisBlock)
          await this.persistence.put('bc.dht.quorum', 0)
          await this.persistence.put('bc.depth', 2)
          await this.multiverse.addNextBlock(newGenesisBlock)
          this._logger.debug('genesis block saved to disk ' + newGenesisBlock.getHash())
        } catch (e) {
          this._logger.error(`error while creating genesis block ${e.message}`)
          process.exit(1)
        }
      }
      if (process.env.BC_BOOT_BLOCK) {
        const bootBlock = getBootBlock(process.env.BC_BOOT_BLOCK)
        await this.persistence.put('bc.block.latest', bootBlock)
        await this.persistence.putBlock(bootBlock, 0)
        await this.multiverse._chain.unshift(bootBlock)
        this._logger.warn('boot block ' + bootBlock.getHeight() + ' assigned as latest block')
      }
    } catch (e) {
      this._logger.warn(`could not store rovers to persistence, reason ${e.message}`)
    }

    if (BC_CHECK === true) {
      await this.integrityCheck()
    }

    if (MONITOR_ENABLED) {
      this._monitor.start()
    }

    // TODO only published in blockpool, needed?
    this.pubsub.subscribe('state.checkpoint.end', '<engine>', (msg) => {
      this._peerIsResyncing = false
    })

    this.pubsub.subscribe('update.block.latest', '<engine>', (msg) => {
      try {
        if (!this._knownEvaluationsCache.has(msg.data.getHash())) {
          this._knownEvaluationsCache.set(msg.data.getHash(), true)
          // TODO: Check if any blocks are not the current one and reuse if its new
          // this could be rebase
          // this.miningOfficer.stopMining(this._workerPool)
          this.updateLatestAndStore(msg)
            .then((previousBlock) => {
              if (msg.mined === true) {
                this._logger.debug(`latest block ${msg.data.getHeight()} has been updated`)
              } else {
                // this.miningOfficer.rebaseMiner()
                // .then((state) => {
                //   this._logger.info(`latest block ${msg.data.getHeight()} has been updated`)
                // })
                // .catch((err) => {
                //   this._logger.error(`error occurred during updateLatestAndStore(), reason: ${err.message}`)
                // })
              }
              this._blockCache.length = 0
              // if(this._blockCache.length > 0){
              //    const candidates = this._blockCache.reduce((all, block) => {
              //      const blockchains = previousBlock.getBlockchainHeaders().toObject()
              //      const key = block.getBlockchain() + 'List'
              //      const headers = blockchains[key]
              //      const found = headers.reduce((f, header) => {
              //         if(all === false) {
              //           if(block.getHeight() > header.getHeight()){
              //              f = true
              //           }
              //         }
              //         return f
              //      }, false)

              //      if(found === true) {
              //        all.push(block)
              //      }
              //      return all
              //    }, [])
              //    this._blockCache.length = 0
              //    if(candidates.length > 0){
              //      this._blockCache = candidates
              //      const nextBlock = this._blockCache.shift()
              //      this.miningOfficer.newRoveredBlock(rovers, nextBlock, this._blockCache)
              //        .then((pid: number | false) => {
              //            if (pid !== false) {
              //                this._logger.info(`collectBlock handler: sent to miner`)
              //            }
              //        })
              //        .catch(err => {
              //            this._logger.error(`could not send to mining worker, reason: ${errToString(err)}`)
              //            process.exit()
              //        })

              //    }
              // }
            })
            .catch((err) => {
              this._logger.info(errToString(err))
              this._logger.error(`error occurred during updateLatestAndStore(), reason: ${err.message}`)
              process.exit()
            })
        }
      } catch (err) {
        this._logger.error(err)
      }
    })

    // GENERATE BLOCKS - BEGIN

    const BC_PLUGIN = process.env.BC_PLUGIN
    if (BC_PLUGIN) {
      const pluginPath = resolve(join(__dirname, '..', '..', BC_PLUGIN))

      try {
        const plugin = require(pluginPath)
        await plugin.main(this)
      } catch (err) {
        this._logger.error('PLUGIN ERROR', err)
        this._logger.error(err)
      }
    }

    this.pubsub.subscribe('miner.block.new', '<engine>', ({
      unfinishedBlock,
      solution
    }) => {
      return this._processMinedBlock(unfinishedBlock, solution).then((res) => {
        if (res === true) {
          return this._broadcastMinedBlock(unfinishedBlock, solution)
            .then((res) => {
              this._logger.info('broadcasted mined block', res)
            })
            .catch((err) => {
              this._logger.error(`mined block broadcast failed -> ${err.message}`)
            })
        }
      })
        .catch((err) => {
          this._logger.warn(err)
        })
    })

    this._workerPool = new WorkerPool(this._persistence, {
      minerKey: this._minerKey
    })

    const miningOfferOpts = {
      minerKey: this._minerKey,
      rovers: this._knownRovers
    }
    this._miningOfficer = new MiningOfficer(this._pubsub, this._persistence, this._workerPool,
      this._txPendingPool, miningOfferOpts
    )

    this._workerPool.emitter.on('mined', (data) => {
      // this.miningOfficer.stopMining()
      fkill('bcworker', { force: true }).then(() => {
        this._logger.info('workers dismissed')
      })
        .catch((err) => {
          this._logger.debug(err)
        })
      this.miningOfficer._handleWorkerFinishedMessage(data)
    })

    this._workerPool.emitter.on('blockCacheRebase', () => {
      this._logger.info('block cache rebase requested')
      this.persistence.get('bc.block.latest').then((previousBlock) => {
        if (this._blockCache.length > 0 && previousBlock) {
          const candidates = this._blockCache.reduce((all, block) => {
            const blockchains = previousBlock.getBlockchainHeaders().toObject()
            const key = block.getBlockchain() + 'List'
            const headers = blockchains[key]
            const found = headers.reduce((f, header) => {
              if (all === false) {
                if (block.getHeight() > header.getHeight()) {
                  f = true
                }
              }
              return f
            }, false)

            if (found === true) {
              all.push(block)
            }
            return all
          }, [])
          this._blockCache.length = 0
          if (candidates.length > 0) {
            this._blockCache = candidates
            const nextBlock = this._blockCache.shift()
            this.miningOfficer.newRoveredBlock(roverNames, nextBlock, this._blockCache)
              .then((pid: number | false) => {
                if (pid !== false) {
                  this._logger.info(`collectBlock reassigned sent to miner`)
                }
              })
              .catch(err => {
                this._logger.error(`could not send to mining worker, reason: ${errToString(err)}`)
                process.exit()
              })
          }
        }
      })
        .catch((err) => {
          this._logger.debug(err)
        })
    })
  }
  /**
   * Store a block in persistence unless its Genesis Block
   * @returns Promise
   */
  async updateLatestAndStore (msg: Object) {
    const block = msg.data
    let storeChildHeaders = {
      btc: false,
      neo: false,
      lsk: true,
      eth: false,
      wav: false
    }
    if (msg.childHeaders !== undefined) {
      storeChildHeaders = msg.childHeaders
    }
    // override all settings if validation mode is strict
    if (BC_BT_VALIDATION === true) {
      storeChildHeaders = {
        btc: false,
        neo: false,
        lsk: false,
        eth: true,
        wav: false
      }
    }
    this._logger.info('store block: ' + block.getHeight() + ' ' + block.getHash())
    try {
      const previousLatest = await this.persistence.get('bc.block.latest')
      const parent = await this.persistence.get('bc.block.parent')
      const synclock = await this.persistence.get('synclock')

      // check if there is a decision tree cycle required
      if (previousLatest &&
        parent &&
        parent.getHash() !== previousLatest.getPreviousHash() &&
        new BN(block.getTotalDistance()).gt(new BN(previousLatest.getTotalDistance())) &&
        new BN(block.getTimestamp()).gte(new BN(previousLatest.getTimestamp()))) {
        // reset to previousLatestPath
        // behavior must be echoed in multiverse
        await this.persistence.put('bc.block.latest', block)
        await this.persistence.putBlock(block, 0)
        await this.persistence.putChildHeaders(block, storeChildHeaders)
      } else if (previousLatest && previousLatest.getHash() === block.getPreviousHash() &&
        new BN(block.getTimestamp()).gt(new BN(parent.getTimestamp())) === true &&
        validateSequenceDifficulty(previousLatest, block) === true) {
        await this.persistence.put('bc.block.parent', previousLatest)
        await this.persistence.put('bc.block.latest', block)
        await this.persistence.putBlock(block, 0)
        await this.persistence.putChildHeaders(block, storeChildHeaders)
      } else if (previousLatest.getHeight() === 1) {
        await this.persistence.put('bc.block.parent', previousLatest)
        await this.persistence.put('bc.block.latest', block)
        await this.persistence.putBlock(block, 0)
        await this.persistence.putChildHeaders(block, storeChildHeaders)
      } else if (msg.force === true &&
        msg.multiverse !== undefined &&
        msg.multiverse.constructor === Array.constructor &&
        synclock &&
        synclock.getHeight() === 1) {
        const oldest = msg.multiverse[msg.multiverse - 1]
        // get the block before the oldest available block
        const grandparent = await this.persistence.get(`bc.block.${oldest.getHeight() - 1}`)
        if (!grandparent || oldest.getPreviousHash() !== grandparent.getHash()) {
          // this is a new chain branch and we must sync for it
          await this.persistence.put('synclock', oldest)
        }
        await this.persistence.put('bc.block.parent', msg.multiverse[1])
        await this.persistence.put('bc.block.latest', block)
        await this.persistence.putBlock(block, 0)
        await this.persistence.putChildHeaders(block, storeChildHeaders)
        /*
         * Remove this after block 100,000
         */
      } else if (msg.force === true &&
              synclock.getHeight() === 1) {
        await this.persistence.put('synclock', block)
        // here we set it up so that on the next cycle we can compare paths
        await this.persistence.put('bc.block.parent', previousLatest)
        await this.persistence.put('bc.block.latest', block)
        await this.persistence.putBlock(block, 0)
        await this.persistence.putChildHeaders(block, storeChildHeaders)
      } else if (parent.getHash() === block.getPreviousHash()) {
        await this.persistence.put('bc.block.latest', block)
        await this.persistence.put(block, 0)
        await this.persistence.putChildHeaders(block, storeChildHeaders)
      } else {
        this._logger.warn('block ' + block.getHeight() + ' ' + block.getHash() + ' as latest block <- mutates chain to stronger branch')
        await this.persistence.put('bc.block.latest', block)
        await this.persistence.put(block, 0)
        await this.persistence.putChildHeaders(block, storeChildHeaders)
      }

      if (msg.multiverse !== undefined) {
        while (msg.multiverse.length > 0) {
          const b = msg.multiverse.pop()
          // strict local only write of genesis block
          if (b.getHeight() > 1) {
            await this.persistence.putBlock(b, 0)
            await this.persistence.putChildHeaders(b, storeChildHeaders)
          }
        }
        return Promise.resolve(block)
      }

      if (this.miningOfficer._canMine === false) {
        this._logger.info('determining if rovered headers include new child blocks')
        const latestRoveredHeadersKeys: string[] = this.miningOfficer._knownRovers.map(chain => `${chain}.block.latest`)
        const latestBlockHeaders = await this.persistence.getBulk(latestRoveredHeadersKeys)
        latestBlockHeaders.map((r) => {
          if (r && this.miningOfficer._collectedBlocks[r.getBlockchain()] < 1) {
            this.miningOfficer._collectedBlocks[r.getBlockchain()]++
          }
        })
      }
      return Promise.resolve(block)
    } catch (err) {
      this._logger.warn(err)
      this._logger.error(errToString(err))
      this._logger.warn('no previous block found')
      // TODO: also move on the top while getting parent and previous latest
      if (block !== undefined && msg.force === true) {
        await this.persistence.put('bc.block.parent', getGenesisBlock())
        await this.persistence.put('bc.block.latest', block)
        await this.persistence.putBlock(block, 0)
        await this.persistence.putChildHeaders(block, storeChildHeaders)
      } else {
        this._logger.warn('submitted block ' + block.getHeight() + ' ' + block.getHash() + ' will not be persisted')
      }
      if (msg.multiverse !== undefined) {
        // assert the valid state of the entire sequence of each rovered chain
        // DISABLED for BT: const multiverseIsValid = this.miningOfficer.validateRoveredSequences(msg.multiverse)
        while (msg.multiverse.length > 0) {
          const b = msg.multiverse.pop()
          if (b.getHeight() > 1) {
            await this.persistence.putBlock(b, 0)
            await this.persistence.putChildHeaders(b, storeChildHeaders)
          }
        }
        return Promise.resolve(block)
      }
      return Promise.resolve(block)
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
  get rawBlock (): ? Block {
    return this._rawBlock
  }

  /**
   * Set rawBlock
   * @param block
   */
  set rawBlock (block: Block) {
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

  get miningOfficer (): MiningOfficer {
    return this._miningOfficer
  }

  /**
   * Start Server
   */
  async startNode () {
    this._logger.info('starting P2P node')
    let nodeObject = false
    const now = Math.floor(Date.now() * 0.001)
    try {
      this._logger.info('loading network key')
      const nodeObjectData = await this.persistence.get('bc.dht.id')
      try {
        nodeObject = JSON.parse(nodeObjectData)
      } catch (_) {
        nodeObject = nodeObjectData
      }
    } catch (_) {
      // empty catch for letting nodeObject be created
    }

    let nodeId
    let nodeTimestamp
    if (!nodeObject) {
      this._logger.warn('P2P node data not stored - needs to be created')
      nodeId = crypto.createHash('sha1').update(crypto.randomBytes(32).toString('hex')).digest('hex')
      nodeObject = {
        id: nodeId,
        timestamp: Math.floor(Date.now() * 0.001)
      }
      this._logger.info('asssigned node key <- ' + nodeId)
      await this.persistence.put('bc.dht.id', nodeObject)
    } else {
      nodeId = nodeObject.id
      nodeTimestamp = nodeObject.timestamp
    }
    this._logger.info('network dht creation timestamp ' + nodeObject.timestamp)

    // if the key is more than 1 week old reset it
    if (nodeTimestamp + 604800 < now) {
      this._logger.warn('key needs to be set')
      nodeId = crypto.createHash('sha1').update(crypto.randomBytes(32).toString('hex')).digest('hex')
      this._logger.info('asssigned node ID <- ' + nodeId)
      await this.persistence.put('bc.dht.id', {
        id: nodeId,
        timestamp: Math.floor(Date.now() * 0.001)
      })
    }

    this._emitter.on('peerCount', (count: Number) => {
      if (this._server) {
        this._server._wsBroadcastPeerConnected(count)
      }
    })

    this._emitter.on('peerConnected', ({
      peer
    }) => {
      if (this._server) {
        this._server._wsBroadcastPeerConnected(peer)
      }
    })

    this._emitter.on('peerDisconnected', ({
      peer
    }) => {
      if (this._server) {
        this._server._wsBroadcastPeerDisonnected(peer)
      }
    })
    return this.node.start(nodeId)
  }

  /**
   * Start rovers
   * @param rovers - list (string; comma-delimited) of rover names to start
   */
  async startRovers (rovers: string[]) {
    this._logger.info(`starting rovers '${rovers.join(',')}'`)

    const needsResyncData = await this.persistence.getDecisivePeriodOfCrossChainBlocksStatus()
    for (const roverName of rovers) {
      if (roverName) {
        this._rovers.startRover(roverName)

        if (!BC_PREVENT_INITAL_SYNC && needsResyncData[roverName]) {
          this._logger.info(`${roverName} rover needs resync`)
          this._rovers.messageRover(roverName, 'needs_resync', needsResyncData[roverName])
        }
      }
    }

    this.workerPool.allRise().then(() => {
      this._emitter.on('collectBlock', ({
        block
      }) => {
        // Persist block if needed
        if (PERSIST_ROVER_DATA === true) {
          this._writeRoverData(block)
        }

        process.nextTick(() => {
          this.miningOfficer.newRoveredBlock(rovers, block, this._blockCache)
            .then((pid: number | false) => {
              if (pid !== false) {
                debug(`collectBlock handler: sent to miner`)
              }
            })
            .catch(err => {
              this._logger.error(`could not send to mining worker, reason: ${errToString(err)}`)
              process.exit()
            })
        })
      })
      this._logger.info('worker pool initialized')
    })
      .catch((err) => {
        this._logger.error(err)
        this._logger.error('critical error required application close')
        process.exit(3)
      })
  }

  async integrityCheck () {
    try {
      const firstBlock = await this.persistence.get('bc.block.1')
      if (!firstBlock) {
        throw new Error('Fallback to catch to reset first block and sync')
      }
      this._logger.info('chain integrity check running')
      const limit = await this.persistence.stepFrom('bc.block', 1)
      this._logger.info('chain integrity: ' + limit)
      await this.persistence.flushFrom('bc.block', limit)
      return Promise.resolve(limit)
    } catch (err) {
      this._logger.error(err)
      this._logger.warn('unable to use default for integrity check')
      try {
        await this.persistence.put('bc.block.1', getGenesisBlock)
        await this.persistence.flushFrom('bc.block', 1)
      } catch (err) {
        this._logger.error(err)
      }
      return Promise.resolve(1)
    }
  }

  /**
   * Takes a range of blocks and validates them against within the contents of a parent and child
   * TODO: Move this to a better location
   * @param blocks BcBlock[]
   */
  async syncSetBlocksInline (blocks: BcBlock[], blockKey: ? string): Promise < Error | bool[] > { // TODO blockKey never used
    let valid = true
    if (blocks.length < 100) {
      valid = await this.multiverse.validateBlockSequenceInline(blocks)
    }
    if (valid === false) {
      return Promise.reject(new Error('invalid sequence of blocks')) // Enabled after target
    }
    let tasks = []
    if (blockKey === undefined) {
      tasks = blocks.map((item) => this.persistence.putBlock(item, 0))
    } else {
      tasks = blocks.map((item) => this.persistence.put(blockKey + '.bc.block.' + item.getHeight(), item))
    }
    await Promise.all(tasks)
    return Promise.resolve(tasks.length)
  }

  async stepSyncHandler (msg: { connection: Object, data: { low: BcBlock, high: BcBlock }}) {
    let cancelSync = false
    const now = Math.floor(Date.now() * 0.001)
    const { connection, data } = msg

    // sync is complete emit event
    if (data.low.getHeight() < 3) {
      this._emitter.emit('synccomplete', true)
      this._stepSyncTimestamps.length = 0
      await this.persistence.put('synclock', getGenesisBlock())
      return
    }

    let previousTimestamp = now
    if (this._stepSyncTimestamps.length > 0) {
      previousTimestamp = this._stepSyncTimestamps[this._stepSyncTimestamps.length - 1]
    }

    this._logger.info('sync request returned from peer in ' + (now - previousTimestamp) + ' seconds')
    await this.persistence.put('synclock', data.low)

    const high = max(3, parseInt(data.low.getHeight(), 10))
    const low = max(2, high - 500)
    const getBlockListMessage = {
      connection,
      data: {
        low: low,
        high: high
      }
    }
    if (cancelSync === false) {
      this._emitter.emit('getblocklist', getBlockListMessage)
    }
  }
  /**
   * New block range received from peer handler
   * @param conn Connection the block was received from
   * @param newBlock Block itself
   */
  blockRangeFromPeer (
    conn: Object,
    blocks: BcBlock[]
  ): void {
    async () => {
      const peerBlocksSorted = blocks.sort((a, b) => {
        if (parseInt(a.getHeight(), 10) > parseInt(b.getHeight(), 10)) {
          return -1
        }
        if (parseInt(a.getHeight(), 10) < parseInt(b.getHeight(), 10)) {
          return 1
        }
        return 0
      })

      this._logger.info(`peer blocks low: ${peerBlocksSorted[0]} high: ${peerBlocksSorted[peerBlocksSorted.length - 1]}`)
      const newBlocksRange = await this._engine.persistence.getBlocksByRangeCached(parseInt(peerBlocksSorted[0].getHeight(), 10),
        parseInt(peerBlocksSorted[peerBlocksSorted.length - 1]))

      this._logger.info(`${blocks.length} blocks sent from peer`)
      this._logger.info(`${newBlocksRange.length} blocks from local`)
      return Promise.resolve(true)
    }
  }

  /**
   * New block received from peer handler
   * @param conn Connection the block was received from
   * @param newBlock Block itself
   */
  blockFromPeer (
    conn: Object,
    newBlock: BcBlock,
    options: { ipd: string, iph: string, fullBlock: bool, sendOnFail: bool } = { ipd: 'pending', iph: 'pending', fullBlock: false, sendOnFail: true }
  ): void {
    (async () => {
      this._logger.info(options)
      const { fullBlock, ipd, iph } = options
      this._logger.info(`block recieved from peer IPH: ${iph} IPD: ${ipd}`)
      let boundariesToFetchPromise = false
      if (BC_FETCH_MISSING_BLOCKS) {
        this._logger.info(`getting missing blocks enabled ${BC_FETCH_MISSING_BLOCKS}`)
        const headers = newBlock.getBlockchainHeaders()
        boundariesToFetchPromise = this.persistence.getBlockBoundariesToFetch(headers)
      }

      // if there are boundaries load them
      const boundaries = boundariesToFetchPromise ? await boundariesToFetchPromise() : false

      if (is(Array, boundaries)) {
        // send fetch_block messages to rovers
        boundaries.forEach(([chain, [previousLatest: Block, currentLatest: Block]]) => {
          this.rovers.messageRover(chain, 'fetch_block', { previousLatest, currentLatest })
        })
      }

      const cache = (fullBlock) ? this._knownFullBlocksCache : this._knownBlocksCache
      this._logger.info(`following boundaries newBlock: ${newBlock.getHeight()}:${newBlock.getHash()}`)
      if (newBlock && !cache.get(newBlock.getHash())) {
        const isValid = await this.persistence.isValidBlockCached(newBlock, { fullBlock })
        if (!isValid) {
          this._logger.info(`Block ${newBlock.getHash()} is not valid`)
          return
        }
        // Add block to LRU cache to avoid processing the same block twice
        this._logger.info(`Adding received ${fullBlock ? 'full ' : ''}block into cache of known blocks - ${newBlock.getHash()}`)
        cache.set(newBlock.getHash(), true)
        this._logger.info(`received new ${fullBlock ? 'full ' : ''}block from peer, height ${newBlock.getHeight()}`)
        const latestBlock = await this.persistence.get('bc.block.latest')
        if (fullBlock) {
          this._logger.info('fullBlock to be expanded')
          if (!latestBlock) {
            this._logger.warn(`blockFromPeer() could not find latest BC block - cannot validate transactions`)
            return
          }
          this._logger.info(`evaluating txs from block ${newBlock.getHeight()}:${newBlock.getHash()}`)
          const validationResult = await this._txHandler.validateTxs(newBlock.getTxsList(), newBlock.getHeight(), latestBlock.getHeight())
          if (validationResult !== true) {
            this._logger.info(`Full block ${newBlock.getHash()} has invalid txs: ${validationResult} --> not a candidate for a new best block`)
          }
          this._logger.info(`passing block to multiverse.AddBlock ${newBlock.getHeight()} : ${newBlock.getHash()} iph: ${iph} ipd: ${ipd}`)
          const { stored, needsResync } = await this.multiverse.addBlock(newBlock, 'peer')
          this._logger.info(`stored: ${stored} ${newBlock.getHeight()}`)
          this._logger.info(`new ${fullBlock ? 'full ' : ''}block ${stored ? 'NOT ' : ''}stored ${newBlock.getHeight()}`)
          if (stored) {
            const txs = newBlock.getTxsList()
            this._logger.info(`Mark ${txs.length} txs from newBlock: ${newBlock.getHeight()} as mined`)
            await this._txPendingPool.markTxsAsMined(txs, 'bc')
            await this._unsettledTxManager.watchCrossChainTx(newBlock)
            await this._unsettledTxManager.markTxAsSettledViaNewBlock(newBlock)

            // update coinbase tx grant
            let mintedNrgTotal = await this.persistence.getNrgMintedSoFar()
            if (!mintedNrgTotal) {
              mintedNrgTotal = 0
            }
            const coinbaseTx = txs[0]
            const minerRewardBN = internalToBN(coinbaseTx.getOutputsList()[0].getValue(), BOSON)

            const blockTxs = txs.slice(1)
            const txFeesBN = blockTxs.map(tx => calcTxFee(tx)).reduce((fee, sum) => sum.add(fee), new BN(0))
            const mintedNrg = parseInt(internalToHuman(minerRewardBN.sub(txFeesBN), NRG))
            this._logger.info(`Mint ${mintedNrg} NRG in block height: ${newBlock.getHeight()}, hash: ${newBlock.getHash()}`)
            await this.persistence.setNrgMintedSoFar(mintedNrg + mintedNrgTotal)
          }
          this._logger.info(`blockFromPeer() iph: ${iph} ipd: ${ipd}`)
          // TODO: Dibsaled if (needsResync && iph === 'complete' && ipd === 'complete') {
          if (needsResync && iph === 'complete' && ipd === 'complete') {
            this._logger.info('requesting block list message')
            const diff = new BN(parseInt(newBlock.getHeight(), 10)).sub(new BN(parseInt(latestBlock.getHeight(), 10)).sub(new BN(4))).toNumber()
            const high = parseInt(newBlock.getHeight(), 10)
            const low = new BN(parseInt(newBlock.getHeight(), 10)).sub(new BN(diff)).toNumber()
            this._logger.info(`requesting GET_BLOCKS from peer low: ${low} high: ${high} diff: ${diff}`)
            const payload = encodeTypeAndData(MESSAGES.GET_BLOCKS, [low, high])
            const result = await this._node.qsend(conn, payload)
            if (result.success === true) {
              this._logger.info('successful update sent to peer')
            }
          } else if (needsResync) {
            this._logger.info(`ignored resync from multiverse IPH: ${iph} IPD: ${ipd}`)
          }
        } else {
          // get a full block
          this._logger.info('no full block found')
          const { stored, needsResync } = await this.multiverse.addBlock(newBlock)
          const request = { dimension: 'hash', id: newBlock.getHash(), connection: conn }
          this._emitter.emit('getTxs', request)
          this._logger.info(`new ${fullBlock ? 'full ' : ''}block ${stored ? 'NOT ' : ''}stored ${newBlock.getHeight()}`)
          // make sure IPH and IPD are complete before asking for sets to catch up
          if (needsResync && iph === 'complete' && ipd === 'complete') {
            if (latestBlock !== null) {
              const diff = new BN(parseInt(newBlock.getHeight(), 10)).sub(new BN(parseInt(latestBlock.getHeight(), 10)).sub(new BN(1))).toNumber()
              const high = parseInt(newBlock.getHeight(), 10)
              const low = new BN(parseInt(newBlock.getHeight(), 10)).sub(new BN(diff)).toNumber()
              this._logger.info(`requesting GET_BLOCKS from peer low: ${low} high: ${high} diff: ${diff}`)
              const payload = encodeTypeAndData(MESSAGES.GET_BLOCKS, [low, high])
              const result = await this._node.qsend(conn, payload)
              if (result.success === true) {
                this._logger.info('successful update sent to peer')
              }
              this._txHandler.validateTxs(newBlock.getTxsList(), newBlock.getHeight(), latestBlock.getHeight()).then(validationResult => {
                if (validationResult !== true) {
                  this._logger.info(`Full block ${newBlock.getHash()} has invalid txs: ${validationResult} --> not a candidate for a new best block`)
                }
                debug(`passing block to multiverse.AddBlock ${newBlock.getHeight()} : ${newBlock.getHash()} iph: ${iph} ipd: ${ipd}`)
                this.multiverse.addBlock(newBlock)
                  .then(async ({ stored, needsResync }) => {
                    this._logger.info(`new ${fullBlock ? 'full ' : ''}block ${stored ? 'NOT ' : ''}stored ${newBlock.getHeight()}`)

                    if (stored) {
                      const txs = newBlock.getTxsList()
                      this._logger.info(`Mark ${txs.length} txs from newBlock: ${newBlock.getHeight()} as mined`)
                      await this._txPendingPool.markTxsAsMined(txs, 'bc')
                      await this._unsettledTxManager.watchCrossChainTx(newBlock)
                      await this._unsettledTxManager.markTxAsSettledViaNewBlock(newBlock)
                      // update coinbase tx grant
                      let mintedNrgTotal = await this.persistence.getNrgMintedSoFar()
                      if (!mintedNrgTotal) {
                        mintedNrgTotal = 0
                      }
                      const coinbaseTx = txs[0]
                      const minerRewardBN = internalToBN(coinbaseTx.getOutputsList()[0].getValue(), BOSON)

                      const blockTxs = txs.slice(1)
                      const txFeesBN = blockTxs.map(tx => calcTxFee(tx)).reduce((fee, sum) => sum.add(fee), new BN(0))
                      const mintedNrg = parseInt(internalToHuman(minerRewardBN.sub(txFeesBN), NRG))
                      this._logger.info(`Mint ${mintedNrg} NRG in block height: ${newBlock.getHeightz()}, hash: ${newBlock.getHash()}`)
                      await this.persistence.setNrgMintedSoFar(mintedNrg + mintedNrgTotal)
                    }

                    debug(`blockFromPeer() iph: ${iph} ipd: ${ipd}`)
                    // TODO: Dibsaled if (needsResync && iph === 'complete' && ipd === 'complete') {
                    if (needsResync && iph === 'complete' && ipd === 'complete') {
                      const getBlockListMessage = {
                        data: {
                          high: newBlock.getHeight(),
                          low: new BN(latestBlock.getHeight()).sub(new BN(12)).toNumber()
                        },
                        connection: conn
                      }
                      this._emitter.emit('getblocklist', getBlockListMessage)
                    } else if (needsResync) {
                      debug(`ignored resync from multiverse IPH: ${iph} IPD: ${ipd}`)
                    }
                  })
                  .catch((err) => {
                    this._logger.error(err)
                    throw new Error(err)
                  })
              })
                .catch((err) => {
                  this._logger.error(err)
                  throw new Error(err)
                })
            }
          } else {
            // get a full block
            const request = { dimension: 'hash', id: newBlock.getHash(), connection: conn }
            this._emitter.emit('getTxs', request)
            this.multiverse.addBlock(newBlock)
              .then(({ stored, needsResync }) => {
                this._logger.info(`new ${fullBlock ? 'full ' : ''}block ${stored ? 'NOT ' : ''}stored ${newBlock.getHeight()}`)
                // make sure IPH and IPD are complete before asking for sets to catch up
                if (needsResync && iph === 'complete' && ipd === 'complete') {
                  this.persistence.get('bc.block.latest').then((latestBlock) => {
                    if (latestBlock !== null) {
                      const getBlockListMessage = {
                        data: {
                          high: newBlock.getHeight(),
                          low: new BN(latestBlock.getHeight()).sub(new BN(12)).toNumber()
                        },
                        connection: conn
                      }
                      this._emitter.emit('getblocklist', getBlockListMessage)
                    } else {
                      this._logger.error(new Error('critical error: unable to get bc.block.latest <- all super collider nodes will be vulnerable'))
                    }
                  }).catch((err) => {
                    this._logger.error(err)
                  })
                }
              })
              .catch((err) => {
                this._logger.error(err)
                throw new Error(err)
              })
          }
        }
      } else {
        this._logger.info(`newBlock already in cache ${newBlock.getHash()}`)
      }
    })().catch(err => {
      this._logger.error(err)
    })
  }

  txFromPeer (conn: Object, newTx: Transaction): void {
    this._txHandler.isValidTx(newTx).then(isValid => {
      if (isValid) {
        // Try to add to pending pool
        this._txPendingPool.tryAddingNewTx(newTx, 'bc').then(_ => {
          // Relay transaction to peers
          this._emitter.emit('announceTx', {
            data: newTx,
            connection: conn
          })
          // For each orphan transaction that uses this one as one of its inputs, run all these steps (including this one) recursively on that orphan

          this._logger.debug(`TX: ${txHash(newTx)} is valid - adding to pool`)
        })
      } else {
        this._logger.info(`TX: ${txHash(newTx)} is invalid - not accepting to the pending TX pool`)
      }
    })
  }

  getMultiverseHandler (conn: Object, newBlocks: BcBlock[]): Promise <boolean> {
    // TODO should stop mining
    // get the lowest of the current multiverse
    try {
      // REPLACE this.miningOfficer.stopMining(this._workerPool)
      this._logger.info('end mining')
      // FIXME this prevents incoming multiverse from peer to be ever handled
      return Promise.resolve(true)
    } catch (e) {
      this._logger.error(e)
    }

    if (newBlocks === undefined || newBlocks.length < 7) {
      this._logger.warn('incomplete multiverse proof')
      return Promise.resolve(true)
    }

    const sorted = sortBlocks(newBlocks)
    const highestReceivedBlock = sorted[0]
    const highestBlock = this.multiverse.getHighestBlock()

    this._logger.info('comparable blocks: ' + sorted.length)
    this._logger.info(highestReceivedBlock.getHash() + ' height: ' + highestReceivedBlock.getHeight() + ' comparing with ' + highestBlock.getHash() + ' height: ' + highestBlock.getHeight())
    let receivedSameOrBetterMultiversePart = false
    // means the newBlock is the newest best highest block
    if (highestBlock && highestBlock.getHash() === highestReceivedBlock.getHash()) {
      receivedSameOrBetterMultiversePart = true
    } else if (highestBlock && sorted && sorted.length > 0) {
      // conanaOut
      receivedSameOrBetterMultiversePart = new BN(highestReceivedBlock.getTotalDistance()).gt(new BN(highestBlock.getTotalDistance()))
      receivedSameOrBetterMultiversePart || this._logger.info('purposed new block has lower total difficulty than current multiverse height')
    } else if (sorted.length < 6) { // XXX explain
      receivedSameOrBetterMultiversePart = true
    }

    if (receivedSameOrBetterMultiversePart === true) {
      // overwrite current multiverse
      const hasBlock = this.multiverse.hasBlock(highestReceivedBlock)
      this._logger.info(highestReceivedBlock.getHash() + ' approved --> assigning as current multiverse')
      this.multiverse.purge()
      this.multiverse.blocks = sorted
      this._logger.info('multiverse has been assigned')

      return this.syncSetBlocksInline(sorted)
        .then((blocksStoredResults) => {
          return this.persistence.put('bc.depth', highestReceivedBlock.getHeight())
            .then(() => {
              // if the block is already in the multiverse dont conduct a full sync
              if (hasBlock === false) {
                this._logger.info('legacy multiverse did not include current block')

                // determine if a sync is already in progress
                return this.multiverse.isSyncLockActive().then((lock) => {
                  if (lock === false) {
                    this._logger.info('lock is set to false')
                    return this.persistence.put('synclock', this.multiverse.getHighestBlock())
                      .then(() => {
                        this._logger.info('synclock was set to ' + this.multiverse.getHighestBlock())
                        this.pubsub.publish('update.block.latest', {
                          key: 'bc.block.latest',
                          data: highestReceivedBlock,
                          force: true,
                          multiverse: this.multiverse.blocks,
                          childHeaders: {
                            btc: true,
                            eth: true,
                            neo: true,
                            lsk: true,
                            wav: true
                          }
                        })
                        this.node.broadcastNewBlock(highestReceivedBlock, conn)
                        this._logger.debug('sync unlocked')
                        const lowestBlock = this.multiverse.getLowestBlock()
                        // dont have to sync
                        if (!lowestBlock || lowestBlock.getHeight() - 1 < 2) {
                          return Promise.resolve(true)
                        }

                        this._emitter.emit('getblocklist', {
                          data: {
                            low: max(2, highestReceivedBlock.getHeight() - 500),
                            high: max(3, highestReceivedBlock.getHeight())
                          },
                          connection: conn
                        })

                        return Promise.resolve(true)
                      })
                      .catch((e) => {
                        this._logger.error(e)
                        return this.persistence.put('synclock', getGenesisBlock()).then(() => {
                          this._logger.info('sync reset')
                          return Promise.resolve(true)
                        })
                          .catch((e) => {
                            this._logger.error(e)
                            return Promise.resolve(true)
                          })
                      })
                  } else {
                    this.pubsub.publish('update.block.latest', {
                      key: 'bc.block.latest',
                      data: highestReceivedBlock,
                      force: true,
                      multiverse: this.multiverse.blocks // TODO not used in handler
                    })
                    this.node.broadcastNewBlock(highestReceivedBlock)
                    return Promise.resolve(true)
                  }
                })
                  .catch((e) => {
                    this._logger.error(e)
                    return Promise.reject(e)
                  })
              } else {
                return this.persistence.put('synclock', getGenesisBlock()).then(() => {
                  this._logger.info('sync reset')
                  return Promise.resolve(true)
                })
              }
              // assign where the last sync began
            })
            .catch(e => {
              this._logger.error(errToString(e))
              return this.persistence.put('synclock', getGenesisBlock()).then(() => {
                this._logger.info('sync reset')
                return Promise.resolve(true)
              })
                .catch((e) => {
                  this._logger.error(e)
                  return Promise.resolve(true)
                })
            })
        })

        .catch((e) => {
          this._logger.error(e)
          return Promise.resolve(true)
        })
    } else {
      this._logger.info('resync conditions failed')
      return this.persistence.put('synclock', getGenesisBlock()).then(() => {
        this._logger.info('sync reset')
        return Promise.resolve(true)
      })
        .catch((e) => {
          this._logger.error(e)
          return Promise.resolve(true)
        })
    }
  }

  async createCrossChainTakerTx (
    takerWantsAddress: string, takerSendsAddress: string,
    makerTxHash: string, makerTxOutputIndex: number,
    takerBCAddress: string, takerBCPrivateKeyHex: string,
    collateralizedNrg: string, additionalTxFee: string
  ): Promise<{ status: number, txHash?: string, error?: Error}> {
    this._logger.info(`Trying to create createCrossChainTakerTx: ${arguments}`)

    try {
      const txTemplate = await this.dexLib.placeTakerOrder(
        takerWantsAddress, takerSendsAddress,
        makerTxHash, makerTxOutputIndex,
        takerBCAddress, takerBCPrivateKeyHex,
        collateralizedNrg, additionalTxFee,
        this._minerKey
      )

      return new Promise((resolve, reject) => {
        this._txHandler.isValidTx(txTemplate).then(isValid => {
          if (isValid) {
            // Try to add to pending pool
            this._logger.info(`adding crosschain taker tx to the pending pool: ${txTemplate.getHash()}`)
            this._txPendingPool.tryAddingNewTx(txTemplate, 'bc').then(_ => {
              // Relay transaction to peers
              this._emitter.emit('announceTx', {
                data: txTemplate
              })

              this._logger.debug(`TX: ${txHash(txTemplate)} is valid - adding to pool`)
              return resolve({ status: RpcTransactionResponseStatus.SUCCESS, txHash: txTemplate.getHash() })
            })
          } else {
            this._logger.info(`TX: ${txHash(txTemplate)} is invalid - not accepting to the pending TX pool`)
            return resolve({ status: RpcTransactionResponseStatus.FAILURE, error: new Error('invalid tx') })
          }
        })
      })
    } catch (e) {
      this._logger.error(e)
      return { status: RpcTransactionResponseStatus.FAILURE, error: e }
    }
  }

  async createCrossChainMakerTx (
    shift: string, deposit: string, settle: string,
    payWithChainId: string, wantChainId: string, receiveAddress: string, makerWantsUnit: string, makerPaysUnit: string,
    makerBCAddress: string, makerBCPrivateKeyHex: string,
    collateralizedNrg: string, nrgUnit: string, additionalTxFee: string
  ): Promise<{ status: number, txHash?: string, error?: Error}> {
    this._logger.info(`Trying to create createCrossChainMakerTx: ${arguments}`)

    try {
      const txTemplate = await this.dexLib.placeMakerOrder(
        shift, deposit, settle,
        payWithChainId, wantChainId, receiveAddress, makerWantsUnit, makerPaysUnit,
        makerBCAddress, makerBCPrivateKeyHex,
        collateralizedNrg, nrgUnit,
        additionalTxFee,
        this._minerKey
      )

      return new Promise((resolve, reject) => {
        this._txHandler.isValidTx(txTemplate).then(isValid => {
          if (isValid) {
            // Try to add to pending pool
            this._logger.info(`adding crosschain maker tx to the pending pool: ${txTemplate.getHash()}`)
            this._txPendingPool.tryAddingNewTx(txTemplate, 'bc').then(_ => {
              // Relay transaction to peers
              this._emitter.emit('announceTx', {
                data: txTemplate
              })

              this._logger.debug(`TX: ${txHash(txTemplate)} is valid - adding to pool`)
              return resolve({ status: RpcTransactionResponseStatus.SUCCESS, txHash: txTemplate.getHash() })
            })
          } else {
            this._logger.info(`TX: ${txHash(txTemplate)} is invalid - not accepting to the pending TX pool`)
            return resolve({ status: RpcTransactionResponseStatus.FAILURE, error: new Error('invalid tx') })
          }
        })
      })
    } catch (e) {
      this._logger.error(e)
      return { status: RpcTransactionResponseStatus.FAILURE, error: e }
    }
  }

  async createTx (newTx: RpcTransaction) : Promise<{ status: number, txHash?: string, error?: Error}> {
    const obj = newTx.toObject()
    this._logger.info(`Trying to create TX: ${JSON.stringify(obj)}`)
    const latestBlock = await this.persistence.get('bc.block.latest')

    let balanceData
    try {
      balanceData = await this._wallet.getBalanceData(newTx.getFromAddr().toLowerCase())
    } catch (e) {
      const msg = `Could not find balance for given from address: ${newTx.getFromAddr()}, ${e}`
      this._logger.warn(msg)
      throw new Error(msg)
    }

    this._logger.info(`NRG managed by address confirmed: ${balanceData.confirmedUnspentOutPoints.length} unconfirmed: ${balanceData.unconfirmedUnspentOutPoints.length}`)

    const transferAmountBN = humanToBN(newTx.getAmount(), NRG)
    const txFee = newTx.getTxFee()
    let txFeeBN = new BN(0)
    if (txFee !== 0) {
      txFeeBN = humanToBN(newTx.getTxFee(), NRG)
    }
    this._logger.info(`has: ${internalToHuman(balanceData.confirmed, NRG)}, transfer: ${internalToHuman(transferAmountBN, NRG)}, fee: ${internalToHuman(txFeeBN, NRG)}`)
    if ((transferAmountBN.add(txFeeBN)).gt(balanceData.confirmed)) {
      this._logger.error(`${newTx.getFromAddr()} not enough balance, has: ${internalToHuman(balanceData.confirmed, NRG)}, transfer: ${internalToHuman(transferAmountBN, NRG)}, fee: ${internalToHuman(txFeeBN.toBuffer(), NRG)}`)
      throw new Error(`${newTx.getFromAddr()} not enough balance`)
    }

    const newOutputToReceiver = new TransactionOutput()
    const outputLockScript = ScriptTemplates.createNRGOutputLockScript(newTx.getToAddr())

    newOutputToReceiver.setValue(new Uint8Array(transferAmountBN.toBuffer()))
    newOutputToReceiver.setUnit(new Uint8Array(new BN(1).toBuffer()))
    newOutputToReceiver.setScriptLength(outputLockScript.length)
    newOutputToReceiver.setOutputScript(new Uint8Array(Buffer.from(outputLockScript, 'ascii')))

    const txTemplate = new Transaction()
    const txTemplateOutputs = [newOutputToReceiver]
    txTemplate.setNonce('0')
    txTemplate.setNoutCount(1)

    let leftChangeOutput = null
    let amountAdded = new BN(0)
    const spentOutPoints = []
    for (let outPoint of balanceData.confirmedUnspentOutPoints) {
      spentOutPoints.push(outPoint)

      const unspentChunkValue = internalToBN(outPoint.getValue(), BOSON)
      amountAdded = amountAdded.add(unspentChunkValue)

      if (amountAdded.gt(transferAmountBN.add(txFeeBN)) === true && txTemplate.getOverline() === '') {
        const changeBN = amountAdded.sub(transferAmountBN).sub(txFeeBN)
        leftChangeOutput = new TransactionOutput()
        const outputLockScript = [
          'OP_BLAKE2BL',
          blake2bl(blake2bl(newTx.getFromAddr().toLowerCase())),
          'OP_EQUALVERIFY',
          'OP_CHECKSIGVERIFY'
        ].join(' ')
        leftChangeOutput.setValue(new Uint8Array(changeBN.toBuffer()))
        leftChangeOutput.setUnit(new Uint8Array(new BN(1).toBuffer()))
        leftChangeOutput.setScriptLength(outputLockScript.length)
        leftChangeOutput.setOutputScript(new Uint8Array(Buffer.from(outputLockScript, 'ascii')))

        break
      }
    }
    if (leftChangeOutput) {
      txTemplateOutputs.push(leftChangeOutput)
    }
    txTemplate.setOutputsList(txTemplateOutputs)
    txTemplate.setNoutCount(txTemplateOutputs.length)

    const txTemplateInputs = spentOutPoints.map((outPoint) => {
      // txInputSignature requires txTemplate sets the outputs first
      const signature = txInputSignature(outPoint, txTemplate, Buffer.from(newTx.getPrivateKeyHex(), 'hex'))
      const pubKey = secp256k1.publicKeyCreate(Buffer.from(newTx.getPrivateKeyHex(), 'hex'), true)
      const input = new TransactionInput()
      input.setOutPoint(outPoint)
      const inputUnlockScript = [
        signature.toString('hex'),
        pubKey.toString('hex'),
        blake2bl(newTx.getFromAddr())
      ].join(' ')

      input.setScriptLength(inputUnlockScript.length)
      input.setInputScript(new Uint8Array(Buffer.from(inputUnlockScript, 'ascii')))
      return input
    })
    txTemplate.setInputsList(txTemplateInputs)
    txTemplate.setNinCount(txTemplateInputs.length)

    txTemplate.setVersion(1)
    txTemplate.setNonce(`${Math.abs(Random.engines.nativeMath())}${this._minerKey}`) // rnd + minerKey
    txTemplate.setLockTime(latestBlock.getHeight() + 1)

    const txTemplateHash = txHash(txTemplate)
    txTemplate.setHash(txTemplateHash)

    this._logger.debug(JSON.stringify(txTemplate.toObject()))

    const isValid = await this._txHandler.isValidTx(txTemplate)
    if (isValid) {
      const wasAdded = await this._txPendingPool.tryAddingNewTx(txTemplate, 'bc')
      if (wasAdded) {
        this._emitter.emit('announceTx', {
          data: txTemplate
        })
        return { status: RpcTransactionResponseStatus.SUCCESS, txHash: txTemplateHash }
      } else {
        return { status: RpcTransactionResponseStatus.FAILURE, error: new Error('failed to add to tx pool') }
      }
    } else {
      return { status: RpcTransactionResponseStatus.FAILURE, error: new Error('invalid tx') }
    }
  }

  /**
   * Start Server
   *
   * @param opts Options to start server with
   */
  startServer (opts: { rpc: boolean, ui: boolean, ws: boolean, rpcSecureCookie: ?string }) {
    this.server.run(opts)
  }

  requestExit () {
    ts.stop()
    this.miningOfficer.stop()
    return this._rovers.killRovers()
  }

  _writeRoverData (newBlock: BcBlock) {
    const dataPath = ensureDebugPath(`bc/rover-block-data.csv`)
    const rawData = JSON.stringify(newBlock)
    writeFileSync(dataPath, `${rawData}\r\n`, {
      encoding: 'utf8',
      flag: 'a'
    })
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
  _broadcastMinedBlock (newBlock: BcBlock, solution: Object): Promise < boolean > {
    if (!newBlock) {
      return Promise.reject(new Error('cannot broadcast empty block'))
    }

    try {
      const newBlockObj = {
        ...newBlock.toObject(),
        iterations: solution.iterations,
        timeDiff: solution.timeDiff
      }
      this.pubsub.publish('block.mined', {
        type: 'block.mined',
        data: newBlockObj
      })
      this._logger.info('broadcasting block challenge ' + newBlock.getHeight() + ' -> considered next block in current multiverse')
      this.node.broadcastNewBlock(newBlock)
      this._persistence.putBlock(newBlock, 0)
      // NOTE: Do we really need nested try-catch ?
    } catch (err) {
      return Promise.reject(err)
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
  _processMinedBlock (newBlock: BcBlock, solution: Object): Promise < bool > {
    // TODO: reenable this._logger.info(`Mined new block: ${JSON.stringify(newBlockObj, null, 2)}`)
    // Trying to process null/undefined block
    if (newBlock === null || newBlock === undefined) {
      this._logger.warn('Failed to process work provided by miner')
      return Promise.resolve(false)
    }

    // Prevent submitting mined block twice
    if (this._knownBlocksCache.has(newBlock.getHash())) {
      this._logger.warn('received duplicate new block ' + newBlock.getHeight() + ' (' + newBlock.getHash() + ')')
      try {
        // REPLACE this.miningOfficer.stopMining(this._workerPool)
        this._logger.info('end mining')
        return Promise.resolve(true)
      } catch (e) {
        this._logger.warn('unable to stop miner')
        this._logger.error(e)
        return Promise.resolve(false)
      }
    }

    this._knownBlocksCache.set(newBlock.getHash(), true)
    this._logger.info('submitting mined block to current multiverse')

    return this.multiverse.addBlock(newBlock)
      .then(({ stored, needsResync }) => {
        // TODO handler needsResync?
        this._logger.info(`new mined block ${stored ? 'NOT ' : ''}stored ${newBlock.getHeight()}`)
        return this._txPendingPool.markTxsAsMined(newBlock.getTxsList(), 'bc').then(_ => {
          return Promise.resolve(true)
        })
      })
      .catch((err) => {
        this._logger.error(err)
        throw new Error(err)
      })

    // return this.multiverse.addNextBlock(newBlock)
    //  .then((isNextBlock) => {
    //    // $FlowFixMe
    //    // if (isNextBlock) {
    //    // TODO: this will break now that _blocks is not used in multiverse
    //    // if (this.multiverse.getHighestBlock() !== undefined &&
    //    //    this.multiverse.validateBlockSequenceInline([this.multiverse.getHighestBlock(), newBlock]) === true) {
    //    if (isNextBlock === true || BC_BT_VALIDATION === true) {
    //      let options: {
    //        key: string,
    //        data: BcBlock,
    //        mined: bool,
    //        force?: bool
    //      } = {
    //        key: 'bc.block.latest',
    //        data: newBlock,
    //        mined: true
    //      }

    //      if (BC_BT_VALIDATION === true && new BN(newBlock.getHeight()).lt(new BN(533225)) === true) {
    //        options.force = true
    //      }

    //      this.pubsub.publish('update.block.latest', options)
    //      this._server._wsBroadcastMultiverse(this.multiverse)
    //      this._logger.info('multiverse coverage: ' + this.multiverse.length)
    //      // check if we know the peer
    //      return Promise.resolve(true)
    //    } else if (BC_BT_VALIDATION !== true) {
    //      const highestBlock = this.multiverse.getHighestBlock()
    //      if (highestBlock) {
    //        this._logger.warn('local mined block ' + newBlock.getHeight() + ' does not stack on multiverse height ' + highestBlock.getHeight())
    //        this._logger.warn('mined block ' + newBlock.getHeight() + ' cannot go on top of multiverse block ' + highestBlock.getHash())
    //      }
    //      return Promise.resolve(true)
    //      // return this.miningOfficer.rebaseMiner()
    //      //  .then((res) => {
    //      //    this._logger.info(res)
    //      //  })
    //      //  .catch((e) => {
    //      //    this._logger.error(errToString(e))
    //      //  })
    //    } else if (BC_BT_VALIDATION === true) {
    //      let options: {
    //        key: string,
    //        data: BcBlock,
    //        mined: bool,
    //        force?: bool
    //      } = {
    //        key: 'bc.block.latest',
    //        data: newBlock,
    //        mined: true
    //      }

    //      if (BC_BT_VALIDATION === true && new BN(newBlock.getHeight()).lt(new BN(531581)) === true) {
    //        options.force = true
    //        this.pubsub.publish('update.block.latest', options)
    //        this._server._wsBroadcastMultiverse(this.multiverse)
    //        this._logger.info('multiverse coverage: ' + this.multiverse.length)
    //      }

    //      return Promise.resolve(true)
    //    }
    //  })
    //  .catch((err) => {
    //    this._logger.error(err)
    //    return Promise.resolve(false)
    //  })
  }
}

export default Engine
