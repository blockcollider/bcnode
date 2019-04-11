/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type { Logger } from 'winston'
import type { RoverClient } from '../../protos/rover_grpc_pb'
import type { RoverMessage } from '../../protos/rover_pb'

const { inspect } = require('util')
const EthereumBlock = require('ethereumjs-block')
const EthereumTx = require('ethereumjs-tx')
const ethUtils = require('ethereumjs-util')
const InputDataDecoder = require('ethereum-input-data-decoder')
const BN = require('bn.js')

const logging = require('../../logger')
const { errToString } = require('../../helper/error')
const { networks } = require('../../config/networks')
const { Block, MarkedTransaction } = require('../../protos/core_pb')
const { RoverMessageType, RoverIdent, RoverSyncStatus } = require('../../protos/rover_pb')
const { RpcClient } = require('../../rpc')
const Network = require('./network').default
const { createUnifiedBlock, isBeforeSettleHeight } = require('../helper')
const { EMBLEM_TESTNET, EMBLEM } = require('./abi')

const BC_NETWORK = process.env.BC_NETWORK || 'main'
const CURRENT_EMBLEM_ABI = (BC_NETWORK === 'main') ? EMBLEM : EMBLEM_TESTNET
const DataDecoder = new InputDataDecoder(CURRENT_EMBLEM_ABI)
const EMB_CONTRACT_ADDRESS = networks[BC_NETWORK].rovers.eth.embContractId

const ROVER_NAME = 'eth'

var logger = logging.getLogger('rover.eth.controller.createUnifiedBlock', false)

async function _createUnifiedBlock (roverRpc: RoverClient, block: EthereumBlock, isStandalone: boolean): Block {
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
  msg.setBlockchain(ROVER_NAME)
  msg.setHash(obj.blockHash)
  msg.setPreviousHash(obj.prevHash)
  msg.setTimestamp(obj.timestamp)
  msg.setHeight(obj.blockNumber)
  msg.setMerkleRoot(obj.root)

  const crossChainTransactions = []
  for (let tx of block.transactions) {
    try {
      let decodedInput = DataDecoder.decodeData(tx.data)
      // console.log(decodedInput.name, ethUtils.bufferToHex(tx.hash(true)), ethUtils.bufferToHex(tx.to))

      let isEmbTx = (EMB_CONTRACT_ADDRESS !== null && decodedInput.name === 'transfer' && ethUtils.bufferToHex(tx.to).toLowerCase() === EMB_CONTRACT_ADDRESS.toLowerCase())
      let isHeightBeforeSettlement = false
      if (!isEmbTx && !isStandalone) {
        isHeightBeforeSettlement = await isBeforeSettleHeight(ethUtils.bufferToHex(tx.from), ethUtils.bufferToHex(tx.to), ROVER_NAME, roverRpc)
      }

      if (isEmbTx || isHeightBeforeSettlement) {
        let [addrTo, transferAmount] = decodedInput.inputs
        let tokenType = isEmbTx ? 'emb' : ROVER_NAME
        let amount = isEmbTx ? transferAmount : tx.value

        let ctx = new MarkedTransaction()
        ctx.setId(ROVER_NAME)
        ctx.setToken(tokenType)
        ctx.setAddrFrom(tx.from)
        ctx.setAddrTo(addrTo)
        ctx.setValue((new BN(amount, 16)).toBuffer())

        ctx.setBlockHeight(msg.getHeight())
        ctx.setIndex(crossChainTransactions.length)
        ctx.setHash(ethUtils.bufferToHex(tx.hash(true)))

        crossChainTransactions.push(tx)
      }
    } catch (_) {
      // could not parse TX's input data
    }
  }

  if (crossChainTransactions.length > 0) {
    const { inspect } = require('util')
    logger.info(`====== token transactions: ${inspect(crossChainTransactions.map(t => t.toObject()))}`)
  }

  msg.setBlockchain('eth')
  msg.setHash(obj.blockHash)
  msg.setPreviousHash(obj.prevHash)
  msg.setTimestamp(obj.timestamp)
  msg.setHeight(obj.blockNumber)
  msg.setMerkleRoot(obj.root)
  msg.setMarkedTxsList(crossChainTransactions)

  return msg
}

/**
 * ETH Controller
 */
export default class Controller {
  _dpt: boolean
  _network: Network
  _rpc: RpcClient
  _logger: Logger
  _isStandalone: boolean

  constructor (isStandalone: boolean) {
    this._dpt = false
    this._rpc = new RpcClient()
    this._logger = logging.getLogger(__filename)
    this._isStandalone = isStandalone
  }

  get network (): Network {
    return this._network
  }

  async transmitNewBlock (block: EthereumBlock, isBlockFromInitialSync: boolean = false) {
    this._logger.info(`transmitNewBlock(), ${parseInt(block.header.number.toString('hex'), 16)}, isBlockFromInitialSync: ${isBlockFromInitialSync}`)
    const unifiedBlock = await createUnifiedBlock(this._isStandalone, block, this._rpc.rover, _createUnifiedBlock)
    if (!this._isStandalone) {
      this._rpc.rover.collectBlock(unifiedBlock, (err, response) => {
        if (err) {
          this._logger.error(`Error while collecting block ${inspect(err)}`)
        } else {
          this._logger.debug(`Collector Response: ${JSON.stringify(response.toObject(), null, 4)}`)
        }
      })
    } else {
      this._logger.debug(`Collected new ETH block: ${unifiedBlock.toObject()}`)
    }
  }

  start (config: { maximumPeers: number }) {
    var network = new Network(config)
    network.on('newBlock', ({ block, isBlockFromInitialSync }) => this.transmitNewBlock(block, isBlockFromInitialSync))
    network.on('reportSyncStatus', (status) => {
      this._rpc.rover.reportSyncStatus((new RoverSyncStatus(['eth', status])))
    })
    network.connect()

    this._network = network
  }

  init (config: { maximumPeers: number }) {
    this.start(config)

    process.on('disconnect', () => {
      this._logger.info('Parent exited')
      process.exit()
    })

    process.on('uncaughtException', (e) => {
      this._logger.error(`Uncaught exception: ${errToString(e)}`)
      process.exit(3)
    })

    const rpcStream = this._rpc.rover.join(new RoverIdent(['eth']))
    rpcStream.on('data', (message: RoverMessage) => {
      this._logger.debug(`rpcStream: Received ${JSON.stringify(message.toObject(), null, 2)}`)
      switch (message.getType()) { // Also could be message.getPayloadCase()
        case RoverMessageType.REQUESTRESYNC:
          this.network.initialResync = true
          this.network.resyncData = message.getResync()
          break

        case RoverMessageType.FETCHBLOCK:
          const payload = message.getFetchBlock()
          this.network.requestBlock(payload.getFromBlock(), payload.getToBlock())
          break

        default:
          this._logger.warn(`Got unknown message type ${message.getType()}`)
      }
    })
    rpcStream.on('close', () => this._logger.info(`gRPC stream from server closed`))
  }

  close () {
    this.network.close()
  }
}
