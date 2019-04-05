/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Logger } from 'winston'
import type { DfConfig } from '../../bc/validation'
import type { RoverClient } from '../../protos/rover_grpc_pb'
import type { RoverMessage } from '../../protos/rover_pb'
const { inspect } = require('util')
const WavesApi = require('waves-api')
const request = require('request')
const LRUCache = require('lru-cache')
const { isEmpty, range, sort } = require('ramda')
const pRetry = require('p-retry')
const BN = require('bn.js')

const { Block, MarkedTransaction } = require('../../protos/core_pb')
const { RoverMessageType, RoverIdent } = require('../../protos/rover_pb')
const { getLogger } = require('../../logger')
const { networks } = require('../../config/networks')
const { errToString } = require('../../helper/error')
const { blake2b } = require('../../utils/crypto')
const { RpcClient } = require('../../rpc')
const { createUnifiedBlock, isBeforeSettleHeight } = require('../helper')
const { randomInt } = require('../utils')
const { randRange } = require('../../utils/ramda')
const ts = require('../../utils/time').default // ES6 default export
const { ROVER_DF_VOID_EXIT_CODE } = require('../manager')
const { ROVER_SECONDS_PER_BLOCK } = require('../utils')
const { rangeStep } = require('../../utils/ramda')

const BC_NETWORK = process.env.BC_NETWORK || 'main'
const WAVES_NODE_ADDRESS = (BC_NETWORK === 'main')
  ? WavesApi.MAINNET_CONFIG.nodeAddress
  : WavesApi.TESTNET_CONFIG.nodeAddress
const WAV_MAX_FETCH_BLOCKS = 10
const WAV_EMB_ASSET_ID = networks[BC_NETWORK].rovers.wav.embAssetId
const ROVER_NAME = 'wav'

type WavesTransaction = {
  type: number,
  id: string,
  sender: string,
  senderPublicKey: string,
  fee: number,
  timestamp: number,
  signature: string,
  recipient: string,
  assetId: string,
  amount: number,
  feeAsset: string,
  attachment: string
}

type WavesBlock = {
  version: number,
  timestamp: number,
  reference: string,
  'nxt-consensus': {
    'base-target': number,
    'generation-signature': string
  },
  features: Array<any>,
  generator: string,
  signature: string,
  blocksize: number,
  fee: number,
  transactions: WavesTransaction[],
  height: number
}

type WavesHeader = {
  version: number,
  timestamp: number, // e.g. 1530795651152
  reference: string,
  "nxt-consensus": {
    "base-target": number,
    "generation-signature": string
  },
  features: number[],
  generator: string,
  signature: string,
  blocksize: number,
  transactionCount: number,
  height: number
}

const getMerkleRoot = (block) => {
  if (!block.transactions || (block.transactions.length === 0)) {
    return blake2b(block.signature)
  }

  const txs = block.transactions.map((tx) => tx.id)
  return txs.reduce((acc, el) => blake2b(acc + el), '')
}

export const getLastHeight = (): Promise<WavesHeader> => {
  return new Promise((resolve, reject) => {
    request({
      url: `${WAVES_NODE_ADDRESS}/blocks/headers/last`,
      headers: { 'Accept': 'application/json' }
    }, (error, response, body) => {
      if (error) {
        return reject(error)
      }

      try {
        const data = JSON.parse(body)
        if (data.status === 'error') {
          return reject(data.details)
        }
        return resolve(data)
      } catch (e) {
        return reject(e)
      }
    })
  })
}

const getBlock = (height: number): Promise<WavesBlock> => {
  return new Promise((resolve, reject) => {
    request({
      url: `${WAVES_NODE_ADDRESS}/blocks/at/${height}`,
      headers: { 'Accept': 'application/json' },
      timeout: 2000
    }, (error, response, body) => {
      if (error) {
        return reject(error)
      }

      try {
        const data = JSON.parse(body)
        if (data.status === 'error') {
          return reject(data.details)
        }
        return resolve(data)
      } catch (e) {
        return reject(e)
      }
    })
  })
}

const getBlockSequence = (heightFrom: number, heightTo: number): Promise<Array<WavesBlock>> => {
  return new Promise((resolve, reject) => {
    request({
      url: `${WAVES_NODE_ADDRESS}/blocks/seq/${heightFrom}/${heightTo}`,
      headers: { 'Accept': 'application/json' }
    }, (error, response, body) => {
      if (error) {
        return reject(error)
      }

      try {
        const data = JSON.parse(body)
        if (data.status === 'error') {
          return reject(data.details)
        }

        return resolve(data)
      } catch (e) {
        return reject(e)
      }
    })
  })
}

