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

  _createUnifiedBlock (block: EthereumBlock) {
    const d = block.toJSON({ labeled: true })
    const obj = {}

    obj.blockNumber = parseInt(d.header.number, 16)
    obj.prevHash = d.header.parentHash
    obj.blockHash = '0x' + block.hash().toString('hex')
    obj.root = d.header.stateRoot
    obj.nonce = parseInt(d.header.nonce, 16)
    obj.timestamp = parseInt(d.header.timestamp, 16)
    obj.difficulty = parseInt(d.header.difficulty, 16)
    obj.coinbase = d.header.coinbase
    obj.marked = false
    obj.transactions = d.transactions.map(function (t) {
      var tx = new EthereumTx(t)
      // var v = ethUtils.bufferToInt(t.v)
      // var e = ethUtils.ecrecover(tx.hash(true), v, t.r, t.s).toString("hex");

      t.txHash = ethUtils.bufferToHex(tx.hash(true))

      return t
    })

    return obj
  }

  transmitNewBlock (block: EthereumBlock) {
    const unifiedBlockData = this._createUnifiedBlock(block)

    const msg = new Block()
    msg.setBlockchain('eth')
    msg.setHash(unifiedBlockData.blockHash)

    this._logger.debug(`Created unified block from eth block ${unifiedBlockData.blockNumber} (${unifiedBlockData.blockHash})`)
    this._rpc.rover.collectBlock(msg, (err, response) => {
      if (err) {
        this._logger.error(`Error while collecting block ${inspect(err)}`)
        return
      }
      this._logger.debug(`Collector Response ${inspect(response)}`)
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
  }

  close () {
    this.interfaces.map((c) => {
      c.close()
    })
  }
}
