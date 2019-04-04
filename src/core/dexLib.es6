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

export class DexLib {
  persistence: PersistenceRocksDb
  _logger: Logger
  unsettledTxManager: UnsettledTxManager
  wallet: Wallet

  constructor (persistence: PersistenceRocksDb) {
    this.persistence = persistence
    this._logger = getLogger(__filename)
    this.unsettledTxManager = new UnsettledTxManager(this.persistence)
    this.wallet = new Wallet(persistence, this.unsettledTxManager)
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

    let txFeeBN = await this.calculateMakerFee(shift, deposit, settle,payWithChainId, wantChainId, makerWantsUnit, makerPaysUnit,collateralizedNrg, nrgUnit)
    txFeeBN = txFeeBN.add(humanToBN(additionalTxFee, NRG));
    this._logger.info(`Tx Fee: ${internalToHuman(txFeeBN, NRG)} NRG`)

    const collateralizedBN = humanToBN(collateralizedNrg, NRG)
    const unitBN = humanToBN(nrgUnit, NRG)

    const confirmedUnspentOutPoints = await this.getUnspentOutpointsWithEnoughBalance(makerBCAddress,collateralizedBN.add(txFeeBN))

    const txTemplate = new Transaction()
    txTemplate.setNonce('0')

    const outputLockScript = ScriptTemplates.createCrossChainTxMakerOutputScript(
      shift, deposit, settle,
      payWithChainId, wantChainId, receiveAddress, makerWantsUnit, makerPaysUnit,
      makerBCAddress
    )
    const newOutputToReceiver = await this.createTransactionOutput(outputLockScript,unitBN,collateralizedBN)
    const txTemplateOutputs = [newOutputToReceiver]

    const {spentOutPoints,leftChangeOutput} = await this.getInputsAndLeftover(
      makerBCAddress,txTemplate.getOverline(),
      confirmedUnspentOutPoints,collateralizedBN.add(txFeeBN)
    )

    if (leftChangeOutput) txTemplateOutputs.push(leftChangeOutput)

    txTemplate.setOutputsList(txTemplateOutputs)
    txTemplate.setNoutCount(txTemplateOutputs.length)

    const {txTemplateInputs} = await this.signInputs(makerBCAddress,makerBCPrivateKeyHex,txTemplate,spentOutPoints)

    return await this.sendTx(txTemplate,txTemplateInputs,minerKey)
  }

