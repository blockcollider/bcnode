/*
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// A layer for DEX and BlockChain

/*
*/
import type { Logger } from 'winston'

type MakerOpenOrder = {
  shiftStartsAt: number,
  depositEndsAt: number,
  settleEndsAt: number,
  paysChainId: string,
  wantsChainId: string,
  wantsAddress: string,
  wantsUnit: string,
  paysUnit: string,
  doubleHashedBcAddress: string,
  collateralizedNrg: string,
  nrgUnit: string,
  txHash: string,
  txOutputIndex: number,
  blockHash: string,
  blockHeight: number,
  isSettled: boolean,
  blockHeightHasOriginalMakerTx: number
}

type MatchedNotSettledOpenOrder = {
  maker: MakerOpenOrder,
  taker: {
    sendsAddress: string,
    wantsAddress: string,
    makerTxHash: string,
    makerTxOutputIndex: string|number,
    doubleHashedBcAddress: string,
    collateralizedNrg: string,
    txHash: string,
    blockHash: string,
    blockHeight: number,
    isSettled: boolean
  }
}

const BN = require('bn.js')
const debug = require('debug')('bcnode:dex:dexLib')

const { default: PersistenceRocksDb } = require('../persistence/rocksdb')
const { Transaction } = require('../protos/core_pb')

const { getLogger } = require('../logger')
const { humanToBN, Currency, CurrencyInfo, COIN_FRACS: { NRG } } = require('../core/coin')

const {
  extractInfoFromCrossChainTxMakerOutputScript,
  extractInfoFromCrossChainTxTakerInputScript
} = require('../core/txUtils')

const { UnsettledTxManager } = require('../bc/unsettledTxManager')

const LOOK_BACK_BC_HEIGHT_FOR_OPEN_ORDER = 7 * 24 * 3600 / 5
const {DexUtils} = require('./dexUtils')

export class DexLib {
  persistence: PersistenceRocksDb
  _logger: Logger
  unsettledTxManager: UnsettledTxManager
  utils: DexUtils

  constructor (persistence: PersistenceRocksDb) {
    this.persistence = persistence
    this._logger = getLogger(__filename)
    this.unsettledTxManager = new UnsettledTxManager(this.persistence)
    this.utils = new DexUtils(persistence)
  }

  async placeMakerOrder (
    shift: string, deposit: string, settle: string,
    payWithChainId: string, wantChainId: string, receiveAddress: string, makerWantsUnit: string, makerPaysUnit: string,
    makerBCAddress: string, makerBCPrivateKeyHex: string,
    collateralizedNrg: string, nrgUnit: string,
    additionalTxFee: string,
    minerKey: string
  ): Promise<Transaction|Error> {
    this._logger.info(`placeMakerOrder`)

    // get total amount to spend
    let {totalNRG} = await this.calculateMakerFee(shift, deposit, settle, payWithChainId, wantChainId, makerWantsUnit, makerPaysUnit, collateralizedNrg, nrgUnit)


    const indivisiblePaysUnit = Currency.toMinimumUnitAsStr(
      payWithChainId, makerPaysUnit, CurrencyInfo[payWithChainId].humanUnit
    )
    const indivisibleWantsUnit = Currency.toMinimumUnitAsStr(
      wantChainId, makerWantsUnit, CurrencyInfo[wantChainId].humanUnit
    )

    // get maker order output
    const newOutputToReceiver = await this.utils.getMakerOrderOutput(
      shift, deposit, settle,
      payWithChainId, wantChainId, receiveAddress, indivisibleWantsUnit, indivisiblePaysUnit,
      makerBCAddress, collateralizedNrg, nrgUnit
    )

    // compile tx
    return this.utils.compileTx(
      [newOutputToReceiver], [], totalNRG,
      makerBCAddress, makerBCPrivateKeyHex, minerKey
    )
  }

  async placeTakerOrder (
    takerWantsAddress: string, takerSendsAddress: string,
    makerTxHash: string, makerTxOutputIndex: number,
    takerBCAddress: string, takerBCPrivateKeyHex: string,
    collateralizedNrg: string,
    additionalTxFee: string,
    minerKey: string
  ): Promise<Transaction|Error> {
    debug(`placeTakerOrder`)

    // get total amount to spend
    let {totalNRG} = await this.calculateTakerFee(makerTxHash, makerTxOutputIndex, collateralizedNrg)

    // get the relevant maker inputs and outpoint for the tx
    const {input, outputs} = await this.utils.getMakerInputsAndOutpointForTaker(
      takerWantsAddress, takerSendsAddress,
      makerTxHash, makerTxOutputIndex,
      takerBCAddress, collateralizedNrg
    )

    // compile tx
    return this.utils.compileTx(
      [outputs], [input], totalNRG,
      takerBCAddress, takerBCPrivateKeyHex, minerKey
    )
  }

