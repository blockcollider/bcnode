/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type { Logger } from 'winston'
const { inspect } = require('util')
const LRUCache = require('lru-cache')
const lisk = require('lisk-js')

const { Block } = require('../../protos/core_pb')
const logging = require('../../logger')
const { RpcClient } = require('../../rpc')
const { blake2b } = require('../../utils/crypto')

type LiskBlock = { // eslint-disable-line no-undef
  id: string,
  height: number,
  previousBlock: string,
  transactions: Object[],
  totalFee: number,
  payloadHash: string,
  payloadLength: number,
  generatorId: string,
  generatorPublicKey: string,
  blockSignature: string,
  confirmations: number,
  totalForged: number,
  timestamp: number,
  version: string,
}

const LSK_GENESIS_DATE = new Date('2016-05-24T17:00:00.000Z')

const getMerkleRoot = (block) => {
  if (!block.transactions || (block.transactions.length === 0)) {
    return blake2b(block.blockSignature)
  }

  const txs = block.transactions.map((tx) => tx.id)
  return txs.reduce((acc, el) => blake2b(acc + el), '')
}

const getLastHeight = (api: Object): Promise<number> => {
  const response = api.sendRequest('blocks/getHeight')
  return response.then(d => d.height)
}

const getBlock = (api: Object, height: number): Promise<LiskBlock> => { // TODO type for block
  return api.sendRequest('blocks', { height }).then(response => response.blocks.pop())
}

const getTransactionsForBlock = (api: Object, blockId: string): Promise<Object[]> => {
  return api.sendRequest('transactions', { blockId }).then(response => response.transactions)
}

const getAbsoluteTimestamp = (blockTs: number) => {
  return ((LSK_GENESIS_DATE.getTime() / 1000 << 0) + blockTs) * 1000
}

const _createUnifiedBlock = (block): Block => {
  const obj = {
    blockNumber: block.height,
    prevHash: block.previousBlock,
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
  msg.setBlockchain('lsk')
  msg.setHash(obj.blockHash)
  msg.setPreviousHash(obj.prevHash)
  msg.setTimestamp(obj.timestamp)
  msg.setHeight(obj.blockNumber)
  msg.setMerkleRoot(obj.root)

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
  /* eslint-enable */

  constructor (config: Object) {
    this._config = config
    this._logger = logging.getLogger(__filename)
    this._blockCache = new LRUCache({
      max: 500,
      maxAge: 1000 * 60 * 60
    })
    this._otherCache = new LRUCache({ max: 50 })
    this._liskApi = lisk.api(config.rovers.lsk)
    this._rpc = new RpcClient()
  }

  init () {
    this._logger.debug('initialized')

    process.on('disconnect', () => {
      this._logger.info('parent exited')
      process.exit()
    })

    process.on('uncaughtError', (e) => {
      this._logger.error('Uncaught error', e)
      process.exit(3)
    })

    const cycle = () => {
      this._logger.info('trying to get new block')

      return getLastHeight(this._liskApi).then(lastHeight => {
        this._logger.debug(`got lastHeight: "${lastHeight}"`)

        getBlock(this._liskApi, lastHeight).then(lastBlock => {
          this._logger.debug(`collected new block with id: ${inspect(lastBlock.id)}`)

          if (!this._blockCache.has(lastBlock.id)) {
            this._blockCache.set(lastBlock.id, true)
            this._logger.debug(`unseen block with id: ${inspect(lastBlock.id)} => using for BC chain`)

            getTransactionsForBlock(this._liskApi, lastBlock.id).then(transactions => {
              // TODO decide if we want to use block with no transactions, there are such
              lastBlock.transactions = transactions
              this._logger.debug(`successfuly got ${transactions.length} transactions for block ${inspect(lastBlock.id)}`)

              const unifiedBlock = _createUnifiedBlock(lastBlock)
              this._logger.debug(`created unified block: ${JSON.stringify(unifiedBlock.toObject(), null, 4)}`)

              this._rpc.rover.collectBlock(unifiedBlock, (err, response) => {
                if (err) {
                  this._logger.error(`Error while collecting block ${inspect(err)}`)
                  return
                }
                this._logger.debug(`Collector Response: ${JSON.stringify(response.toObject(), null, 4)}`)
              })
            })
          }
        })
      }).catch(e => {
        this._logger.error(`error while getting new block, err: ${inspect(e)}`)
      })
    }

    this._logger.debug('tick')
    this._intervalDescriptor = setInterval(() => {
      cycle().then(() => {
        this._logger.debug('tick')
      })
    }, 2000)

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

    //      log.info('peer sample: ' + response.peers.length)
    //      log.info('probable lsk block heigh ' + tp[0])
    //    }
    //  })
    // }, 60000)
  }

  close () {
    this._intervalDescriptor && clearInterval(this._intervalDescriptor)
  }
}
