/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type { RoverClient } from '../../protos/rover_grpc_pb'
import type { RoverMessage } from '../../protos/rover_pb'
import type { Logger } from 'winston'
const { inspect } = require('util')
const LRUCache = require('lru-cache')
const lisk = require('lisk-elements')
const { range, merge } = require('ramda')
const { parallelLimit } = require('async')
const BN = require('bn.js')

const { Block, MarkedTransaction } = require('../../protos/core_pb')
const { RoverMessageType, RoverIdent } = require('../../protos/rover_pb')
const logging = require('../../logger')
const { networks } = require('../../config/networks')
const { errToString } = require('../../helper/error')
const { RpcClient } = require('../../rpc')
const { blake2b } = require('../../utils/crypto')
const { createUnifiedBlock, isBeforeSettleHeight } = require('../helper')
const { ROVER_SECONDS_PER_BLOCK } = require('../utils')
const { rangeStep } = require('../../utils/ramda')

let skip = []

// type LiskBlock = { // eslint-disable-line no-undef
//  id: string,
//  height: number,
//  previousBlock: string,
//  transactions: Object[],
//  totalFee: number,
//  payloadHash: string,
//  payloadLength: number,
//  generatorId: string,
//  generatorPublicKey: string,
//  blockSignature: string,
//  confirmations: number,
//  totalForged: number,
//  timestamp: number,
//  version: string
// }

const BC_NETWORK = process.env.BC_NETWORK || 'main'
const LSK_GENESIS_DATE = new Date('2016-05-24T17:00:00.000Z')
const LSK_MAX_FETCH_BLOCKS = 10
const LSK_EMB_DESIGNATED_WALLET_PUBKEY = networks[BC_NETWORK].rovers.lsk.embAssetId
const LSK_API_MAX_PAGINATION_LIMIT = 100

const ROVER_NAME = 'lsk'

const getMerkleRoot = (block) => {
  if (!block.transactions || (block.transactions.length === 0)) {
    return blake2b(block.blockSignature)
  }

  const txs = block.transactions.map((tx) => tx.id)
  return txs.reduce((acc, el) => blake2b(acc + el), '')
}

const getAbsoluteTimestamp = (blockTs: number) => {
  return ((LSK_GENESIS_DATE.getTime() / 1000 << 0) + blockTs) * 1000
}

async function _createUnifiedBlock (roverRpc: RoverClient, block: Object, isStandalone: boolean): Block { // TODO specify block type
  const obj = {
    blockNumber: block.height,
    prevHash: block.previousBlockId,
    blockHash: block.id,
    root: getMerkleRoot(block),
    fee: block.totalFee,
    size: block.payloadLength,
    payloadHash: block.payloadHash,
    generator: block.generatorId,
    generatorPublicKey: block.generatorPublicKey,
    blockSignature: block.blockSignature,
    confirmations: block.confirmations,
    totalForged: block.totalForged,
    timestamp: getAbsoluteTimestamp(parseInt(block.timestamp, 10)),
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
    // for type docs see https://lisk.io/documentation/lisk-protocol/transactions
    let isEmbTx = (LSK_EMB_DESIGNATED_WALLET_PUBKEY !== null && tx.type === 0 && tx.senderPublicKey === LSK_EMB_DESIGNATED_WALLET_PUBKEY)

    let isHeightBeforeSettlement
    if (!isEmbTx && !isStandalone) {
      isHeightBeforeSettlement = await isBeforeSettleHeight(tx.senderPublicKey, tx.recipientPublicKey, ROVER_NAME, roverRpc)
    }

    if (isEmbTx || isHeightBeforeSettlement) {
      let tokenType = isEmbTx ? 'emb' : ROVER_NAME

      let ttx = new MarkedTransaction()
      ttx.setId(ROVER_NAME)
      ttx.setToken(tokenType)
      ttx.setAddrFrom(tx.senderPublicKey)
      ttx.setAddrTo(tx.recipientPublicKey)
      // actual lisk amount value is parseFloat(tx.amount, 10) / 100000000
      ttx.setValue(new BN(tx.amount).toBuffer()) // TODO use denominator for m-lisk

      ttx.setBlockHeight(msg.getHeight())
      ttx.setIndex(tokenTransactions.length)
      ttx.setHash(tx.id)

      tokenTransactions.push(ttx)
    }
  }

  msg.setMarkedTxsList(tokenTransactions)

  return msg
}