async function _createUnifiedBlock (roverRpc: RoverClient, block, isStandalone: boolean): Block {
  const obj = {
    blockNumber: block.height,
    prevHash: block.reference,
    blockHash: block.signature,
    root: getMerkleRoot(block),
    fee: block.fee,
    size: block.blocksize,
    generator: block.generator,
    genSignature: block['nxt-consensus']['generation-signature'],
    baseTarget: block['nxt-consensus']['base-target'],
    timestamp: parseInt(block.timestamp, 10),
    version: block.version,
    transactions: block.transactions.reduce(
      function (all, t) {
        all.push({
          txHash: t.id,
          // inputs: t.inputs,
          // outputs: t.outputs,
          marked: false
        })
        return all
      },
      []
    )
  }

  const msg = new Block()
  msg.setBlockchain(ROVER_NAME)
  msg.setHash(obj.blockHash)
  msg.setPreviousHash(obj.prevHash)
  msg.setTimestamp(obj.timestamp)
  msg.setHeight(obj.blockNumber)
  msg.setMerkleRoot(obj.root)

  const tokenTransactions = []
  for (let tx of block.transactions) {
    let isEmbTx = (WAV_EMB_ASSET_ID !== null && tx.type === 4 && tx.assetId === WAV_EMB_ASSET_ID)

    let isHeightBeforeSettlement
    if (!isEmbTx && !isStandalone) {
      isHeightBeforeSettlement = await isBeforeSettleHeight(tx.sender, tx.recipient, ROVER_NAME, roverRpc)
    }

    if (isEmbTx || isHeightBeforeSettlement) {
      let tokenType = isEmbTx ? 'emb' : ROVER_NAME

      let tTx = new MarkedTransaction()
      tTx.setId(ROVER_NAME)
      tTx.setToken(tokenType) // TODO maybe assetId?
      tTx.setAddrFrom(tx.sender)
      tTx.setAddrTo(tx.recipient)
      tTx.setValue(new BN(tx.amount).toBuffer())

      tTx.setBlockHeight(msg.getHeight())
      tTx.setIndex(tokenTransactions.length)
      tTx.setHash(tx.id)

      tokenTransactions.push(tTx)
    }
  }

  if (tokenTransactions.length > 0) {
    console.log(`====== WAV token transactions: ${inspect(tokenTransactions.map(t => t.toObject()))}`)
  }
  msg.setMarkedTxsList(tokenTransactions)

  return msg
}

type PendingRequestPair = [number, number]
type PendingFiberPair = [number, Block]

/**
 * WAV Controller
 */
export default class Controller {
  _config: { isStandalone: bool, dfConfig: DfConfig }
  _logger: Logger
  _rpc: RpcClient
  _timeoutDescriptor: TimeoutID
  _checkFibersIntervalID: IntervalID
  _blockCache: LRUCache<string, bool>
  _lastBlockHeight: number
  _pendingRequests: Array<PendingRequestPair>
  _pendingFibers: Array<PendingFiberPair>
  _timeoutResync : ?TimeoutID

  constructor (config: { isStandalone: bool, dfConfig: DfConfig }) {
    this._config = config
    this._logger = getLogger(__filename)
    this._rpc = new RpcClient()
    this._blockCache = new LRUCache({ max: 500 })
    this._lastBlockHeight = 0
    this._pendingRequests = []
    this._pendingFibers = []
  }

