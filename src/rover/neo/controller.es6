/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type { Logger } from 'winston'
const profiles = require('@cityofzion/neo-js/dist/common/profiles')
const NeoMesh = require('@cityofzion/neo-js/dist/node/mesh')
const NeoNode = require('@cityofzion/neo-js/dist/node/node')
const { inspect } = require('util')
const LRUCache = require('lru-cache')

const { Block } = require('../../protos/core_pb')
const logging = require('../../logger')
const { RpcClient } = require('../../rpc')
const { createUnifiedBlock } = require('../helper')

type NeoBlock = { // eslint-disable-line no-undef
  hash: string,
  size: number,
  version: number,
  previousblockhash: string,
  merkleroot: string,
  time: number,
  index: number,
  nonce: string,
  nextconsensus: string,
  script: {
    invocation: string,
    verification: string,
  },
  tx: [{
    txid: string,
    size: number,
    type: string,
    version: number,
    attributes: any[],
    vin: any[],
    vout: any[],
    sys_fee: number,
    net_fee: number,
    scripts: any[],
    nonce: number
  }],
  confirmations: number,
  nextblockhash: string
}

function _createUnifiedBlock (block: NeoBlock): Block {
  const obj = {}

  obj.blockNumber = block.index
  obj.prevHash = block.previousblockhash
  obj.blockHash = block.hash
  obj.root = block.merkleroot
  obj.size = block.size
  obj.nonce = block.nonce
  obj.nextConsensus = block.nextconsensus
  obj.timestamp = block.time * 1000
  obj.version = block.version
  obj.transactions = block.tx.reduce(function (all, t) {
    const tx = {
      txHash: t.txid,
      // inputs: t.inputs,
      // outputs: t.outputs,
      marked: false
    }
    all.push(tx)
    return all
  }, [])

  const msg = new Block()
  msg.setBlockchain('neo')
  msg.setHash(obj.blockHash)
  msg.setPreviousHash(obj.prevHash)
  msg.setTimestamp(obj.timestamp)
  msg.setHeight(obj.blockNumber)
  msg.setMerkleRoot(obj.root)

  return msg
}

/**
 * NEO Controller
 */
export default class Controller {
  /* eslint-disable no-undef */
  _blockCache: LRUCache<string, bool>;
  _rpc: RpcClient;
  _logger: Logger;
  _config: Object;
  _neoMesh: Object;
  _intervalDescriptor: IntervalID;
  /* eslint-enable */

  constructor (config: Object) {
    this._config = config
    this._logger = logging.getLogger(__filename)
    this._blockCache = new LRUCache({
      max: 500,
      maxAge: 1000 * 60 * 60
    })
    this._neoMesh = new NeoMesh(profiles.rpc.mainnet.endpoints.map(endpoint => {
      return new NeoNode({
        domain: endpoint.domain,
        port: endpoint.port
      })
    }))
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
      const node = this._neoMesh.getRandomNode()

      return node.rpc.getBestBlockHash().then(bestBlockHash => {
        this._logger.debug(`got best block: "${bestBlockHash}"`)
        if (!this._blockCache.has(bestBlockHash)) {
          this._blockCache.set(bestBlockHash, true)
          this._logger.debug(`unseen block with id: ${inspect(bestBlockHash)} => using for BC chain`)

          node.rpc.getBlockByHash(bestBlockHash).then(lastBlock => {
            this._logger.info(`collected new block with id: ${inspect(lastBlock.hash)}, with "${lastBlock.tx.length}" transactions`)

            const unifiedBlock = createUnifiedBlock(lastBlock, _createUnifiedBlock)

            this._logger.debug('NEO Going to call this._rpc.rover.collectBlock()')
            this._rpc.rover.collectBlock(unifiedBlock, (err, response) => {
              if (err) {
                this._logger.error(`Error while collecting block ${inspect(err)}`)
                return
              }
              this._logger.debug(`Collector Response: ${JSON.stringify(response.toObject(), null, 4)}`)
            })
          })
        }
      }).catch(e => {
        this._logger.error(`error while getting new block, err: ${e.message}`)
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