/**
 * LSK Controller
 */
export default class Controller {
  /* eslint-disable no-undef */
  _blockCache: LRUCache<string, bool>;
  _otherCache: LRUCache<string, bool>;
  _rpc: RpcClient;
  _logger: Logger;
  _intervalDescriptor: IntervalID;
  _config: Object;
  _liskApi: Object;
  _cycleFn: Function;
  /* eslint-enable */

  constructor (config: { randomizeNodes: boolean, bannedPeers: string[] }) {
    this._config = config
    this._logger = logging.getLogger(__filename)
    this._blockCache = new LRUCache({
      max: 200,
      maxAge: 1000 * 60 * 60
    })
    this._otherCache = new LRUCache({ max: 50 })
    // TODO pull this to networks config
    const networkConfig = merge(config, { testnet: BC_NETWORK === 'test', randomizeNodes: true, bannedPeers: [] })
    this._logger.info(networkConfig)
    this._liskApi = (BC_NETWORK === 'test')
      ? lisk.APIClient.createTestnetAPIClient(networkConfig)
      : lisk.APIClient.createMainnetAPIClient(networkConfig)
    this._rpc = new RpcClient()
  }

  init () {
    this._logger.debug('initialized')

    process.on('disconnect', () => {
      this._logger.info('Parent exited')
      process.exit()
    })

    process.on('uncaughtException', (e) => {
      this._logger.error(`Uncaught exception: ${errToString(e)}`)
      process.exit(3)
    })

    const rpcStream = this._rpc.rover.join(new RoverIdent(['lsk']))
    rpcStream.on('data', (message: RoverMessage) => {
      this._logger.debug(`rpcStream: Received ${JSON.stringify(message.toObject(), null, 2)}`)
      switch (message.getType()) { // Also could be message.getPayloadCase()
        case RoverMessageType.REQUESTRESYNC:
          this.startResync()
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

    this._cycleFn = (getOpts: { offset?: number, limit?: number}) => {
      this._logger.info('LSK rover active connection: ' + this._liskApi.hasAvailableNodes())
      const opts = merge({ limit: 1 }, getOpts)

      return this._liskApi.blocks.get(opts).then(lastBlocks => {
        try {
          let blocks
          if (lastBlocks.blocks !== undefined) {
            blocks = lastBlocks.blocks
          } else {
            blocks = lastBlocks.data
          }

          for (let lastBlock of blocks) {
            this._logger.debug(`Collected new block with id: ${inspect(lastBlock.id)}`)
            if (!this._blockCache.has(lastBlock.id)) {
              this._blockCache.set(lastBlock.id, true)
              this._logger.debug(`unseen block with id: ${inspect(lastBlock.id)} => using for BC chain`)

              return this._liskApi.transactions.get({ blockId: lastBlock.id }).then(async ({ data }) => {
                lastBlock.transactions = data
                this._logger.debug(`Got txs for block ${lastBlock.id}, ${inspect(data)}`)

                const unifiedBlock = await createUnifiedBlock(this._config.isStandalone, lastBlock, this._rpc.rover, _createUnifiedBlock)

                this._logger.debug('LSK Going to call this._rpc.rover.collectBlock()')
                try {
                  if (!this._config.isStandalone) {
                    this._rpc.rover.collectBlock(unifiedBlock, (err, response) => {
                      if (err) {
                        this._logger.error(`error while collecting block ${inspect(err)}`)
                        skip = skip.concat(['1', '1'])
                        return
                      }
                      this._logger.debug(`Collector Response: ${JSON.stringify(response.toObject(), null, 4)}`)
                    })
                  } else {
                    this._logger.info(`Rovered ${unifiedBlock.getHeight()} LSK block`)
                  }
                } catch (err) {
                  skip = skip.concat(['1', '1'])
                  this._logger.error(err)
                }
              })
            }
          }
        } catch (err) {
          skip.push('1')
          this._logger.error(err)
        }
      })
        .catch((err) => {
          skip.push('1')
          this._logger.error(err)
          this._logger.error('connection lsk network error')
        })
    }

    this._logger.debug('tick')
    this._intervalDescriptor = setInterval(() => {
      if (skip.length > 0) {
        this._logger.debug('skip')
        skip.pop()
      } else {
        this._cycleFn().then(() => {
          this._logger.debug('tick')
        })
      }
    }, 5600)

    // setInterval(function () {
    //  lisk.api(liskOptions).getPeersList({}, function (error, success, response) {
    //    if (error) {
    //      console.trace(error)
    //    } else {
    //      var t = response.peers.reduce(function (all, a) {
    //        if (all[a.height] == undefined) {
    //          all[a.height] = 1
    //        } else {
    //          all[a.height]++
    //        }
    //        return all
    //      }, {})

    //      var tp = Object.keys(t).sort(function (a, b) {
    //        if (t[a] > t[b]) {
    //          return -1
    //        }
    //        if (t[a] < t[b]) {
    //          return 1
    //        }
    //        return 0
    //      })

    //      log.debug('peer sample: ' + response.peers.length)
    //      log.debug('probable lsk block height ' + tp[0])
    //    }
    //  })
    // }, 60000)
  }

  startResync () {
    this._liskApi.blocks.get().then(lastBlocks => {
      let lastBlock
      if (lastBlocks.blocks !== undefined) {
        lastBlock = lastBlocks.blocks[0]
      } else {
        lastBlock = lastBlocks.data[0]
      }

      const to = lastBlock.height - 1
      const from = to - (72 * 60 * 60 / ROVER_SECONDS_PER_BLOCK['lsk'])
      const step = ((to - from) / 500) | 0
      const boundaries = rangeStep(from, step, to)
      const tasks = boundaries.map(blockNumber => async () => this._cycleFn({ offset: lastBlock.height - blockNumber, limit: 1 }))

      this._logger.info(`Requesting blocks ${from} - ${to} for initial resync (${tasks.length} tasks)`)
      parallelLimit(tasks, 5, (err, resuls) => {
        if (err) {
          this._logger.warn(`Couldn't fetch all blocks for initial resync`)
        }
        this._logger.info(`Fetched blocks for initial resync`)
      })
    })
  }

  fetchBlock (currentLast: Block, previousLast: Block) {
    let from = previousLast.getHeight() + 1
    let to = currentLast.getHeight()

    // if more than LSK_MAX_FETCH_BLOCKS would be fetch, limit this to save centralized chains
    if (to - from > LSK_MAX_FETCH_BLOCKS) {
      this._logger.warn(`Would fetch ${to - from} blocks but LSK can't handle such load, fetching only ${LSK_MAX_FETCH_BLOCKS}`)
      from = to - LSK_MAX_FETCH_BLOCKS
    }
    const whichBlocks = range(from, to)

    if (from - to > 0) {
      this._logger.info(`Fetching missing blocks ${whichBlocks}`)
      const opts = { offset: to - from, limit: to - from }
      this._cycleFn(opts).then(() => {
        this._logger.info(`Fetched missing blocks ${whichBlocks}`)
      })
    }
  }

  close () {
    this._intervalDescriptor && clearInterval(this._intervalDescriptor)
  }
}
