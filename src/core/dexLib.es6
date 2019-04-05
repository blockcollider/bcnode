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
const Random = require('random-js')
const secp256k1 = require('secp256k1')

const ROOT_DIR = '../'

const PersistenceRocksDb = require(ROOT_DIR + 'persistence').RocksDb
const { Transaction, TransactionOutput, TransactionInput, OutPoint } = require(ROOT_DIR + 'protos/core_pb')

const { blake2bl } = require(ROOT_DIR + 'utils/crypto')
const { getLogger } = require(ROOT_DIR + 'logger')
const { humanToBN, internalToBN, internalToHuman, COIN_FRACS: { NRG, BOSON } } = require(ROOT_DIR + 'core/coin')

const {
  txHash, txInputSignature, ScriptTemplates,
  extractInfoFromCrossChainTxMakerOutputScript,
  extractInfoFromCrossChainTxTakerOutputScript,
  extractInfoFromCrossChainTxTakerInputScript
} = require(ROOT_DIR + 'core/txUtils')
const TxPendingPool = require(ROOT_DIR + 'bc/txPendingPool')
const { Wallet } = require(ROOT_DIR + 'bc/wallet')

const { UnsettledTxManager } = require(ROOT_DIR + 'bc/unsettledTxManager')

const LOOK_BACK_BC_HEIGHT_FOR_OPEN_ORDER = 7 * 24 * 3600 / 5
const {DexUtils} = require('./dexUtils');

export class DexLib {
  persistence: PersistenceRocksDb
  _logger: Logger
  unsettledTxManager: UnsettledTxManager
  wallet: Wallet
  utils: DexUitls

