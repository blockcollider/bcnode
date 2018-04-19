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
const EthereumBlock = require('ethereumjs-block')
const EthereumTx = require('ethereumjs-tx')
var ethUtils = require('ethereumjs-util')

const logging = require('../../logger')
const { Block } = require('../../protos/core_pb')
const { RpcClient } = require('../../rpc')
const Network = require('./network').default
const { createUnifiedBlock } = require('../helper')

function _createUnifiedBlock (block: EthereumBlock): Block {
  const d = block.toJSON({ labeled: true })
  const obj = {
    blockNumber: parseInt(d.header.number, 16),
    prevHash: d.header.parentHash,
    blockHash: '0x' + block.hash().toString('hex'),
    root: d.header.stateRoot,
    nonce: parseInt(d.header.nonce, 16),
    timestamp: parseInt(d.header.timestamp, 16) * 1000,
    difficulty: parseInt(d.header.difficulty, 16),
    coinbase: d.header.coinbase,
    marked: false,
    transactions: d.transactions.map(function (t) {
      const tx = new EthereumTx(t)
      t.txHash = ethUtils.bufferToHex(tx.hash(true))

      return t
    })
  }

  const msg = new Block()
  msg.setBlockchain('eth')
  msg.setHash(obj.blockHash)
  msg.setPreviousHash(obj.prevHash)
  msg.setTimestamp(obj.timestamp)
  msg.setHeight(obj.blockNumber)
  msg.setMerkleRoot(obj.root)

  return msg
}

/**
 * ETH Controller
 */
export default class Controller {
  _dpt: boolean; // eslint-disable-line no-undef
  _interfaces: Object[]; // eslint-disable-line no-undef
  _rpc: RpcClient; // eslint-disable-line no-undef
  _logger: Logger; // eslint-disable-line no-undef

  constructor () {
    this._dpt = false
    this._interfaces = []
    this._rpc = new RpcClient()
    this._logger = logging.getLogger(__filename)
  }

  get interfaces (): Object[] {
    return this._interfaces
  }

  transmitNewBlock (block: EthereumBlock) {
    const unifiedBlock = createUnifiedBlock(block, _createUnifiedBlock)
    this._rpc.rover.collectBlock(unifiedBlock, (err, response) => {
      if (err) {
        this._logger.error(`Error while collecting block ${inspect(err)}`)
        return
      }
      this._logger.debug(`Collector Response: ${JSON.stringify(response.toObject(), null, 4)}`)
    })
  }

  start () {
    var network = new Network()
    network.on('newBlock', block => this.transmitNewBlock(block))

    network.connect()

    this.interfaces.push(network)
  }

  init () {
    this.start()

    process.on('disconnect', () => {
      this._logger.info('parent exited')
      process.exit()
    })

    process.on('uncaughtError', (e) => {
      this._logger.error('Uncaught error', e)
      process.exit(3)
    })
  }

  close () {
    this.interfaces.map((c) => {
      c.close()
    })
  }
}
