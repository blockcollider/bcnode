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
const WavesApi = require('waves-api')
const LRUCache = require('lru-cache')

const { Block } = require('../../protos/core_pb')
const { getLogger } = require('../../logger')
const string = require('../../utils/strings.js')
const { RpcClient } = require('../../rpc')

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

const getMerkleRoot = (txs: WavesTransaction[]) => {
  if (txs !== undefined && txs.length > 0) {
    return txs.reduce((all, tx) => string.blake2b(all + tx.id), '')
  }
  return false
}

const getLastHeight = (api: Object): Promise<number> => {
  const response = api.API.Node.v1.blocks.height()
  return response.then(d => d.height)
}

const getBlock = (api: Object, height: number): Promise<WavesBlock> => {
  return api.API.Node.v1.blocks.at(height).then(b => b)
}

const _createUnifiedBlock = (block): Block => {
  const obj = {}

  obj.blockNumber = block.height
  obj.prevHash = block.reference
  obj.blockHash = block.signature
  obj.root = getMerkleRoot(block.transactions)
  obj.fee = block.fee
  obj.size = block.blocksize
  obj.generator = block.generator
  obj.genSignature = block['nxt-consensus']['generation-signature']
  obj.baseTarget = block['nxt-consensus']['base-target']
  obj.timestamp = block.timestamp
  obj.version = block.version
  obj.generator = block.generator
  obj.transactions = block.transactions.reduce(function (all, t) {
    var tx = {
      txHash: t.id,
      // inputs: t.inputs,
      // outputs: t.outputs,
      marked: false
    }

    all.push(tx)
    return all
  }, [])

  const msg = new Block()
  msg.setBlockchain('wav')
  msg.setHash(obj.blockHash)

  return msg
}

/**
 * WAV Controller
 */
export default class Controller {
  /* eslint-disable no-undef */
  _config: Object;
  _logger: Logger;
  _wavesApi: Object;
  _blocksCache: LRUCache;
  _rpc: RpcClient;
  _intervalDescriptor: IntervalID;
  _blockCache: LRUCache;
  /* eslint-enable */
  constructor (config: Object) {
    this._config = config
    this._logger = getLogger(__filename)
    this._wavesApi = WavesApi.create(WavesApi.MAINNET_CONFIG)
    this._rpc = new RpcClient()
    this._blockCache = new LRUCache()
  }

  init () {
    this._logger.info('Trying to get new block')

    const cycle = () => {
      return getLastHeight(this._wavesApi).then(height => {
        this._logger.debug(`Got last height '${height}`)
        getBlock(this._wavesApi, height).then(lastBlock => {
          if (!this._blockCache.has(lastBlock.reference)) {
            this._logger.info(`Got new block ${inspect(lastBlock)}`)
            this._blockCache.set(lastBlock.reference)

            const unifiedBlock = _createUnifiedBlock(lastBlock)
            this._logger.debug(`created unified block: ${inspect(unifiedBlock, {depth: 0})}`)

            this._rpc.rover.collectBlock(unifiedBlock, (err, response) => {
              if (err) {
                this._logger.error(`Error while collecting block ${inspect(err)}`)
                return
              }
              this._logger.debug(`Collector Response ${inspect(response)}`)
            })
          }
        })
      }).catch(reason => {
        this._logger.error(`Could not get new block, err ${inspect(reason)}`)
      })
    }

    this._logger.debug('tick')
    this._intervalDescriptor = setInterval(() => {
      cycle().then(() => {
        this._logger.debug('tick')
      })
    }, 2000)
  }

  close () {
    this._intervalDescriptor && clearInterval(this._intervalDescriptor)
  }
}
