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
  /* eslint-enable */
  constructor (config: Object) {
    this._config = config
    this._logger = getLogger(__filename)
    this._wavesApi = WavesApi.create(WavesApi.MAINNET_CONFIG)
    this._rpc = new RpcClient()
  }

  init () {
    this._logger.info('Trying to get new block')

    const cycle = () => {
      return getLastHeight(this._wavesApi).then(height => {
        this._logger.debug(`Got last height '${height}`)
        // TODO cache last height and only get and emit a new one
        getBlock(this._wavesApi, height).then(block => {
          this._logger.info(`Got new block ${inspect(block)}`)
          // TODO _createUnifiedBlock and log success
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
