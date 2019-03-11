/*
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type Logger from 'winston'
import type PersistenceRocksDb from '../persistence/rocksdb'

const BN = require('bn.js')
const { getLogger } = require('../logger')
const { blake2bl } = require('../utils/crypto')
const { networks } = require('../config/networks')
const TxPendingPool = require('../bc/txPendingPool')
const { UnsettledTxManager } = require('../bc/unsettledTxManager')
const { internalToBN, internalToHuman, COIN_FRACS: { BOSON, NRG } } = require('../core/coin')
const { Transaction, OutPoint } = require('../protos/core_pb')
const {
  COINBASE_MATURITY,
  extractInfoFromCrossChainTxMakerOutputScript,
  extractInfoFromCrossChainTxTakerOutputScript
} = require('../core/txUtils')

const BC_NETWORK = process.env.BC_NETWORK || 'main'
const EMBLEM_CONTRACT_ADDRESS = networks[BC_NETWORK].rovers.eth.embContractId

type AccountBalanceData = {
  confirmed: BN,
  unconfirmed: BN,
  collateralized: BN,
  confirmedUnspentOutPoints: [],
  unconfirmedUnspentOutPoints: [],
  collateralizedOutPoints: []
}

export class Wallet {
  _persistence: PersistenceRocksDb
  _unsettledTxManager: UnsettledTxManager
  _logger: Logger

  constructor (persistence: PersistenceRocksDb, unsettledTxManager: UnsettledTxManager) {
    this._persistence = persistence
    this._unsettledTxManager = unsettledTxManager
    this._logger = getLogger(__filename)
  }

  async getAddressRelatedOutPoints (address: string, outputTransaction: Transaction, blockHeight: number, blockchain: string = 'bc'): Promise<{ spendableOutPoints: OutPoint[], collateralizedOutPoints: OutPoint[] }> {
    const outputs = outputTransaction.getOutputsList()

    function hasAddressInScript (script: string, address: string): boolean {
      const asBlake = blake2bl(address)
      const asBlakePowered = blake2bl(blake2bl(address))
      return script.indexOf(address) > -1 || script.indexOf(asBlake) > -1 || script.indexOf(asBlakePowered) > -1
    }

    const result = { spendableOutPoints: [], collateralizedOutPoints: [] }
    for (let i = 0; i < outputs.length; i++) {
      const out = outputs[i]
      const key = TxPendingPool.getOutpointClaimKey(outputTransaction.getHash(), i, blockchain)
      const claimed = await this._persistence.get(key)
      if (claimed) {
        continue
      }
      const op = new OutPoint()
      op.setHash(outputTransaction.getHash())
      op.setIndex(i)

      const callbackScript = Buffer.from(out.getOutputScript()).toString('ascii')
      const latestBlock = await this._persistence.get('bc.block.latest')
      const latestBlockHeight = latestBlock.getHeight()
      if (callbackScript.startsWith('OP_MONOID') || callbackScript.endsWith('OP_CALLBACK')) {
        let outputScript = callbackScript
        while (outputScript.endsWith('OP_CALLBACK')) {
          const [parentTxHash, parentOutputIndex] = outputScript.split(' ')
          const _makerTx = await this._persistence.getTransactionByHash(parentTxHash, 'bc')
          const _makerTxOutput = _makerTx.getOutputsList()[parentOutputIndex]

          outputScript = Buffer.from(_makerTxOutput.getOutputScript()).toString('ascii')
        }

        if (!hasAddressInScript(outputScript, address)) {
          continue
        }

        op.setValue(out.getValue())

        const makerTxInfo = extractInfoFromCrossChainTxMakerOutputScript(outputScript)
        const settleEndsAtBlockHeight = blockHeight + makerTxInfo.settleEndsAt
        if (latestBlockHeight < settleEndsAtBlockHeight) {
          result.collateralizedOutPoints.push(op)
        } else {
          result.spendableOutPoints.push(op)
        }
      } else if (callbackScript.indexOf('OP_MONAD') > -1 && callbackScript.indexOf('OP_CALLBACK') > -1) {
        const takerTradeInfo = extractInfoFromCrossChainTxTakerOutputScript(callbackScript)
        // find the MONOID
        const makerTx = await this._persistence.getTransactionByHash(takerTradeInfo.makerTxHash, 'bc')
        const makerTxOutput = makerTx.getOutputsList()[takerTradeInfo.makerTxOutputIndex]
        let monoidScript = Buffer.from(makerTxOutput.getOutputScript()).toString('ascii')
        while (monoidScript.endsWith('OP_CALLBACK')) {
          const [parentTxHash, parentOutputIndex] = monoidScript.split(' ')
          const _makerTx = await this._persistence.getTransactionByHash(parentTxHash, 'bc')
          const _makerTxOutput = _makerTx.getOutputsList()[parentOutputIndex]

          monoidScript = Buffer.from(_makerTxOutput.getOutputScript()).toString('ascii')
        }

        const makerTxInfo = extractInfoFromCrossChainTxMakerOutputScript(monoidScript)
        const settleEndsAtBlockHeight = blockHeight + makerTxInfo.settleEndsAt
        const isBeforeSettleEnds = (latestBlockHeight < settleEndsAtBlockHeight)

        const makerSettlesInfo = await this._unsettledTxManager.getTxSettleInfo(takerTradeInfo.makerTxHash, takerTradeInfo.makerTxOutputIndex)
        const takerSettlesInfo = await this._unsettledTxManager.getTxSettleInfo(outputTransaction.getHash(), i)

        const halfBN = (new BN(out.getValue())).div(new BN(2))
        if (hasAddressInScript(monoidScript, address)) {
          if (makerSettlesInfo) { // maker settles, maker can spend at least half of the value
            if (takerSettlesInfo) {
              op.setValue(new Uint8Array(halfBN.toBuffer()))
              result.spendableOutPoints.push(op)
            } else if (!isBeforeSettleEnds) { // taker fails to settle, maker can spend all
              op.setValue(out.getValue())
              result.spendableOutPoints.push(op)
            }
          } else {
            if (!isBeforeSettleEnds && !takerSettlesInfo) {
              op.setValue(new Uint8Array(halfBN.toBuffer()))
              result.spendableOutPoints.push(op)
            }
          }
        } else if (hasAddressInScript(callbackScript, address)) {
          if (takerSettlesInfo) { // taker settles
            if (makerSettlesInfo) {
              op.setValue(new Uint8Array(halfBN.toBuffer()))
              result.spendableOutPoints.push(op)
            } else if (!isBeforeSettleEnds) { // maker fails to settle, taker can spend all
              op.setValue(out.getValue())
              result.spendableOutPoints.push(op)
            }
          } else {
            if (!isBeforeSettleEnds && !makerSettlesInfo) {
              op.setValue(new Uint8Array(halfBN.toBuffer()))
              result.spendableOutPoints.push(op)
            }
          }
        }
      } else {
        op.setValue(out.getValue())
        if (hasAddressInScript(callbackScript, address)) {
          result.spendableOutPoints.push(op)
        }
      }
    }

    return result
  }

  async getBalanceData (address: string,
    opts: Object = { connectedChain: 'eth', token: EMBLEM_CONTRACT_ADDRESS, resetBlockIndex: false, asBuffer: true, highWaterMark: 100000000 }
  ): Promise<AccountBalanceData|Error> {
    const blockchain = 'bc'
    let currentBlockIndex
    let indexedBlock
    const accountBalances = {
      blockchain: blockchain,
      token: opts.token,
      confirmed: new BN(0),
      unconfirmed: new BN(0),
      collateralized: new BN(0),
      confirmedUnspentOutPoints: [],
      unconfirmedUnspentOutPoints: [],
      collateralizedOutPoints: []
    }

    const latestBlock = await this._persistence.get(`${blockchain}.block.latest`)
    if (!latestBlock) {
      throw new Error('Latest block not found')
    }
    const latestBlockHeight = latestBlock.getHeight()
    indexedBlock = await this._persistence.get(`${blockchain}.addr.${address}.block.index`)

    if (!indexedBlock) {
      currentBlockIndex = 1
    } else {
      currentBlockIndex = indexedBlock.getHeight()
    }

    for (let i = currentBlockIndex; i <= latestBlockHeight; i++) {
      try {
        const block: Object = await this._persistence.get(`${blockchain}.block.${i}`)
        let keyPrefix
        // if the address balance is in terms of Block Collider NRG
        for (let tx of block.getTxsList()) {
          keyPrefix = 'confirmed'
          if (
            // coinbase TX
            tx.getInputsList().length === 0 &&
            // is not mature yet
            latestBlockHeight < block.getHeight() + COINBASE_MATURITY
          ) {
            keyPrefix = 'unconfirmed'
          }
          const txOutpointsCatalog = await this.getAddressRelatedOutPoints(address, tx, block.getHeight(), 'bc')

          const spendableOutPoints = txOutpointsCatalog.spendableOutPoints
          let sum = new BN(0)
          for (let out of spendableOutPoints) {
            sum = sum.add(internalToBN(out.getValue(), BOSON))
            this._logger.debug(`++++-++++-++++-++++> spendableOutPoints: ${internalToHuman(out.getValue(), NRG)}, sum :${sum}`)
          }
          accountBalances[`${keyPrefix}UnspentOutPoints`] = accountBalances[`${keyPrefix}UnspentOutPoints`].concat(spendableOutPoints)
          accountBalances[keyPrefix] = accountBalances[keyPrefix].add(sum)

          sum = new BN(0)
          for (let out of txOutpointsCatalog.collateralizedOutPoints) {
            sum = sum.add(internalToBN(out.getValue(), BOSON))
            this._logger.debug(`++++-++++-++++-++++> collateralizedOutPoints: ${internalToHuman(out.getValue(), NRG)}, sum :${sum}`)
          }
          accountBalances['collateralized'] = accountBalances['collateralized'].add(sum)
          accountBalances['collateralizedOutPoints'] = accountBalances['collateralizedOutPoints'].concat(txOutpointsCatalog.collateralizedOutPoints)
        }
      } catch (err) {
        return err
      }
    }

    return accountBalances
  }
}
