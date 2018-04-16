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

const { debugSaveObject } = require('../../debug')
const { Block } = require('../../protos/core_pb')
const { getLogger } = require('../../logger')
const { blake2b } = require('../../utils/crypto')
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

const getMerkleRoot = (block) => {
  if (!block.transactions || (block.transactions.length === 0)) {
    return blake2b(block.signature)
  }

  const txs = block.transactions.map((tx) => tx.id)
  return txs.reduce((acc, el) => blake2b(acc + el), '')
}

const getLastHeight = (api: Object): Promise<number> => {
  const response = api.API.Node.v1.blocks.height()
  return response.then(d => d.height)
}

const getBlock = (api: Object, height: number): Promise<WavesBlock> => {
  return api.API.Node.v1.blocks.at(height).then(b => b)
}

const _createUnifiedBlock = (block): Block => {
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
  msg.setBlockchain('wav')
  msg.setHash(obj.blockHash)
  msg.setPreviousHash(obj.prevHash)
  msg.setTimestamp(obj.timestamp)
  msg.setHeight(obj.blockNumber)
  msg.setMerkleRoot(obj.root)

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
  _rpc: RpcClient;
  _intervalDescriptor: IntervalID;
  _blockCache: LRUCache<string, bool>;
  /* eslint-enable */
  constructor (config: Object) {
    this._config = config
    this._logger = getLogger(__filename)
    this._wavesApi = WavesApi.create(WavesApi.MAINNET_CONFIG)
    this._rpc = new RpcClient()
    this._blockCache = new LRUCache({ max: 500 })
  }

  init () {
    this._logger.info('initialized')

    process.on('disconnect', () => {
      this._logger.info('parent exited')
      process.exit()
    })

    process.on('uncaughtError', (e) => {
      this._logger.error('Uncaught error', e)
      process.exit(3)
    })

    const cycle = () => {
      this._logger.debug('Trying to get new block')
      return getLastHeight(this._wavesApi).then(height => {
        this._logger.debug(`Got last height '${height}'`)
        getBlock(this._wavesApi, height - 1).then(lastBlock => {
          if (!this._blockCache.has(lastBlock.reference)) {
            this._logger.info(`Unseen new block '${lastBlock.reference}', height: ${height}`)
            this._blockCache.set(lastBlock.reference)

            const unifiedBlock = _createUnifiedBlock(lastBlock)
            const blockObj = unifiedBlock.toObject()
            this._logger.debug(`created unified block: ${JSON.stringify(blockObj, null, 4)}`)
            debugSaveObject(`${blockObj.blockchain}/block/${blockObj.timestamp}-${blockObj.hash}.json`, blockObj)

            this._rpc.rover.collectBlock(unifiedBlock, (err, response) => {
              if (err) {
                this._logger.error(`Error while collecting block ${inspect(err)}`)
                return
              }
              this._logger.debug(`Collector Response: ${JSON.stringify(response.toObject(), null, 4)}`)
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