  async placeTakerOrders (
    orders:[{
      takerWantsAddress: string,
      takerSendsAddress: string,
      makerTxHash: string,
      makerTxOutputIndex: number,
      collateralizedNrg: string
    }],
    takerBCAddress: string, takerBCPrivateKeyHex: string,
    additionalTxFee: string,
    minerKey: string
  ): Promise<Transaction|Error> {
    debug(`placeTakerOrders`)

    // setup total amount of nrg taker has to spend, inputs and outputs
    let totalAmount = new BN(0)
    if (additionalTxFee !== '0') {
      totalAmount.add(humanToBN(additionalTxFee, NRG))
    }
    let allInputs = []
    let allOutputs = []

    orders.map(async ({takerWantsAddress, takerSendsAddress, makerTxHash, makerTxOutputIndex, collateralizedNrg}) => {
      // add to total amount of nrg to spend
      let {totalNRG} = await this.calculateTakerFee(makerTxHash, makerTxOutputIndex, collateralizedNrg)
      totalAmount = totalAmount.add(totalNRG)

      // add to inputs and outputs
      const {input, outputs} = await this.utils.getMakerInputsAndOutpointForTaker(
        takerWantsAddress, takerSendsAddress,
        makerTxHash, makerTxOutputIndex,
        takerBCAddress, collateralizedNrg
      )

      allInputs.push(input)
      allOutputs = allOutputs.concat(outputs)
    })

    // compile tx
    return this.utils.compileTx(
      allOutputs, allInputs, totalAmount,
      takerBCAddress, takerBCPrivateKeyHex, minerKey
    )
  }

  async calculateMakerFee (
    shift: string, deposit: string, settle: string,
    payWithChainId: string, wantChainId: string, makerWantsUnit: string, makerPaysUnit: string,
    collateralizedNrg: string, nrgUnit: string, additionalTxFee : string = '0'
  ): Promise<{totalNRG:BN, txFee:BN}> {
    debug(`calculateMakerFee`)

    // params check
    this.utils.makerParamsCheck(deposit, settle, makerWantsUnit, makerPaysUnit, collateralizedNrg, nrgUnit)

    const collateralizedBN = humanToBN(collateralizedNrg, NRG)
    const latestBlock = await this.persistence.get('bc.block.latest')
    if (!latestBlock) {
      throw new Error('Latest block not found')
    }
    const blockWindow = new BN(parseInt(settle, 10) - parseInt(shift, 10))

    const txFee = await this.utils.calculateCrossChainTxFee(collateralizedBN, blockWindow, new BN(latestBlock.getHeight()), 'maker')
    const totalNRG = (additionalTxFee !== '0') ? txFee.add(collateralizedBN).add(humanToBN(additionalTxFee, NRG)) : txFee.add(collateralizedBN)

    return {totalNRG, txFee}
  }

  async calculateTakerFee (
    makerTxHash: string, makerTxOutputIndex: number,
    collateralizedNrg: string, additionalTxFee : string = '0'
  ): Promise<{totalNRG:BN, txFee:BN}> {
    debug(`calculateTakerFee`)

    const collateralizedBN = humanToBN(collateralizedNrg, NRG)
    const latestBlock = await this.persistence.get('bc.block.latest')
    if (!latestBlock) {
      throw new Error('Latest block not found')
    }
    let {blockWindow} = await this.utils.getMakerData(makerTxHash, makerTxOutputIndex, collateralizedNrg)

    const txFee = await this.utils.calculateCrossChainTxFee(collateralizedBN, blockWindow, new BN(latestBlock.getHeight()), 'taker')
    const totalNRG = (additionalTxFee !== '0') ? txFee.add(collateralizedBN).add(humanToBN(additionalTxFee, NRG)) : txFee.add(collateralizedBN)

    return {totalNRG, txFee}
  }