  constructor (persistence: PersistenceRocksDb) {
    this.persistence = persistence
    this._logger = getLogger(__filename)
    this.unsettledTxManager = new UnsettledTxManager(this.persistence)
    this.wallet = new Wallet(persistence, this.unsettledTxManager)
    this.utils = new DexUtils(persistence);
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

    //get fee and total amount to spend
    let txFeeBN = await this.calculateMakerFee(shift, deposit, settle, payWithChainId, wantChainId, makerWantsUnit, makerPaysUnit, collateralizedNrg, nrgUnit);
    const totalAmount = humanToBN(collateralizedNrg, NRG).add(txFeeBN)
    if(additionalTxFee !== '0') totalAmount.add(humanToBN(additionalTxFee, NRG))

    //get maker order output
    const collateralizedBN = humanToBN(collateralizedNrg, NRG)
    const unitBN = humanToBN(nrgUnit, NRG)
    const outputLockScript = ScriptTemplates.createCrossChainTxMakerOutputScript(
      shift, deposit, settle,
      payWithChainId, wantChainId, receiveAddress, makerWantsUnit, makerPaysUnit,
      makerBCAddress
    )
    const newOutputToReceiver = await this.utils.createTransactionOutput(outputLockScript,unitBN,collateralizedBN)

    //compile tx
    return await this.utils.compileTx(
      [newOutputToReceiver],[],totalAmount,
      makerBCAddress,makerBCPrivateKeyHex,minerKey
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
    this._logger.info(`placeTakerOrder`)

    // get fee and total amount to spend
    let txFeeBN = await this.calculateTakerFee(makerTxHash, makerTxOutputIndex, collateralizedNrg)
    const totalAmount = humanToBN(collateralizedNrg, NRG).add(txFeeBN)
    if(additionalTxFee !== '0') totalAmount.add(humanToBN(additionalTxFee, NRG))

    //get the relevant maker inputs and outpoint for the tx
    const {input,outputs} = await this.utils.getMakerInputsAndOutpointForTaker(
      takerWantsAddress,takerSendsAddress,
      makerTxHash, makerTxOutputIndex,
      takerBCAddress, collateralizedNrg
    )

    //compile tx
    return await this.utils.compileTx(
      outputs,[input],totalAmount,
      takerBCAddress,takerBCPrivateKeyHex,minerKey
    )

  }

  async placeTakerOrders (
    orders:[{takerWantsAddress: string, takerSendsAddress: string,
    makerTxHash: string, makerTxOutputIndex: number,collateralizedNrg: string}],
    takerBCAddress: string, takerBCPrivateKeyHex: string,
    additionalTxFee: string
  ): Promise<Transaction|Error> {
    this._logger.info(`placeTakerOrders`)

    //setup total amount of nrg taker has to spend
    let totalAmount = BN(0);
    if(additionalTxFee !== '0') totalAmount = totalAmount.add(humanToBN(additionalTxFee, NRG));
    let allInputs = []
    let allOutputs = []

    orders.map(async ({takerWantsAddress,takerSendsAddress,makerTxHash,makerTxOutputIndex,takerBCAddress,collateralizedNrg})=>{

      //add to total amount of nrg to spend
      let txFeeBN = await this.calculateTakerFee(makerTxHash, makerTxOutputIndex,collateralizedNrg)
      totalAmount = totalAmount.add(humanToBN(collateralizedNrg, NRG).add(txFeeBN))

      //add to inputs and outputs
      const {input,outputs} = await this.utils.getMakerInputsAndOutpointForTaker(
        takerWantsAddress,takerSendsAddress,
        makerTxHash, makerTxOutputIndex,
        takerBCAddress, collateralizedNrg
      )
      allInputs.push(input)
      allOutputs = allinputs.concat(outputs)
    });

    //compile tx
    return await this.utils.compileTx(
      allOutputs,allInputs,totalAmount,
      takerBCAddress,takerBCPrivateKeyHex,minerKey
    )

  }

  async calculateMakerFee(
    shift: string, deposit: string, settle: string,
    payWithChainId: string, wantChainId: string, makerWantsUnit: string, makerPaysUnit: string,
    collateralizedNrg: string, nrgUnit: string
  ): Promise<BN> {
    this._logger.info(`calculateMakerFee`)

    //params check
    this.utils.makerParamsCheck(deposit,settle, makerWantsUnit, makerPaysUnit,collateralizedNrg, nrgUnit);

    const collateralizedBN = humanToBN(collateralizedNrg, NRG)
    const latestBlock = await this.persistence.get('bc.block.latest')
    const blockWindow = new BN(parseInt(settle, 10) - parseInt(shift, 10))

    return await this.utils.calculateCrossChainTxFee(collateralizedBN, blockWindow, new BN(latestBlock.getHeight()), 'maker')
  }

  async calculateTakerFee(
    makerTxHash: string, makerTxOutputIndex: number,
    collateralizedNrg: string,
  ): Promise<BN> {
    this._logger.info(`calculateTakerFee`)

    let {blockWindow} = await this.utils.getMakerData(makerTxHash,makerTxOutputIndex,collateralizedNrg)

    const collateralizedBN = humanToBN(collateralizedNrg, NRG)
    const latestBlock = await this.persistence.get('bc.block.latest')
    const latestBlockHeight = latestBlock.getHeight()

    return await this.utils.calculateCrossChainTxFee(collateralizedBN, blockWindow, new BN(latestBlockHeight), 'taker')
  }

  async getOpenOrders (): Promise<MakerOpenOrder[]|Error> {
    const openOrders = []
    const latestBlock = await this.persistence.get('bc.block.latest')
    if (!latestBlock) {
      throw new Error('Latest block not found')
    }
    const latestBlockHeight = latestBlock.getHeight()
    let currentBlockIndex = Math.max(1, latestBlockHeight - LOOK_BACK_BC_HEIGHT_FOR_OPEN_ORDER)
    this._logger.info(`getOpenOrders from BC height: ${currentBlockIndex}, to BC height: ${latestBlockHeight}`)
    const txHashToBlockHeightMap = {}

    for (let i = currentBlockIndex; i <= latestBlockHeight; i++) {
      try {
        const block: Object = await this.persistence.get(`bc.block.${i}`)
        const currentBlockHeight = block.getHeight()
        for (let tx of block.getTxsList()) {

          const txOutputs = tx.getOutputsList()
          for (let index = 0; index < txOutputs.length; index++) {

            const output = txOutputs[index]
            let outputLockScript = Buffer.from(output.getOutputScript()).toString('ascii')
            if (outputLockScript.startsWith('OP_MONOID')) {
              txHashToBlockHeightMap[tx.getHash()] = currentBlockHeight
            }

            let originalMakerInfo = { hash: tx.getHash(), output: output }
            while (outputLockScript.endsWith('OP_CALLBACK')) {
              const [parentTxHash, parentOutputIndex] = outputLockScript.split(' ')
              const _makerTx = await this.persistence.getTransactionByHash(parentTxHash, 'bc')
              const _makerTxOutput = _makerTx.getOutputsList()[parentOutputIndex]
              outputLockScript = Buffer.from(_makerTxOutput.getOutputScript()).toString('ascii')

              originalMakerInfo.hash = _makerTx.getHash()
              originalMakerInfo.output = _makerTxOutput
            }

            const blockHasOriginalMakerTxHeight = txHashToBlockHeightMap[originalMakerInfo.hash]

            if (outputLockScript.startsWith('OP_MONOID')) {
              const claimedKey = TxPendingPool.getOutpointClaimKey(tx.getHash(), index, 'bc')
              const isClaimed = await this.persistence.get(claimedKey)

              if (!isClaimed) {
                const tradeInfo = extractInfoFromCrossChainTxMakerOutputScript(outputLockScript)
                // check shift, deposit and settle
                if (!(latestBlockHeight >= blockHasOriginalMakerTxHeight + tradeInfo.shiftStartsAt && latestBlockHeight <= blockHasOriginalMakerTxHeight + tradeInfo.depositEndsAt)) {
                  const logMsg = {
                    txHash: tx.getHash(),
                    txOutputIndex: index,
                    blockHeight: currentBlockHeight,
                    blockHasOriginalMakerTxHeight: blockHasOriginalMakerTxHeight,
                    shiftStartsAt: tradeInfo.shiftStartsAt,
                    depositEndsAt: tradeInfo.depositEndsAt,
                    latestBlockHeight: latestBlockHeight
                  }
                  this._logger.info(`Maker tx: ${JSON.stringify(logMsg)} is outside the deposit window`)
                  continue
                }
                if (originalMakerInfo.hash !== tx.getHash()) {
                  // update wantsUnit and paysUnit
                  const remainingRatio = parseFloat(internalToHuman(output.getValue(), NRG)) / parseFloat(internalToHuman(originalMakerInfo.output.getValue(), NRG))
                  tradeInfo['wantsUnit'] = (parseFloat(tradeInfo['wantsUnit']) * remainingRatio).toString()
                  tradeInfo['paysUnit'] = (parseFloat(tradeInfo['paysUnit']) * remainingRatio).toString()
                }

                tradeInfo['collateralizedNrg'] = internalToHuman(output.getValue(), NRG)
                tradeInfo['nrgUnit'] = internalToHuman(output.getUnit(), NRG)
                tradeInfo['txHash'] = tx.getHash()
                tradeInfo['txOutputIndex'] = index
                tradeInfo['blockHash'] = block.getHash()
                tradeInfo['blockHeight'] = currentBlockHeight
                tradeInfo['isSettled'] = false
                tradeInfo['blockHeightHasOriginalMakerTx'] = blockHasOriginalMakerTxHeight

                openOrders.push(tradeInfo)
              }
            }
          }
        }
      } catch (e) {
        this._logger.error(e)
      }
    }

    this._logger.info(`getOpenOrders from BC height: ${currentBlockIndex}, to BC height: ${latestBlockHeight}, orders: ${openOrders.length}`)
    return openOrders
  }

  async getMatchedOpenOrders (): Promise<MatchedNotSettledOpenOrder[]|Error> {
    const matchedNotSettledOrders = []
    const latestBlock = await this.persistence.get('bc.block.latest')
    if (!latestBlock) {
      throw new Error('Latest block not found')
    }
    const latestBlockHeight = latestBlock.getHeight()
    const hashToTxMap = {}

    let currentBlockIndex = 1
    if (latestBlockHeight > 2 * Math.pow(10, 6)) {
      currentBlockIndex = Math.max(1, latestBlockHeight - LOOK_BACK_BC_HEIGHT_FOR_OPEN_ORDER)
    }
    for (let i = currentBlockIndex; i <= latestBlockHeight; i++) {
      try {
        const block: Object = await this.persistence.get(`bc.block.${i}`)
        if (!block) {
          this._logger.warn(`block-${i} is not found`)
          continue
        }
        for (let tx of block.getTxsList()) {
          let takerTradeInfo = null
          const txOutputs = tx.getOutputsList()
          for (let i = 0; i < txOutputs.length; i++) {
            const txOutput = txOutputs[i]
            const txOutputScript = Buffer.from(txOutput.getOutputScript()).toString('ascii')
            if (txOutputScript.indexOf('OP_MONAD') > -1 && txOutputScript.indexOf('OP_CALLBACK') > -1) {
              takerTradeInfo = extractInfoFromCrossChainTxTakerOutputScript(txOutputScript)

              takerTradeInfo['collateralizedNrg'] = internalToHuman(txOutput.getValue(), NRG)
              takerTradeInfo['txHash'] = tx.getHash()
              takerTradeInfo['blockHash'] = block.getHash()
              takerTradeInfo['blockHeight'] = block.getHeight()
            } else if (txOutputScript.startsWith('OP_MONOID') || txOutputScript.endsWith('OP_CALLBACK')) {
              hashToTxMap[tx.getHash()] = { blockHeight: block.getHeight(), blockHash: block.getHash() }
            }
          }

          if (!takerTradeInfo) { // not a taker tx
            continue
          }

          let makerTradeInfo = null
          const txInputs = tx.getInputsList()
          for (let txInput of txInputs) {
            const outPoint = txInput.getOutPoint()
            const outPointTxHash = outPoint.getHash()
            const outputIndex = outPoint.getIndex()
            // check matching taker info
            if (outPointTxHash !== takerTradeInfo.makerTxHash || outputIndex !== takerTradeInfo.makerTxOutputIndex) {
              continue
            }

            const referencedTx = await this.persistence.getTransactionByHash(outPointTxHash, 'bc')
            const referencedTxOutput = referencedTx.getOutputsList()[outputIndex]
            if (!referencedTxOutput) {
              throw new Error(`Invalid output for txHash: ${referencedTx}, outputIndex: ${outputIndex}`)
            }

            let outputLockScript = Buffer.from(referencedTxOutput.getOutputScript()).toString('ascii')
            let originalMakerInfo = { hash: outPointTxHash, output: referencedTxOutput }
            while (outputLockScript.endsWith('OP_CALLBACK')) {
              const [parentTxHash, parentOutputIndex] = outputLockScript.split(' ')
              const _makerTx = await this.persistence.getTransactionByHash(parentTxHash, 'bc')
              const _makerTxOutput = _makerTx.getOutputsList()[parentOutputIndex]
              originalMakerInfo.hash = _makerTx.getHash()
              originalMakerInfo.output = _makerTxOutput

              outputLockScript = Buffer.from(_makerTxOutput.getOutputScript()).toString('ascii')
            }
            if (outputLockScript.indexOf('OP_MAKERCOLL') === -1) {
              continue
            }

            const originalBlockHeightHasMaker = hashToTxMap[originalMakerInfo.hash].blockHeight
            makerTradeInfo = extractInfoFromCrossChainTxMakerOutputScript(outputLockScript)

            const isBeforeSettleHeight = (latestBlockHeight < originalBlockHeightHasMaker + makerTradeInfo['shiftStartsAt'] + makerTradeInfo['settleEndsAt'])
            if (!isBeforeSettleHeight) { // out of settlement window
              makerTradeInfo = null
              continue
            }
            if (originalMakerInfo.hash !== outPointTxHash) {
              // update wantsUnit and paysUnit
              const remainingRatio = parseFloat(internalToHuman(referencedTxOutput.getValue(), NRG)) / parseFloat(internalToHuman(originalMakerInfo.output.getValue(), NRG))
              makerTradeInfo['wantsUnit'] = (parseFloat(makerTradeInfo['wantsUnit']) * remainingRatio).toString()
              makerTradeInfo['paysUnit'] = (parseFloat(makerTradeInfo['paysUnit']) * remainingRatio).toString()
            }

            makerTradeInfo['collateralizedNrg'] = internalToHuman(referencedTxOutput.getValue(), NRG)
            makerTradeInfo['nrgUnit'] = internalToHuman(referencedTxOutput.getUnit(), NRG)
            makerTradeInfo['txHash'] = outPointTxHash
            makerTradeInfo['txOutputIndex'] = outputIndex

            makerTradeInfo['blockHash'] = hashToTxMap[referencedTx.getHash()].blockHash
            makerTradeInfo['blockHeight'] = hashToTxMap[referencedTx.getHash()].blockHeight

            makerTradeInfo['blockHeightHasOriginalMakerTx'] = originalBlockHeightHasMaker

            const inputScript = Buffer.from(txInput.getInputScript()).toString('ascii')
            const takerInputInfo = extractInfoFromCrossChainTxTakerInputScript(inputScript)
            takerTradeInfo['wantsAddress'] = takerInputInfo.takerWantsAddress
            takerTradeInfo['sendsAddress'] = takerInputInfo.takerSendsAddress

            const makerSettlesInfo = await this.unsettledTxManager.getTxSettleInfo(makerTradeInfo.txHash, makerTradeInfo.txOutputIndex)
            const takerSettlesInfo = await this.unsettledTxManager.getTxSettleInfo(takerTradeInfo.txHash, takerTradeInfo.txOutputIndex)
            if (makerSettlesInfo && takerSettlesInfo) {
              continue
            }
            makerTradeInfo['isSettled'] = !!makerSettlesInfo
            takerTradeInfo['isSettled'] = !!takerSettlesInfo

            break // only one input points to a maker output script
          }
          if (!makerTradeInfo) {
            continue
          }

          // update

          const order = {
            maker: makerTradeInfo,
            taker: takerTradeInfo
          }

          // validate

          matchedNotSettledOrders.push(order)
        }
      } catch (e) {
        this._logger.error(e)
      }
    }

    this._logger.info(`getMatchedOpenOrders from BC height: ${currentBlockIndex}, to BC height: ${latestBlockHeight}, orders: ${matchedNotSettledOrders.length}`)
    return matchedNotSettledOrders
  }
}