  init () {
    this._logger.debug('Initialized')

    process.on('disconnect', () => {
      this._logger.info('parent exited')
      process.exit()
    })

    process.on('uncaughtException', (e) => {
      this._logger.error(`uncaught exception: ${errToString(e)}`)
      process.exit(3)
    })

    const rpcStream = this._rpc.rover.join(new RoverIdent(['wav']))
    rpcStream.on('data', (message: RoverMessage) => {
      this._logger.debug(`rpcStream: Received ${JSON.stringify(message.toObject(), null, 2)}`)
      switch (message.getType()) { // Also could be message.getPayloadCase()
        case RoverMessageType.REQUESTRESYNC:
          this.startResync(message.getResync())
          break

        case RoverMessageType.FETCHBLOCK:
          const payload = message.getFetchBlock()
          this.fetchBlock(payload.getFromBlock(), payload.getToBlock())
          break

        default:
          this._logger.warn(`Got unknown message type ${message.getType()}`)
      }
    })
    rpcStream.on('close', () => this._logger.info(`gRPC stream from server closed`))

    const { dfBound, dfVoid } = this._config.dfConfig.wav

    const cycle = () => {
      this._timeoutDescriptor = setTimeout(() => {
        this._logger.debug(`pending requests: ${inspect(this._pendingRequests)}, pending fibers: ${inspect(this._pendingFibers.map(([ts, b]) => { return [ts, b.toObject()] }))}`)

        if (isEmpty(this._pendingRequests)) {
          getLastHeight().then(({ height, timestamp }) => {
            const ts = timestamp / 1000 << 0
            const requestTime = randRange(ts, ts + dfBound)
            this._pendingRequests.push([requestTime, height - 4])
            // push second further to future
            this._pendingRequests.push([requestTime + randRange(5, 15), height - 3])
            cycle()
          }).catch(err => {
            this._logger.debug(`unable to start roving, could not get block count, err: ${err.message}`)
            cycle()
          })
          return
        }

        const [requestTimestamp, requestBlockHeight] = this._pendingRequests.shift()
        if (requestTimestamp <= ts.nowSeconds()) {
          getBlock(requestBlockHeight).then(async (block) => {
            this._logger.debug(`Got block at height : "${requestBlockHeight}"`)
            if (!this._blockCache.has(requestBlockHeight)) {
              this._blockCache.set(requestBlockHeight, true)
              this._logger.debug(`Unseen block with hash: ${block.signature} => using for BC chain`)

              const unifiedBlock = await createUnifiedBlock(this._config.isStandalone, block, this._rpc.rover, _createUnifiedBlock)
              const formatTimestamp = unifiedBlock.getTimestamp() / 1000 << 0
              const currentTime = ts.nowSeconds()
              this._pendingFibers.push([formatTimestamp, unifiedBlock])

              const maxPendingHeight = this._pendingRequests[this._pendingRequests.length - 1][1]
              if (currentTime + 5 < formatTimestamp + dfBound) {
                this._pendingRequests.push([randRange(currentTime, formatTimestamp + dfBound), maxPendingHeight + 1])
              } else {
                this._pendingRequests.push([randRange(currentTime, currentTime + 5), maxPendingHeight + 1])
              }
            }
            cycle()
          }, reason => {
            throw new Error(reason)
          }).catch(err => {
            this._logger.debug(`error while getting new block height: ${requestBlockHeight}, err: ${errToString(err)}`)
            const moveBySeconds = 3
            // postpone remaining requests
            this._pendingRequests = this._pendingRequests.map(([ts, height]) => [ts + moveBySeconds, height])
            // prepend currentrequest back but schedule to try it in [now, now + 10s]
            this._pendingRequests.unshift([randRange(ts.nowSeconds(), ts.nowSeconds() + 10) + moveBySeconds, requestBlockHeight])
            cycle()
          })
        } else {
          // prepend request back to queue - we have to wait until time it is scheduled
          this._pendingRequests.unshift([requestTimestamp, requestBlockHeight])
          cycle()
        }
      }, 1000)
    }

    const checkFibers = () => {
      if (isEmpty(this._pendingFibers)) {
        this._logger.debug(`no fiber ready, waiting: ${inspect(
          this._pendingFibers.map(([ts, b]) => ([ts, b.getHash()]))
        )}`)
        return
      }
      this._logger.debug(`fibers count ${this._pendingFibers.length}`)
      const fiberTs = this._pendingFibers[0][0]
      if (fiberTs + dfBound < ts.nowSeconds()) {
        const [, fiberBlock] = this._pendingFibers.shift()
        this._logger.debug('WAV Fiber is ready, going to call this._rpc.rover.collectBlock()')

        if (this._config.isStandalone) {
          this._logger.info(`would publish block: ${inspect(fiberBlock.toObject())}`)
          return
        }

        if (fiberTs + dfVoid < ts.nowSeconds()) {
          this._logger.debug(`would publish block: ${inspect(fiberBlock.toObject())}`)
          process.exit(ROVER_DF_VOID_EXIT_CODE)
        }

        if (!this._config.isStandalone) {
          this._rpc.rover.collectBlock(fiberBlock, (err, response) => {
            if (err) {
              this._logger.error(`Error while collecting block ${inspect(err)}`)
              return
            }
            this._logger.debug(`Collector Response: ${JSON.stringify(response.toObject(), null, 4)}`)
          })
        }
      }
    }

    cycle()

    this._checkFibersIntervalID = setInterval(checkFibers, 1000)
  }

