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
const { RpcClient } = require('../../rpc')
const Network = require('./network').default
const { createUnifiedBlock, isBeforeSettleHeight } = require('../helper')
const { EMBLEM_TESTNET, EMBLEM } = require('./abi')

const BC_NETWORK = process.env.BC_NETWORK || 'main'
const CURRENT_EMBLEM_ABI = (BC_NETWORK === 'main') ? EMBLEM : EMBLEM_TESTNET
const DataDecoder = new InputDataDecoder(CURRENT_EMBLEM_ABI)
const EMB_CONTRACT_ADDRESS = networks[BC_NETWORK].rovers.eth.embContractId

const ROVER_NAME = 'eth'
const MAX_INVALID_COUNT = 8

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
  _parentBlock: ?EthereumBlock
  _invalidDifficultyCount: number

  constructor (isStandalone: boolean) {
    this._dpt = false
    this._rpc = new RpcClient()
    this._logger = logging.getLogger(__filename)
    this._isStandalone = isStandalone
    this._invalidDifficultyCount = 0
  }

  get network (): Network {
    return this._network
  }

  async transmitNewBlock (block: EthereumBlock, isBlockFromInitialSync: boolean = false) {
    this._logger.info(`transmitNewBlock(), ${parseInt(block.header.number.toString('hex'), 16)}, isBlockFromInitialSync: ${isBlockFromInitialSync}`)
    if (this._parentBlock) {
      const difficultyValid = block.header.validateDifficulty(this._parentBlock)
      if (!difficultyValid) {
        if (!isBlockFromInitialSync) {
          this._invalidDifficultyCount++
        }
        const blockInfo = {
          parentBlock: {
            'height': (new BN(this._parentBlock.header.number)).toString(),
            'difficulty': (new BN(this._parentBlock.header.difficulty)).toString()
          },
          newBlock: {
            'height': (new BN(block.header.number)).toString(),
            'difficulty': (new BN(block.header.difficulty)).toString()
          }
        }
        this._logger.warn(`Incoming block has invalid difficulty - rejecting the block, info: ${JSON.stringify(blockInfo)}`)
        if (this._invalidDifficultyCount > MAX_INVALID_COUNT) {
          this._logger.warn(`Maximum amount of invalid ETH blocks reached - restarting rover to try to connect to valid peers`)
          process.exit(1)
        }
        return
      }
      this._invalidDifficultyCount = 0
      this._logger.debug(`Block's ${parseInt(block.header.number.toString('hex'), 16)} difficulty is valid -> creating unified block from it`)
    }
    this._parentBlock = block
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
  }

  message (message: string, rawData: string) {
    switch (message) {
      case 'fetch_block':
        const data = JSON.parse(rawData)
        const { previousLatest, currentLatest } = data
        this.network.requestBlock(previousLatest, currentLatest)
        break

      case 'needs_resync':
        this.network.initialResync = true
        break

      default:
        this._logger.warn(`Unknown message type "${message}"`)
    }
  }

  close () {
    this.network.close()
  }
}
