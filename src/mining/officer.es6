/*
 * Copyright (c) 2017-present, Block Collider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Logger } from 'winston'
import type { PubSub } from '../engine/pubsub'
import type { RocksDb } from '../persistence'
import type TxPendingPool from '../bc/txPendingPool'

const { writeFileSync } = require('fs')
const { inspect } = require('util')
const fkill = require('fkill')

const crypto = require('crypto')
const BN = require('bn.js')
const debug = require('debug')('bcnode:mining:officer')
const { max, mean, all, equals, flatten, fromPairs, last, range, values } = require('ramda')

const { prepareWork, prepareNewBlock, getUniqueBlocks } = require('./primitives')
const { getLogger } = require('../logger')
const { Block, BcBlock, BlockchainHeaders } = require('../protos/core_pb')
const { MinerRequest, MinerResponseResult } = require('../protos/miner_pb')
const { RpcClient } = require('../rpc')
const { isDebugEnabled, ensureDebugPath } = require('../debug')
const { validateRoveredSequences, isValidBlock } = require('../bc/validation')
const { getBlockchainsBlocksCount } = require('../bc/helper')
const { WorkerPool } = require('./pool')
const ts = require('../utils/time').default // ES6 default export
const { parseBoolean } = require('../utils/config')
// const { txCreateCoinbase, getMaxBlockSize, COINBASE_TX_ESTIMATE_SIZE } = require('../core/txUtils')
const { txCreateCoinbase, COINBASE_TX_ESTIMATE_SIZE } = require('../core/txUtils')

const MIN_HEALTH_NET = process.env.MIN_HEALTH_NET === 'true'
const DISABLE_IPH_TEST = parseBoolean(process.env.DISABLE_IPH_TEST)
const BC_RUST_MINER = parseBoolean(process.env.BC_RUST_MINER)

type UnfinishedBlockData = {
  lastPreviousBlock: ?BcBlock,
  block: ?Block,
  currentBlocks: ?{ [blokchain: string]: Block },
  iterations: ?number,
  timeDiff: ?number
}

const keyOrMethodToChain = (keyOrMethod: string) => keyOrMethod.replace(/^get|set/, '').replace(/List$/, '').toLowerCase()
// const chainToSet = (chain: string) => `set${chain[0].toUpperCase() + chain.slice(1)}List` // UNUSED
const chainToGet = (chain: string) => `get${chain[0].toUpperCase() + chain.slice(1)}List`

export class MiningOfficer {
  _logger: Logger
  _minerKey: string
  _pubsub: PubSub
  _persistence: RocksDb
  _timers: Object
  _timerResults: Object
  _knownRovers: string[]
  _speedResults: number[]

  _collectedBlocks: { [blockchain: string]: number }
  _canMine: bool
  _workerPool: WorkerPool
  _unfinishedBlock: ?BcBlock
  _unfinishedBlockData: ?UnfinishedBlockData
  _unfinished: Object[]
  _paused: bool
  _blockTemplates: Object[]
  _rpc: RpcClient
  _txPendingPool: TxPendingPool

  constructor (pubsub: PubSub, persistence: RocksDb, workerPool: Object, txPendingPool: TxPendingPool, opts: { minerKey: string, rovers: string[] }) {
    this._logger = getLogger(__filename)
    this._minerKey = opts.minerKey
    this._pubsub = pubsub
    this._persistence = persistence
    this._knownRovers = opts.rovers
    this._unfinished = []
    this._workerPool = workerPool

    this._speedResults = []
    this._collectedBlocks = {}
    for (let roverName of this._knownRovers) {
      this._collectedBlocks[roverName] = 0
    }
    this._canMine = false
    this._timers = {}
    this._timerResults = {}
    this._unfinishedBlockData = { block: undefined, lastPreviousBlock: undefined, currentBlocks: {}, timeDiff: undefined, iterations: undefined }
    this._paused = false
    this._blockTemplates = []

    this._rpc = new RpcClient()
    this._txPendingPool = txPendingPool
  }

  get persistence (): RocksDb {
    return this._persistence
  }

  get pubsub (): PubSub {
    return this._pubsub
  }

  get paused (): bool {
    return this._paused
  }

  set paused (paused: bool) {
    this._paused = paused
  }

  // TODO: PING
  async newRoveredBlock (rovers: string[], block: Block, blockCache: ?Block[]): Promise<number|false> {
    let iph
    debug(`DISABLE_IPH_TEST: ${DISABLE_IPH_TEST}`)
    if (DISABLE_IPH_TEST === false) {
      iph = await this._persistence.get('bc.sync.initialpeerheader')
    } else {
      // allows mining to continue by force passing the IPH test
      this._logger.warn('SECURITY ALERT: IPH test is has been overridden by DISABLE_IPH_TEST')
      iph = 'complete'
    }

    this._collectedBlocks[block.getBlockchain()] += 1
    this._logger.info('[] <- [] ' + 'rovered ' + block.getBlockchain() + ' block ' + block.getHeight() + ' ' + block.getHash())
    // TODO: Adjust minimum count of collected blocks needed to trigger mining
    // this._canMine = true
    if (!this._canMine && all((numCollected: number) => numCollected >= 1, values(this._collectedBlocks))) {
      this._canMine = true
    }

    if (this._canMine === true && MIN_HEALTH_NET === false) {
      try {
        const quorum = await this._persistence.get('bc.dht.quorum')
        if (quorum === null) {
          this._canMine = false
          this._logger.error('quorum state is not persisted on disk')
          return Promise.reject(new Error('critical error -> restart application'))
        }
        if (parseInt(quorum, 10) < 1 && this._canMine === true) {
          this._logger.info('peer waypoint discovery in progress')
          this._canMine = false
          return Promise.resolve(false)
        }
      } catch (err) {
        this._canMine = false
        this._logger.error('quorum state is not persisted on disk')
        this._logger.error(err)
        return Promise.reject(new Error('critical error -> restart application'))
      }
    }

    // make sure the miner has at least two blocks of the depth
    if (this._canMine === true && MIN_HEALTH_NET === false) {
      try {
        const parent = await this._persistence.get('bc.block.parent')
        // DISABLED UNTIL AT
        // const latest = await this._persistence.get('bc.block.latest')
        // if (!latest || parent.getHash() !== latest.getPreviousHash()) {
        // this._logger.warn('after resync approval rovers must complete new multiverse')
        // this._canMine = false
        // return Promise.resolve(false)
        // }
        if (!parent || parent.getHeight() === '1') {
          this._logger.warn('searching for additional blocks before initiating mining process')
          this._canMine = false
        }
      } catch (err) {
        this._canMine = false
        this._logger.error('unable to assert parent block of highest block')
        return Promise.reject(new Error('crtical error -> restart application'))
      }
    }

    // Check if _canMine
    // if iph is complete or pending mining can start
    // if iph is running mining can start
    if (!this._canMine && iph === 'complete') {
      const keys = Object.keys(this._collectedBlocks)
      const values = '[' + keys.reduce((all, a, i) => {
        const val = this._collectedBlocks[a]
        if (i === (keys.length - 1)) {
          all = all + a + ':' + val
        } else {
          all = all + a + ':' + val + ' '
        }
        return all
      }, '') + ']'

      const totalBlocks = keys.reduce((all, key) => {
        return all + this._collectedBlocks[key]
      }, 0)

      this._logger.info('constructing multiverse with blockchains ' + values)
      this._logger.info('multiverse depth ' + totalBlocks)
      return Promise.resolve(false)
    }

    // Check if peer is syncing
    if (this.paused) {
      this._logger.info(`mining and ledger updates disabled until initial multiverse threshold is met`)
      return Promise.resolve(false)
    }

    // Check if all rovers are enabled
    if (equals(new Set(this._knownRovers), new Set(rovers)) === false) {
      this._logger.info(`consumed blockchains manually overridden, mining services disabled, active multiverse rovers: ${JSON.stringify(rovers)}, known: ${JSON.stringify(this._knownRovers)})`)
      return Promise.resolve(false)
    }

    // $FlowFixMe
    return this.startMining(rovers, block, blockCache)
      .then((res) => {
        this._logger.info('mining cycle initiated')
        return Promise.resolve(res)
      })
      .catch((err) => {
        this._logger.error(err)
        return Promise.reject(err)
      })
  }

  stop () {
    this.stopMining()
    this._cleanUnfinishedBlock()
  }

  startTimer (name: string): void {
    this._timers[name] = Math.floor(Date.now() * 0.001)
  }

  // TODO: will have to remake, no boundaries
  stopTimer (name: string): number {
    if (this._timers[name] !== undefined) {
      const startTime = this._timers[name]
      delete this._timers[name]
      const elapsed = Math.floor(Date.now() * 0.001) - startTime
      if (this._timerResults[name] === undefined) {
        this._timerResults[name] = []
      }
      this._timerResults[name].push(elapsed)
      return elapsed
    }
    return 0
  }

  getTimerResults (name: string): ?number {
    if (this._timerResults[name] !== undefined && this._timerResults[name].length > 4) {
      return mean(this._timerResults[name])
    }
  }

  // TODO: PING
  async startMining (rovers: string[], block: Block, blockCache: ?Block[]): Promise<bool|number> {
    // get latest block from each child blockchain
    //
    // ////////////// --> runs everytime

    const lastPreviousBlock = await this.persistence.get('bc.block.latest')
    if (!lastPreviousBlock) {
      const msg = 'Could not fetch bc.block.latest'
      this._logger.warn(msg)
      throw new Error(msg)
    }

    this._logger.info(`local persisted block height: ${lastPreviousBlock.getHeight()}`)
    // [eth.block.latest,btc.block.latest,neo.block.latest...]
    const latestRoveredHeadersKeys: string[] = this._knownRovers.map(chain => `${chain}.block.latest`)
    const latestBlockHeaders = await this.persistence.getBulk(latestRoveredHeadersKeys)
    // { eth: 200303, btc:2389, neo:933 }
    const latestBlockHeadersHeights = fromPairs(latestBlockHeaders.map(header => [header.getBlockchain(), header.getHeight()]))
    this._logger.debug(`latestBlockHeadersHeights: ${inspect(latestBlockHeadersHeights)}`)

    // collider is starting up
    // if (lastPreviousBlock.getHeight() === 1 && blockCache.length > 0) {
    //  this._logger.info('rovered block indexed')
    //  blockCache.push(block)
    //  return Promise.resolve(true)
    // } else if (lastPreviousBlock.getTimestamp() + 6 > Math.floor(Date.now() * 0.001) &&
    //           blockCache.length > 0) {
    //  this._logger.info('rovered block indexed')
    //  blockCache.push(block)
    //  return Promise.resolve(true)
    /// / otherwise reset the cache
    // } else if (blockCache.length > 0) {
    //  blockCache.length = 0
    // }

    // prepare a list of keys of headers to pull from persistence
    const newBlockHeadersKeys = flatten(Object.keys(lastPreviousBlock.getBlockchainHeaders().toObject()).map(listKey => {
      this._logger.debug('assembling minimum heights for ' + listKey)
      const chain = keyOrMethodToChain(listKey)
      const lastHeaderInPreviousBlock = last(lastPreviousBlock.getBlockchainHeaders()[chainToGet(chain)]())

      let from
      let to
      if (lastPreviousBlock.getHeight() === 1) { // genesis
        // just pick the last known block for genesis
        from = latestBlockHeadersHeights[chain]// TODO check, seems correct
        to = from
      } else {
        // if (!lastHeaderInPreviousBlock) {
        //   throw new Error(`previous NRG block ${lastPreviousBlock.getHeight()} failed minimum "${chain}" state changes`)
        // }
        from = lastHeaderInPreviousBlock.getHeight() + 1
        to = latestBlockHeadersHeights[chain]
      }

      this._logger.debug(`newBlockHeadersKeys, heights nrg: ${lastPreviousBlock.getHeight()}, ${chain} ln: ${from}, ${to}`)

      if (from === to) {
        return [`${chain}.block.${from}`]
      }

      if (from > to) {
        return []
      }

      if (to === undefined) {
        to = from + 1
      }

      from = max(to - 15, from)

      this._logger.info('chain: ' + chain + 'from: ' + from + ' to: ' + to)

      return [range(from, to + 1).map(height => `${chain}.block.${height}`)]
    }))

    this._logger.debug(`loading ${inspect(newBlockHeadersKeys)}`)

    // get latest known BC block
    try {
      const currentBlocks = await this.persistence.getBulk(newBlockHeadersKeys)
      if (!currentBlocks) {
        throw new Error(`Could not fetch current rovered block headers: ${newBlockHeadersKeys}`)
      }
      this._logger.debug(`preparing new block`)
      const currentTimestamp = ts.nowSeconds()
      if (this._unfinishedBlock !== undefined && getBlockchainsBlocksCount(this._unfinishedBlock) >= 6) {
        this._cleanUnfinishedBlock()
      }
      // TODO: After executive branches switch this
      const maxBlockSize = 10000000 // await getMaxBlockSize(this._minerKey, this.persistence) - COINBASE_TX_ESTIMATE_SIZE
      const maxNumberOfTx = Math.floor(maxBlockSize / COINBASE_TX_ESTIMATE_SIZE)

      const candidateTxs = await this._txPendingPool.loadBestPendingTxs(maxNumberOfTx)
      let txsSizeSoFar = 0
      const txsToMine = []
      for (let tx of candidateTxs) {
        const thisTxSize = tx.serializeBinary().length
        this._logger.debug(`tx size for hash: ${tx.getHash()}, size: ${thisTxSize}`)
        if (txsSizeSoFar + thisTxSize > maxBlockSize) {
          break
        }
        txsSizeSoFar += thisTxSize
        txsToMine.push(tx)
      }

      const coinbaseTx = await txCreateCoinbase(
        lastPreviousBlock.getHeight(),
        this.persistence,
        txsToMine,
        this._minerKey
      )
      const allTxs = [coinbaseTx].concat(txsToMine)

      this._logger.info(
        `txs unclaimed, length: ${allTxs.length}, size: ${txsSizeSoFar + coinbaseTx.serializeBinary().length}, maxBlockSize: ${maxBlockSize}`
      )

      const [newBlock, finalTimestamp] = prepareNewBlock(
        currentTimestamp,
        lastPreviousBlock,
        currentBlocks,
        block,
        allTxs,
        this._minerKey,
        this._unfinishedBlock
      )

      const workId = lastPreviousBlock.getHeight() + '@' + crypto.randomBytes(16).toString('hex')
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

      this._unfinished.push({
        workId: workId,
        unfinishedBlock: newBlock,
        unfinishedBlockData: {
          lastPreviousBlock,
          currentBlocks: newBlock.getBlockchainHeaders(),
          block,
          iterations: undefined,
          timeDiff: undefined
        }
      })

      if (this._unfinished.length > 30) {
        this._unfinished.shift()
      }

      this.setCurrentMiningHeaders(newBlock.getBlockchainHeaders())

      // if blockchains block count === 5 we will create a block with 6 blockchain blocks (which gets bonus)
      // if it's more, do not restart mining and start with new ones
      // if (this._workerProcess) {
      //  this._logger.info(`new rovered block -> accepted`)
      //  this.stopMining()
      // }

      const update = {
        workId: workId,
        currentTimestamp,
        offset: ts.offset,
        work,
        minerKey: this._minerKey,
        merkleRoot: newBlock.getMerkleRoot(),
        newestChildBlock: block.toObject(),
        difficulty: newBlock.getDifficulty(),
        difficultyData: {
          currentTimestamp,
          lastPreviousBlock: lastPreviousBlock.serializeBinary(),
          // $FlowFixMe
          newBlockHeaders: newBlock.getBlockchainHeaders().serializeBinary()
        }
      }

      if (BC_RUST_MINER) {
        const minerRequest = new MinerRequest()
        minerRequest.setWorkId(workId)
        minerRequest.setCurrentTimestamp(currentTimestamp)
        minerRequest.setOffset(ts.offset || 1)
        minerRequest.setWork(work)
        minerRequest.setMinerKey(this._minerKey)
        minerRequest.setMerkleRoot(newBlock.getMerkleRoot())
        minerRequest.setDifficulty(newBlock.getDifficulty())
        minerRequest.setLastPreviousBlock(lastPreviousBlock)
        minerRequest.setNewBlockHeaders(newBlock.getBlockchainHeaders())

        this._rpc.miner.mine(minerRequest, (err, response) => {
          if (err) {
            this._logger.error('Native mining request failed', err)
            return
          }

          if (response.getResult() === MinerResponseResult.CANCELED) {
            this._logger.debug('mining restarted because of new work')
            return
          }

          this._logger.debug('got response from rust miner', response.toObject())

          const transformed = {
            ...response.toObject(),
            workId
          }
          this._workerPool.emitter.emit('mined', transformed)
        })
      } else {
        // this._workerPool.emitter.once('mined', (data) => {
        //  this._handleWorkerFinishedMessage(data)
        // })

        /* eslint-disable */
        try {
            await fkill('bcworker', { force: true })
        } catch(err) {
            this._logger.debug(err)
        }
        this._workerPool.updateWorkers({ type: 'work', data: update, workId: workId, newestChildBlock: block })
      }
      return Promise.resolve(true)
    } catch (err) {
      this._logger.error(err)
      this._logger.warn(`Error while getting last previous BC block, reason: ${err.message}`)
      return Promise.reject(err)
    }
  }

  /// **
  //* Manages the current most recent block template used by the miner
  //* @param blockTemplate
  //* /
  setCurrentMiningHeaders (blockTemplate: BlockchainHeaders): void {
    if (this._blockTemplates.length > 0) {
      this._blockTemplates.pop()
    }
    this._blockTemplates.push(blockTemplate)
  }

  /**
  * Accessor for block templates
  */
  getCurrentMiningHeaders (): ?BlockchainHeaders {
    if (this._blockTemplates.length < 1) return
    return this._blockTemplates[0]
  }

  stopMining (pool: ?Object): Promise<boolean> {
    debug('stop mining')

    if(pool !== undefined) {
      pool.updateWorkers({ type: 'reset' })
    } else {
      this._workerPool.updateWorkers({ type: 'reset' })
    }
    try {
      return fkill('bcworker', { force: true })
    } catch (err) {
      this._logger.debug(err)
    }
    return Promise.resolve(true)

  }

  /*
   * Alias for validation module
   */
  validateRoveredSequences (blocks: BcBlock[]): boolean {
    return validateRoveredSequences(blocks)
  }

  /*
   * Restarts the miner by merging any unused rover blocks into a new block
   */
  async rebaseMiner (): Promise<bool|number> {
    // if (this._canMine !== true) return Promise.resolve(false)

    this._logger.debug('rebase miner request')
    try {
      const stopped = this.stopMining()
      this._logger.debug(`miner rebased, result: ${inspect(stopped)}`)
      const latestRoveredHeadersKeys: string[] = this._knownRovers.map(chain => `${chain}.block.latest`)
      this._logger.debug(latestRoveredHeadersKeys)
      const currentRoveredBlocks = await this.persistence.getBulk(latestRoveredHeadersKeys)
      const lastPreviousBlock = await this.persistence.get('bc.block.latest')
      const previousHeaders = lastPreviousBlock.getBlockchainHeaders()
      this._logger.debug(currentRoveredBlocks)
      if (lastPreviousBlock === null) {
        return Promise.resolve(false)
      }
      if (currentRoveredBlocks !== null && currentRoveredBlocks.length > 0) {
        const perc = (currentRoveredBlocks.length / Object.keys(previousHeaders.toObject()).length) * 100
        this._logger.info('multiverse sync state: ' + perc + '%')
      }
      if (currentRoveredBlocks.length !== Object.keys(previousHeaders.toObject()).length) {
        return Promise.resolve(false)
      }
      const uniqueBlocks = getUniqueBlocks(previousHeaders, currentRoveredBlocks).sort((a, b) => {
        if (a.getHeight() > b.getHeight()) {
          return -1
        }
        if (a.getHeight() < b.getHeight()) {
          return 1
        }
        return 0
      })

      this._logger.debug('stale branch blocks: ' + uniqueBlocks.length)

      if (uniqueBlocks.length < 1) {
        this._logger.info(uniqueBlocks.length + ' state changes ')
        return Promise.resolve(false)
      }
      return this.startMining(this._knownRovers, uniqueBlocks.shift())
    } catch (err) {
      return Promise.reject(err)
    }
  }

  restartMining (): boolean {
    debug('Restarting mining', this._knownRovers)

    // this.stopMining()
    // if (this._rawBlock.length > 0) {
    //  return this.startMining(this._knownRovers, this._rawBlock.pop())
    //    .then(res => {
    //      return Promise.resolve(!res)
    //    })
    // } else {

    // return Promise.resolve(true)
    // }

    return this.stopMining()
  }

  _handleWorkerFinishedMessage (solution: { distance: string, nonce: string, difficulty: string, timestamp: number, iterations: number, timeDiff: number, workId: string }) {
    let unfinishedBlock = this._unfinishedBlock
    let unfinishedBlockData = this._unfinishedBlockData
    let workId = solution.workId

    this._logger.debug('loading work id ' + workId + ' from imperforate blocks ' + this._unfinished.length)
    /* eslint-disable */
    //if (!unfinishedBlock || unfinishedBlock.workId !== workId) {

      if(workId !== undefined) {
        const candidates = this._unfinished.filter((b) => {
            //this._logger.info(JSON.stringify(b, null, 2) + ' ------------>>> ')
            if(b.workId === workId) {
              return b
            }
        })
        this._logger.debug('loaded work id: ' + workId + ' candidates ' + candidates.length)
        if(candidates.length > 0){
          const unfinishedBlockObject = candidates.shift()
          unfinishedBlock = unfinishedBlockObject.unfinishedBlock
          unfinishedBlockData = unfinishedBlockObject.unfinishedBlockData

          const remainingUnfinished = this._unfinished.filter((b) => {
              if(b.workId !== workId) {
                return b
              }
          })

          this._unfinished = remainingUnfinished

        } else {
          // this._logger.warn('There is not an unfinished block to use solution for')
          return
        }
      }
    //}

    const { nonce, distance, timestamp, difficulty, iterations, timeDiff } = solution

    this._logger.info(' nonce: ' + nonce)
    this._logger.info(' distance: ' + distance)
    this._logger.info(' timestamp: ' + timestamp)
    this._logger.info(' difficulty: ' + difficulty)
    this._logger.info(' iterations: ' + iterations)
    this._logger.info(' timeDiff: ' + timeDiff)
    this._logger.info(`The calculated block difficulty was ${unfinishedBlock.getDifficulty()}, actual mining difficulty was ${difficulty}`)

    const chainWeight = unfinishedBlock.getDistance()

    unfinishedBlock.setNonce(nonce)
    unfinishedBlock.setDistance(distance)
    // this is likely the problem
    unfinishedBlock.setTotalDistance(new BN(unfinishedBlock.getTotalDistance()).add(new BN(chainWeight)).add(new BN(unfinishedBlock.getDifficulty())).toString())
    unfinishedBlock.setTimestamp(timestamp)

    this._logger.info('total distance with unfinished block <- ' + unfinishedBlock.getTotalDistance())

    if (unfinishedBlockData) {
      unfinishedBlockData.iterations = iterations
      unfinishedBlockData.timeDiff = timeDiff
    }

    this._logger.info('about to test if block is valid')
    if (!isValidBlock(unfinishedBlock)) {
      this._logger.info(`candidate block is stale`)
      this._cleanUnfinishedBlock()
      //this._workerPool.emitter.emit('blockCacheRebase')
      return
    }

    if (unfinishedBlock !== undefined && isDebugEnabled()) {
      this._writeMiningData(unfinishedBlock, solution)
    }

    this._cleanUnfinishedBlock()
    this.pubsub.publish('miner.block.new', { unfinishedBlock, solution })

    //return this.stopMining()
  }

  _handleWorkerError (error: Error): Promise<boolean> {
    this._logger.error(error)
    this._logger.warn(`mining worker process errored, reason: ${error.message}`)
    this._cleanUnfinishedBlock()

    //return this.stopMining()
  }

  _handleWorkerExit (code: number, signal: string) {
      //this.stopMining()
      this._logger.info('miner pending new work')

      if (code === 0 || code === null) { // 0 means worker exited on it's own correctly, null that is was terminated from engine
        this._logger.info(`mining worker finished its work (code: ${code})`)
      } else {
        this._logger.warn(`mining worker process exited with code ${code}, signal ${signal}`)
        this._cleanUnfinishedBlock()
      }
  }

  _cleanUnfinishedBlock () {
    debug('cleaning unfinished block')
    this._unfinishedBlock = undefined
    this._unfinishedBlockData = undefined
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
}