  fetchBlock (previousLatest: Block, currentLatest: Block) {
    let from = previousLatest.getHeight() + 1
    let to = currentLatest.getHeight()

    // if more than WAV_MAX_FETCH_BLOCKS would be fetch, limit this to save centralized chains
    if (to - from > WAV_MAX_FETCH_BLOCKS) {
      this._logger.warn(`Would fetch ${to - from} blocks but WAV can't handle such load, fetching only ${WAV_MAX_FETCH_BLOCKS}`)
      from = to - WAV_MAX_FETCH_BLOCKS
    }
    const whichBlocks = range(from, to)

    this._logger.info(`Fetching missing blocks ${whichBlocks}`)
    getBlockSequence(from, to).then(blocks => {
      blocks.forEach(async (block) => {
        const { height } = block
        if (!this._blockCache.has(height)) {
          this._blockCache.set(height, true)
          this._logger.debug(`Fetched block with hash: ${block.signature}`)

          const unifiedBlock = await createUnifiedBlock(this._config.isStandalone, block, this._rpc.rover, _createUnifiedBlock)
          this._rpc.rover.collectBlock(unifiedBlock, (err, response) => {
            if (err) {
              this._logger.error(`Error while collecting block ${inspect(err)}`)
              return
            }
            this._logger.debug(`Collector Response: ${JSON.stringify(response.toObject(), null, 4)}`)
          })
        }
      })
    }, reason => {
      throw new Error(reason)
    }).catch(err => {
      this._logger.debug(`error while getting new block sequence: ${from} - ${to}, err: ${errToString(err)}`)
    })
  }

  startResync (resyncMsg: RoverMessage.Resync) {
    if (!this._timeoutResync) {
      this._timeoutResync = setTimeout(() => {
        getLastHeight().then(({ height, timestamp }) => {
          let whichBlocks: number[] = []
          if (!isEmpty(resyncMsg.getIntervalsList())) {
            for (const interval of resyncMsg.getIntervalsList()) {
              whichBlocks = range(interval.getFromBlock(), interval.getToBlock() + 1).concat(whichBlocks)
            }
            const knownLatestBlock = resyncMsg.getLatestBlock()
            if (knownLatestBlock && knownLatestBlock.getHeight() < height) {
              whichBlocks = range(knownLatestBlock.getHeight(), height).concat(whichBlocks)
            }

            // sort blocks in reverse order
            whichBlocks = sort((a, b) => b - a, whichBlocks)
          } else {
            const from = height - 72 * 60 * 60 / ROVER_SECONDS_PER_BLOCK['wav'] | 0
            const to = height
            const step = ((to - from) / 500) | 0
            whichBlocks = rangeStep(from, step, to) // TODO these should not be interspersed
          }
          this._logger.debug(`Getting ${whichBlocks.length} blocks`) // XXX remove after debug
          let successCount = 0
          for (let blockNumber of whichBlocks) {
            pRetry(() => getBlock(blockNumber), {
              onFailedAttempt: error => {
                this._logger.debug(`Block ${blockNumber} attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`)
              },
              retries: 50,
              factor: 1.24,
              randomize: true,
              maxTimeout: 5e3
            })
              .then(async (block) => {
                successCount++
                if (successCount === whichBlocks.length) {
                  this._timeoutResync = undefined
                  this._logger.info(`Initial resync finished`)
                  process.exit(0)
                } else { // XXX remove after debug
                  this._logger.info(`${successCount} done, ${whichBlocks.length - successCount} to go`)
                }
                this._logger.debug(`Got block at height : "${blockNumber}"`)
                const { height } = block
                if (!this._blockCache.has(height)) {
                  this._blockCache.set(height, true)
                  this._logger.debug(`Fetched block with hash: ${block.signature}`)
                  const unifiedBlock = await createUnifiedBlock(this._config.isStandalone, block, this._rpc.rover, _createUnifiedBlock)
                  if (!this._config.isStandalone) {
                    this._rpc.rover.collectBlock(unifiedBlock, (err, response) => {
                      if (err) {
                        this._logger.error(`Error while collecting block ${inspect(err)}`)
                        throw new Error(`Error while collecting block ${inspect(err)}`)
                      }
                      this._logger.debug(`Collector Response: ${JSON.stringify(response.toObject(), null, 4)}`)
                      return true
                    })
                  } else {
                    this._logger.info(`Collected WAV block ${unifiedBlock.getHeight()}, h: ${unifiedBlock.getHash()}`)
                    return true
                  }
                }
              })
          }
        })
      }, randomInt(2000, 5000))
    }
  }

  close () {
    ts.stop()
    this._timeoutDescriptor && clearTimeout(this._timeoutDescriptor)
    this._checkFibersIntervalID && clearInterval(this._checkFibersIntervalID)
  }
}