  async calculateMakerFee(
    shift: string, deposit: string, settle: string,
    payWithChainId: string, wantChainId: string, makerWantsUnit: string, makerPaysUnit: string,
    collateralizedNrg: string, nrgUnit: string
  ): Promise<BN> {
    this._logger.info(`calculateMakerFee`)
    if (parseInt(deposit) >= parseInt(settle)) {
      throw new Error(`Deposit (${deposit}) should happend before settle (${settle})`)
    }
    if (parseFloat(makerPaysUnit) < 0) {
      throw new Error(`Maker Pays Unit (${makerPaysUnit}) is less than 0`)
    }
    if (parseFloat(makerWantsUnit) < 0) {
      throw new Error(`Maker Wants Unit (${makerWantsUnit}) is less than 0`)
    }
    const collateralizedBN = humanToBN(collateralizedNrg, NRG)
    const unitBN = humanToBN(nrgUnit, NRG)

    // check collateralizedBN is a multiply of unitBN
    if (!(collateralizedBN.div(unitBN).mul(unitBN).eq(collateralizedBN))) {
      throw new Error(`Invalid nrgUnit - collateralizedNrg: ${collateralizedNrg} is not disivible by nrgUnit: ${nrgUnit}`)
    }

    const latestBlock = await this.persistence.get('bc.block.latest')
    const blockWindow = new BN(parseInt(settle, 10) - parseInt(shift, 10))

    return await this.calculateCrossChainTxFee(collateralizedBN, blockWindow, new BN(latestBlock.getHeight()), 'maker')
  }
  async placeTakerOrders (
    orders:[{takerWantsAddress: string, takerSendsAddress: string,
    makerTxHash: string, makerTxOutputIndex: number,collateralizedNrg: string}],
    takerBCAddress: string, takerBCPrivateKeyHex: string,
    additionalTxFee: string
  ): Promise<Transaction|Error> {
    this._logger.info(`placeTakerOrders`);


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

    //get relevant maker data for placing taker order
    let {
      monoidMakerTxHash,monoidMakerTxOutputIndex,
      makerTxInfo,makerTxUnitBN,makerTxCollateralizedBN,
      blockWindow
    } = await this.getMakerData(makerTxHash,makerTxOutputIndex)

    // get fee
    let txFeeBN = await this.calculateTakerFee(makerTxHash, makerTxOutputIndex,collateralizedNrg);
    txFeeBN = txFeeBN.add(humanToBN(additionalTxFee, NRG))
    this._logger.info(`Tx fee for taker: ${internalToHuman(txFeeBN, NRG)} NRG`)

    //set up tx
    const txTemplate = new Transaction()
    txTemplate.setNonce('0')

    //add taker<->maker script as output
    const {newOutputToTakerTx,newOutputToTakerTxCb,takerMatchesMakerInput} = getMakerInputsAndOutpointForTaker(
      takerWantsAddress,takerSendsAddress,
      makerTxHash, makerTxOutputIndex,
      takerBCAddress, collateralizedNrg
    )
    const txTemplateOutputs = [newOutputToTakerTx]

    if (newOutputToTakerTxCb) txTemplateOutputs.push(newOutputToTakerTxCb)

    //add taker's nrg leftover as output (and check if there is enough balance)
    const confirmedUnspentOutPoints = await this.getUnspentOutpointsWithEnoughBalance(takerBCAddress,collateralizedBN.add(txFeeBN))
    const {spentOutPoints,leftChangeOutput} = await this.getInputsAndLeftover(
      takerBCAddress,txTemplate.getOverline(),
      confirmedUnspentOutPoints,collateralizedBN.add(txFeeBN)
    )
    if (leftChangeOutput) txTemplateOutputs.push(leftChangeOutput)

    //set outputs
    txTemplate.setOutputsList(txTemplateOutputs)
    txTemplate.setNoutCount(txTemplateOutputs.length)


    //set takers NRG balance outpoints as inputs
    const {txTemplateInputs} = await this.signInputs(takerBCAddress,takerBCPrivateKeyHex,txTemplate,spentOutPoints)

    txTemplateInputs.push(takerMatchesMakerInput)

    return await this.sendTx(txTemplate,txTemplateInputs,minerKey)
  }

  //helper for getting the inputs and output with respect to the makers original order
  async getMakerInputsAndOutpointForTaker(
    takerWantsAddress: string, takerSendsAddress: string,
    makerTxHash: string, makerTxOutputIndex: number,
    takerBCAddress: string, collateralizedNrg: string,
  ):Promise<{newOutputToTakerTx:TransactionOutput,newOutputToTakerTxCb:TransactionOutput|null, takerMatchesMakerInput:TransactionInput} {

    //get relevant maker data for placing taker order
    let {
      monoidMakerTxHash,monoidMakerTxOutputIndex,
      makerTxInfo,makerTxUnitBN,makerTxCollateralizedBN,
      blockWindow
    } = await this.getMakerData(makerTxHash,makerTxOutputIndex)

    const collateralizedBN = humanToBN(collateralizedNrg, NRG)

    //add taker<->maker script as output
    const outputLockScript = ScriptTemplates.createCrossChainTxTakerOutputScript(monoidMakerTxHash, monoidMakerTxOutputIndex, takerBCAddress)
    const newOutputToTakerTx = await this.createTransactionOutput(outputLockScript,makerUnitBN,collateralizedBN.add(collateralizedBN))

    //add leftover taker<->maker script as output
    let newOutputToTakerTxCb = null;
    const makerTxCollateralizedBNChange = makerTxCollateralizedBN.sub(collateralizedBN)
    if (makerTxCollateralizedBNChange.gt(new BN(0))) {
      const outputLockScriptCb = ScriptTemplates.createCrossChainTxTakerOutputCallbackScript(monoidMakerTxHash, monoidMakerTxOutputIndex)
      newOutputToTakerTxCb = await this.createTransactionOutput(outputLockScriptCb,makerUnitBN,makerTxCollateralizedBNChange)
    }

    // maker tx's output as the input
    const makerTxOutpoint = new OutPoint()
    makerTxOutpoint.setValue(makerTxOutput.getValue())
    makerTxOutpoint.setHash(makerTxHash)
    makerTxOutpoint.setIndex(makerTxOutputIndex)

    const takerInputUnlockScript = ScriptTemplates.createCrossChainTxTakerInputScript(
      takerWantsAddress, takerSendsAddress
    )
    const takerMatchesMakerInput = new TransactionInput()
    takerMatchesMakerInput.setOutPoint(makerTxOutpoint)
    takerMatchesMakerInput.setScriptLength(takerInputUnlockScript.length)
    takerMatchesMakerInput.setInputScript(new Uint8Array(Buffer.from(takerInputUnlockScript, 'ascii')))

    return {newOutputToTakerTx,newOutputToTakerTxCb,takerMatchesMakerInput}
  }