  async getOpenOrders (): Promise<MakerOpenOrder[]|Error> {
    const openOrders = []
    const latestBlock = await this.persistence.get('bc.block.latest')
    if (!latestBlock) {
      throw new Error('Latest block not found')
    }
    const latestBlockHeight = latestBlock.getHeight()
    const currentBlockIndex = Math.max(1, latestBlockHeight - LOOK_BACK_BC_HEIGHT_FOR_OPEN_ORDER)
    this._logger.info(`getOpenOrders from BC height: ${currentBlockIndex}, to BC height: ${latestBlockHeight}`)

    let blocks = []
    for (let i = currentBlockIndex; i < latestBlockHeight; i++) {
      blocks.push(`bc.block.${currentBlockIndex + i}`)
    }
    blocks = await this.persistence.getBulk(blocks)

    for (let block of blocks) {
      for (let tx of block.getTxsList()) {
        const txOutputs = tx.getOutputsList()
        for (let index = 0; index < txOutputs.length; index++) {
          const output = txOutputs[index]

          try {
            let {monoidMakerTxHash, makerTxOutputScript, monoidMakerTxOutput, monoidMakerTxOutputIndex} = await this.utils.getMonoidForMaker(tx, output, index)
            await this.utils.isClaimedCheck(monoidMakerTxHash, monoidMakerTxOutputIndex)

            let blockWindow = await this.utils.getBlockWindowIfWithinDepositWindow(makerTxOutputScript, monoidMakerTxHash)
            let tradeInfo = extractInfoFromCrossChainTxMakerOutputScript(makerTxOutputScript)
            const blockHasOriginalMakerTxHeight = blockWindow.add(new BN(latestBlockHeight)).sub(new BN(tradeInfo.shiftStartsAt + tradeInfo.settleEndsAt))

            let order = this.utils.formatTradeInfoForOpenOrders(
              monoidMakerTxHash, tx.getHash(),
              output, monoidMakerTxOutput,
              tradeInfo, index, block,
              blockHasOriginalMakerTxHeight
            )
            openOrders.push(order)
          } catch (e) {
            // not a maker order nor callback maker order or is claimed
            // if(! e.toString().includes('not a valid maker tx')) console.log({e})
            continue
          }
        }
      }
    }
    return openOrders
  }

  async getMatchedOrders (onlySettled: boolean): Promise<MatchedNotSettledOpenOrder[]|Error> {
    const matchedNotSettledOrders = []
    const latestBlock = await this.persistence.get('bc.block.latest')
    if (!latestBlock) {
      throw new Error('Latest block not found')
    }
    const latestBlockHeight = latestBlock.getHeight()
    const currentBlockIndex = Math.max(1, latestBlockHeight - LOOK_BACK_BC_HEIGHT_FOR_OPEN_ORDER)
    this._logger.info(`getMatchedOpenOrders from BC height: ${currentBlockIndex}, to BC height: ${latestBlockHeight}`)

    let blocks = []
    for (let i = currentBlockIndex; i < latestBlockHeight; i++) {
      blocks.push(`bc.block.${currentBlockIndex + i}`)
    }
    blocks = await this.persistence.getBulk(blocks)

    for (let block of blocks) {
      for (let tx of block.getTxsList()) {
        // get all the taker orders within a tx
        let takerTradeOrders = await this.utils.extractTakerFromTx(tx, block)
        // for each taker order find the respective maker order
        for (let takerTradeInfo of takerTradeOrders) {
          const txInputs = tx.getInputsList()
          let makerTradeInfo = null
          let found = false
          for (let txInput of txInputs) {
            if (found) break // found the tx

            const outPoint = txInput.getOutPoint()
            const outPointTxHash = outPoint.getHash()
            const outputIndex = outPoint.getIndex()

            // check if the outpoint matches the makerTxHash
            if (outPointTxHash !== takerTradeInfo.makerTxHash || outputIndex !== takerTradeInfo.makerTxOutputIndex) {
              continue
            }

            const referencedTx = await this.persistence.getTransactionByHash(outPointTxHash, 'bc')
            if (!referencedTx) {
              continue
            }
            const referencedTxOutput = referencedTx.getOutputsList()[outputIndex]

            try {
              let {monoidMakerTxHash, makerTxOutputScript, monoidMakerTxOutput} = await this.utils.getMonoidForMaker(referencedTx, referencedTxOutput, outputIndex)
              let originalBlockHeight = await this.utils.getBlockHeightIfWithinSettleWindow(makerTxOutputScript, monoidMakerTxHash)
              let tradeInfo = extractInfoFromCrossChainTxMakerOutputScript(makerTxOutputScript)

              makerTradeInfo = await this.utils.formatTradeInfoForOpenOrders(
                monoidMakerTxHash, outPointTxHash,
                referencedTxOutput, monoidMakerTxOutput,
                tradeInfo, outputIndex, block,
                originalBlockHeight
              )

              // add wants and sends information to Taker
              const inputScript = Buffer.from(txInput.getInputScript()).toString('ascii')
              const takerInputInfo = extractInfoFromCrossChainTxTakerInputScript(inputScript)
              takerTradeInfo['wantsAddress'] = takerInputInfo.takerWantsAddress
              takerTradeInfo['sendsAddress'] = takerInputInfo.takerSendsAddress

              makerTradeInfo['isSettled'] = !!(await this.unsettledTxManager.getTxSettleInfo(makerTradeInfo.txHash, makerTradeInfo.txOutputIndex))
              takerTradeInfo['isSettled'] = !!(await this.unsettledTxManager.getTxSettleInfo(takerTradeInfo.txHash, takerTradeInfo.txOutputIndex))

              if (onlySettled && !makerTradeInfo['isSettled'] && !takerTradeInfo['isSettled']) continue

              matchedNotSettledOrders.push({
                maker: makerTradeInfo,
                taker: takerTradeInfo
              })

              found = true
            } catch (e) {

            }
          }
        }
      }
    }
    return matchedNotSettledOrders
  }
}
