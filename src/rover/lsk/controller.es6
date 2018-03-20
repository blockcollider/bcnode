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
const string = require('../../utils/strings.js')

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
  timestamp: string,
  version: string,
}

const getMerkleRoot = (txs) => txs.reduce((all, tx) => string.blake2b(all + tx.id), '')

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

const _createUnifiedBlock = (block): Block => {
  // TODO return Block as message
  const obj = {}

  obj.blockNumber = block.height
  obj.prevHash = block.previousBlock
  obj.blockHash = block.id
  obj.root = getMerkleRoot(block.transactions)
  obj.fee = block.totalFee
  obj.size = block.payloadLength
  obj.payloadHash = block.payloadHash
  obj.generator = block.generatorId
  obj.generatorPublicKey = block.generatorPublicKey
  obj.blockSignature = block.blockSignature
  obj.confirmations = block.confirmations
  obj.totalForged = block.totalForged
  obj.timestamp = block.timestamp
  obj.version = block.version
  obj.transactions = block.transactions.reduce(function (all, t) {
    const tx = {
      txHash: t.id,
      // inputs: t.inputs,
      // outputs: t.outputs,
      marked: false
    }
    all.push(tx)
    return all
  }, [])

  // return obj

  const msg = new Block()
  msg.setBlockchain('lsk')
  msg.setHash(obj.blockHash)

  return msg
}

/**
 * LSK Controller
 */
export default class Controller {
  /* eslint-disable no-undef */
  _blockCache: LRUCache;
  _otherCache: LRUCache;
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
    this._otherCache = new LRUCache(50)
    this._liskApi = lisk.api(config.rovers.lsk)
    this._rpc = new RpcClient()
  }

  init () {
    this._logger.debug('initialized')

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
              this._logger.debug(`created unified block: ${inspect(unifiedBlock, {depth: 0})}`)

              this._rpc.rover.collectBlock(unifiedBlock, (err, response) => {
                if (err) {
                  this._logger.error(`Error while collecting block ${inspect(err)}`)
                  return
                }
                this._logger.debug(`Collector Response ${inspect(response)}`)
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