  async calculateTakerFee(
    makerTxHash: string, makerTxOutputIndex: number,
    collateralizedNrg: string,
  ): Promise<BN> {
    this._logger.info(`calculateTakerFee`)

    let {blockWindow} = await this.getMakerData(makerTxHash,makerTxOutputIndex)

    const collateralizedBN = humanToBN(collateralizedNrg, NRG)
    const latestBlock = await this.persistence.get('bc.block.latest')
    const latestBlockHeight = latestBlock.getHeight()

    return await this.calculateCrossChainTxFee(collateralizedBN, blockWindow, new BN(latestBlockHeight), 'taker')
  }

  async getOpenOrders (): Promise<MakerOpenOrder[]|Error> {
    const openOrders = []
    const latestBlock = await this.persistence.get('bc.block.latest')
    if (!latestBlock) {
      throw new Error('Latest block not found')
    }
    const latestBlockHeight = latestBlock.getHeight()

    let currentBlockIndex = 1
    if (latestBlockHeight > 2 * Math.pow(10, 6)) {
      currentBlockIndex = Math.max(1, latestBlockHeight - LOOK_BACK_BC_HEIGHT_FOR_OPEN_ORDER)
    }
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

            let oringalMakerInfo = { hash: tx.getHash(), output: output }
            while (outputLockScript.endsWith('OP_CALLBACK')) {
              const [parentTxHash, parentOutputIndex] = outputLockScript.split(' ')
              const _makerTx = await this.persistence.getTransactionByHash(parentTxHash, 'bc')
              const _makerTxOutput = _makerTx.getOutputsList()[parentOutputIndex]
              outputLockScript = Buffer.from(_makerTxOutput.getOutputScript()).toString('ascii')

              oringalMakerInfo.hash = _makerTx.getHash()
              oringalMakerInfo.output = _makerTxOutput
            }
            const blockHasOriginalMakerTxHeight = txHashToBlockHeightMap[oringalMakerInfo.hash]

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
                if (oringalMakerInfo.hash !== tx.getHash()) {
                  // update wantsUnit and paysUnit
                  const remainingRatio = parseFloat(internalToHuman(output.getValue(), NRG)) / parseFloat(internalToHuman(oringalMakerInfo.output.getValue(), NRG))
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
            let oringalMakerInfo = { hash: outPointTxHash, output: referencedTxOutput }
            while (outputLockScript.endsWith('OP_CALLBACK')) {
              const [parentTxHash, parentOutputIndex] = outputLockScript.split(' ')
              const _makerTx = await this.persistence.getTransactionByHash(parentTxHash, 'bc')
              const _makerTxOutput = _makerTx.getOutputsList()[parentOutputIndex]
              oringalMakerInfo.hash = _makerTx.getHash()
              oringalMakerInfo.output = _makerTxOutput

              outputLockScript = Buffer.from(_makerTxOutput.getOutputScript()).toString('ascii')
            }
            if (outputLockScript.indexOf('OP_MAKERCOLL') === -1) {
              continue
            }

            const originalBlockHeightHasMaker = hashToTxMap[oringalMakerInfo.hash].blockHeight
            makerTradeInfo = extractInfoFromCrossChainTxMakerOutputScript(outputLockScript)

            const isBeforeSettleHeight = (latestBlockHeight < originalBlockHeightHasMaker + makerTradeInfo['shiftStartsAt'] + makerTradeInfo['settleEndsAt'])
            if (!isBeforeSettleHeight) { // out of settlement window
              makerTradeInfo = null
              continue
            }
            if (oringalMakerInfo.hash !== outPointTxHash) {
              // update wantsUnit and paysUnit
              const remainingRatio = parseFloat(internalToHuman(referencedTxOutput.getValue(), NRG)) / parseFloat(internalToHuman(oringalMakerInfo.output.getValue(), NRG))
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

  //HELPERS

  // F * exp((1 - P) * HBC / C)
  async calculateCrossChainTxFee (
    collateralizedBN: BN, blockWindow: BN, latestBlockHeight: BN, side: 'maker'|'taker'
  ): BN {
    if (latestBlockHeight.lt(new BN(2 * Math.pow(10, 6)))) {
      if (side === 'maker') {
        return humanToBN('0.001', NRG) // encourage maker
      } else {
        return humanToBN('0.01', NRG)
      }
    }
    if (blockWindow.gt(new BN(LOOK_BACK_BC_HEIGHT_FOR_OPEN_ORDER))) {
      throw new Error(`${blockWindow} is too large`)
    }
    if (side === 'maker') {
      return humanToBN('0.002', NRG) // encourage maker
    }
    const fee = collateralizedBN.toNumber() * 0.001 // 0.1% of the collaterized NRG

    return humanToBN(fee.toString(), NRG)
  }

  async getInputsAndLeftover(
    BCAddress: string, overline:string,
    confirmedUnspentOutPoints:[],totalAmount: BN
  ):Promise<{spentOutPoints: [],leftChangeOutput: TransactionOutput|null}> {

    let leftChangeOutput = null
    let amountAdded = new BN(0)
    const spentOutPoints = []

    //sort descending to use largest unspent outpoints first - minimize chain bloat.
    confirmedUnspentOutPoints.sort((a, b)=>{
      return internalToBN(b.getValue(), BOSON).gt(internalToBN(a.getValue(), BOSON)) ? 1 : -1
    })

    for (let outPoint of confirmedUnspentOutPoints) {
      spentOutPoints.push(outPoint)

      const unspentChunkValue = internalToBN(outPoint.getValue(), BOSON)
      amountAdded = amountAdded.add(unspentChunkValue)

      if (amountAdded.gt(totalAmount) === true && overline === '') {
        const changeBN = amountAdded.sub(totalAmount)
        const outputLockScript = ScriptTemplates.createNRGOutputLockScript(BCAddress)
        leftChangeOutput = await this.createTransactionOutput(outputLockScript,new BN(1),changeBN)
        break
      }
    }
    return {spentOutPoints,leftChangeOutput}
  }

  async signInputs(
    BCAddress: string, BCPrivateKeyHex: string,
    txTemplate: Transaction, spentOutPoints: []
  ):Promise<{txTemplateInputs: []}> {

    const txTemplateInputs = spentOutPoints.map((outPoint) => {
      // txInputSignature requires txTemplate sets the outputs first
      const signature = txInputSignature(outPoint, txTemplate, Buffer.from(BCPrivateKeyHex, 'hex'))
      const pubKey = secp256k1.publicKeyCreate(Buffer.from(BCPrivateKeyHex, 'hex'), true)
      const input = new TransactionInput()
      input.setOutPoint(outPoint)
      const inputUnlockScript = [
        signature.toString('hex'),
        pubKey.toString('hex'),
        blake2bl(BCAddress)
      ].join(' ')
      input.setScriptLength(inputUnlockScript.length)
      input.setInputScript(new Uint8Array(Buffer.from(inputUnlockScript, 'ascii')))
      return input
    })

    return {txTemplateInputs}
  }

  async createTransactionOutput(outputLockScript: string,unit:BN,value:BN): Promise<TransactionOutput> {
    const leftChangeOutput = new TransactionOutput()
    leftChangeOutput.setValue(new Uint8Array(value.toBuffer()))
    leftChangeOutput.setUnit(new Uint8Array(unit.toBuffer()))
    leftChangeOutput.setScriptLength(outputLockScript.length)
    leftChangeOutput.setOutputScript(new Uint8Array(Buffer.from(outputLockScript, 'ascii')))

    return leftChangeOutput
  }

  async getUnspentOutpointsWithEnoughBalance(BCAddress:string,totalAmount:BN):Promise<[]>{
    let balanceData
    try {
      balanceData = await this.wallet.getBalanceData(BCAddress.toLowerCase())
    } catch (e) {
      const msg = `Could not find balance for given from address: ${BCAddress}`
      this._logger.warn(msg)
      throw new Error(msg)
    }
    this._logger.info(`NRG managed by address confirmed: ${internalToHuman(balanceData.confirmed, NRG)} unconfirmed: ${internalToHuman(balanceData.unconfirmed, NRG)}`)

    if (totalAmount.gt(balanceData.confirmed)) { // TODO: make sure confirmed is in humanToBN format
      this._logger.error(`${BCAddress} not enough balance, has: ${internalToHuman(balanceData.confirmed, NRG)}, total: ${internalToHuman(totalAmount, NRG)}`)
      throw new Error(`${BCAddress} not enough balance, has: ${internalToHuman(balanceData.confirmed, NRG)}, total: ${internalToHuman(totalAmount, NRG)}`)
    }

    return balanceData.confirmedUnspentOutPoints
  }

  async sendTx(txTemplate: Transaction,txTemplateInputs:[],minerKey:string): Promise<Transaction>{
    const latestBlock = await this.persistence.get('bc.block.latest')

    txTemplate.setInputsList(txTemplateInputs)
    txTemplate.setNinCount(txTemplateInputs.length)
    txTemplate.setVersion(1)
    txTemplate.setNonce(`${Math.abs(Random.engines.nativeMath())}${minerKey}`)
    txTemplate.setLockTime(latestBlock.getHeight() + 1)
    txTemplate.setHash(txHash(txTemplate))

    return txTemplate
  }

  async getMakerData(makerTxHash: string, makerTxOutputIndex: number):Promise<{
    monoidMakerTxHash:string, monoidMakerTxOutputIndex:number,
    makerTxInfo: Object, makerTxUnitBN:BN, makerTxCollateralizedBN:BN
  }>{

      const claimedKey = TxPendingPool.getOutpointClaimKey(makerTxHash, makerTxOutputIndex, 'bc')
      const isClaimed = await this.persistence.get(claimedKey)
      if (isClaimed) {
        this._logger.info(`${makerTxHash}-${makerTxOutputIndex} is already settled`)
        throw new Error(`${makerTxHash}-${makerTxOutputIndex} is already settled`)
      }

      const makerTx = await this.persistence.getTransactionByHash(makerTxHash, 'bc')
      if (!makerTx) {
        throw new Error(`No maker Tx associate with ${makerTxHash}`)
      }
      const makerTxOutput = makerTx.getOutputsList()[makerTxOutputIndex]
      if (!makerTxOutput) {
        throw new Error(`No maker Tx output associate with hash: ${makerTxHash}, outputIndex: ${makerTxOutputIndex}`)
      }

      let makerTxOutputScript = Buffer.from(makerTxOutput.getOutputScript()).toString('ascii')
      let monoidMakerTxHash = makerTx.getHash()
      let monoidMakerTxOutputIndex = makerTxOutputIndex
      if (makerTxOutputScript.indexOf('OP_CALLBACK') > -1) {
        // partial order
        while (makerTxOutputScript.indexOf('OP_CALLBACK') > -1) {
          const [parentTxHash, parentOutputIndex] = makerTxOutputScript.split(' ')
          const _makerTx = await this.persistence.getTransactionByHash(parentTxHash, 'bc')

          //QUESTION PING: why do we create _makerTxOutput instead of updating the original one
          const _makerTxOutput = _makerTx.getOutputsList()[parentOutputIndex]
          monoidMakerTxHash = _makerTx.getHash()
          monoidMakerTxOutputIndex = parentOutputIndex

          makerTxOutputScript = Buffer.from(_makerTxOutput.getOutputScript()).toString('ascii')
        }
      }

      if (makerTxOutputScript.indexOf('OP_MAKERCOLL') === -1) {
        throw new Error(`hash: ${makerTxHash}, outputIndex: ${makerTxOutputIndex} not a valid maker tx`)
      }

      const collateralizedBN = humanToBN(collateralizedNrg, NRG)
      const makerUnitBN = internalToBN(makerTxOutput.getUnit(), BOSON)
      // check collateralizedBN is a multiply of maker unit
      if (!(collateralizedBN.div(makerUnitBN).mul(makerUnitBN).eq(collateralizedBN))) {
        throw new Error('Invalid amount of collateralizedNrg')
      }
      const makerTxCollateralizedBN = new BN(makerTxOutput.getValue())
      if (collateralizedBN.gt(makerTxCollateralizedBN)) {
        throw new Error(`taker collateralizedNrg: ${collateralizedNrg} is greater than the amount of maker: ${makerTxCollateralizedBN.toString(10)}`)
      }

      // check if the window in in the deposit window
      const latestBlock = await this.persistence.get('bc.block.latest')
      const latestBlockHeight = latestBlock.getHeight()
      const makerTxInfo = extractInfoFromCrossChainTxMakerOutputScript(makerTxOutputScript)
      const upperBCHeightBound = latestBlockHeight - makerTxInfo.shiftStartsAt
      const lowerBCHeightBound = latestBlockHeight - makerTxInfo.depositEndsAt > 0 ? latestBlockHeight - makerTxInfo.depositEndsAt : 1
      let foundBlock = false

      for (let i = lowerBCHeightBound; i <= upperBCHeightBound; i++) {
        if (foundBlock) {
          break
        }
        const block = await this.persistence.get(`bc.block.${i}`)
        for (let tx of block.getTxsList()) {
          if (tx.getHash() === monoidMakerTxHash) {
            foundBlock = block
            break
          }
        }
      }
      if (!foundBlock) {
        const errorInfo = {
          txHash: makerTxHash,
          originalMakerTxHash: monoidMakerTxHash,
          originalMakerTxOutputIndex: monoidMakerTxOutputIndex,
          outputIndex: makerTxOutputIndex,
          shift: makerTxInfo.shiftStartsAt,
          depositEndsAt: makerTxInfo.depositEndsAt,
          latestBlockHeight: latestBlockHeight
        }
        throw new Error(`Maker Tx is not in deposit window, ${JSON.stringify(errorInfo)}`)
      }

      const logMsg = {
        originalMakerBlockHeight: foundBlock.getHeight(),
        latestHeight: latestBlock.getHeight(),
        shift: makerTxInfo.shiftStartsAt,
        depositEndsAt: makerTxInfo.depositEndsAt
      }
      this._logger.info(`Maker tx info is ${JSON.stringify(logMsg)}`)

      const settledAtBCHeight = (new BN(foundBlock.getHeight())).add(new BN(makerTxInfo.shiftStartsAt + makerTxInfo.settleEndsAt))
      const blockWindow = settledAtBCHeight.sub(new BN(latestBlockHeight))

      return {
        monoidMakerTxHash, monoidMakerTxOutputIndex,
        makerTxInfo, makerTxUnitBN, makerTxCollateralizedBN,
        blockWindow
      }
  }
}
