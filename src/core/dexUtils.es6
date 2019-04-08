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
import type { TransactionOutpoint } from '../protos/core_pb'

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

const { default: PersistenceRocksDb } = require('../persistence/rocksdb')
const { Transaction, TransactionOutput, TransactionInput, OutPoint } = require('../protos/core_pb')

const { blake2bl } = require('../utils/crypto')
const { getLogger } = require('../logger')
const { humanToBN, internalToBN, internalToHuman, COIN_FRACS: { NRG, BOSON } } = require('../core/coin')

const {
  txHash, txInputSignature, ScriptTemplates,
  extractInfoFromCrossChainTxMakerOutputScript,
  extractInfoFromCrossChainTxTakerOutputScript,
  extractInfoFromCrossChainTxTakerInputScript
} = require('../core/txUtils')
const TxPendingPool = require('../bc/txPendingPool')
const { Wallet } = require('../bc/wallet')

const { UnsettledTxManager } = require('../bc/unsettledTxManager')

const LOOK_BACK_BC_HEIGHT_FOR_OPEN_ORDER = 7 * 24 * 3600 / 5

export class DexUtils {
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

  async compileTx (txTemplateOutputs:[], otherInputs:[], totalAmount:BN, BCAddress:string, BCPrivateKeyHex:string, minerKey:string): Promise<Transaction> {
    // set up tx
    const txTemplate = new Transaction()
    txTemplate.setNonce('0')

    // get spend nrg inputs and leftover output
    const {spentOutPoints, leftChangeOutput} = await this.getInputsAndLeftover(
      BCAddress, txTemplate.getOverline(), totalAmount
    )
    if (leftChangeOutput) txTemplateOutputs.push(leftChangeOutput)

    // set outputs
    txTemplate.setOutputsList(txTemplateOutputs)
    txTemplate.setNoutCount(txTemplateOutputs.length)

    // sign inputs and add to existing inputs
    const {txTemplateInputs} = await this.signInputs(BCAddress, BCPrivateKeyHex, txTemplate, spentOutPoints)
    const inputs = txTemplateInputs.concat(otherInputs)

    // finalize tx
    const latestBlock = await this.persistence.get('bc.block.latest')

    txTemplate.setInputsList(inputs)
    txTemplate.setNinCount(txTemplateInputs.length)
    txTemplate.setVersion(1)
    txTemplate.setNonce(`${Math.abs(Random.engines.nativeMath())}${minerKey}`)
    txTemplate.setLockTime(latestBlock.getHeight() + 1)
    txTemplate.setHash(txHash(txTemplate))

    return txTemplate
  }

  // helper for getting the inputs and output with respect to the makers original order
  async getMakerInputsAndOutpointForTaker (
    takerWantsAddress: string, takerSendsAddress: string,
    makerTxHash: string, makerTxOutputIndex: number,
    takerBCAddress: string, collateralizedNrg: string
  ):Promise<{outputs:[TransactionOutput], input:TransactionInput}> {
    // get relevant maker data for placing taker order
    let {
      monoidMakerTxHash, monoidMakerTxOutputIndex,
      makerTxInfo, makerTxUnitBN, makerTxCollateralizedBN,
      blockWindow
    } = await this.getMakerData(makerTxHash, makerTxOutputIndex, collateralizedNrg)

    const collateralizedBN = humanToBN(collateralizedNrg, NRG)

    // add taker<->maker script as output
    const outputLockScript = ScriptTemplates.createCrossChainTxTakerOutputScript(monoidMakerTxHash, monoidMakerTxOutputIndex, takerBCAddress)
    const newOutputToTakerTx = await this.createTransactionOutput(outputLockScript, makerTxUnitBN, collateralizedBN.add(collateralizedBN))

    // add leftover taker<->maker script as output
    let newOutputToTakerTxCb = null
    const makerTxCollateralizedBNChange = makerTxCollateralizedBN.sub(collateralizedBN)
    if (makerTxCollateralizedBNChange.gt(new BN(0))) {
      const outputLockScriptCb = ScriptTemplates.createCrossChainTxTakerOutputCallbackScript(monoidMakerTxHash, monoidMakerTxOutputIndex)
      newOutputToTakerTxCb = await this.createTransactionOutput(outputLockScriptCb, makerTxUnitBN, makerTxCollateralizedBNChange)
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

    const outputs = [newOutputToTakerTx]
    if (newOutputToTakerTxCb) outputs.push(newOutputToTakerTxCb)

    return {outputs, input: takerMatchesMakerInput}
  }

  async getInputsAndLeftover (
    BCAddress: string, overline:string,
    totalAmount: BN
  ):Promise<{spentOutPoints: [], leftChangeOutput: TransactionOutput|null}> {
    const confirmedUnspentOutPoints = await this.getUnspentOutpointsWithEnoughBalance(BCAddress, totalAmount)

    let leftChangeOutput = null
    let amountAdded = new BN(0)
    const spentOutPoints = []

    // sort descending to use largest unspent outpoints first - minimize chain bloat.
    confirmedUnspentOutPoints.sort((a, b) => {
      return internalToBN(b.getValue(), BOSON).gt(internalToBN(a.getValue(), BOSON)) ? 1 : -1
    })

    for (let outPoint of confirmedUnspentOutPoints) {
      spentOutPoints.push(outPoint)

      const unspentChunkValue = internalToBN(outPoint.getValue(), BOSON)
      amountAdded = amountAdded.add(unspentChunkValue)

      if (amountAdded.gt(totalAmount) === true && overline === '') {
        const changeBN = amountAdded.sub(totalAmount)
        const outputLockScript = ScriptTemplates.createNRGOutputLockScript(BCAddress)
        leftChangeOutput = await this.createTransactionOutput(outputLockScript, new BN(1), changeBN)
        break
      }
    }
    return {spentOutPoints, leftChangeOutput}
  }

  async signInputs (
    BCAddress: string, BCPrivateKeyHex: string,
    txTemplate: Transaction, spentOutPoints: []
  ):Promise<{txTemplateInputs: TransactionInput[]}> {
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

  async createTransactionOutput (outputLockScript: string, unit:BN, value:BN): Promise<TransactionOutput> {
    const leftChangeOutput = new TransactionOutput()
    leftChangeOutput.setValue(new Uint8Array(value.toBuffer()))
    leftChangeOutput.setUnit(new Uint8Array(unit.toBuffer()))
    leftChangeOutput.setScriptLength(outputLockScript.length)
    leftChangeOutput.setOutputScript(new Uint8Array(Buffer.from(outputLockScript, 'ascii')))

    return leftChangeOutput
  }

  async getUnspentOutpointsWithEnoughBalance (BCAddress:string, totalAmount:BN):Promise<TransactionOutpoint[]> {
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

  async isClaimedCheck (makerTxHash: string, makerTxOutputIndex: number): Promise<TransactionOutpoint> {
    const claimedKey = TxPendingPool.getOutpointClaimKey(makerTxHash, makerTxOutputIndex, 'bc')
    const isClaimed = await this.persistence.get(claimedKey)
    if (isClaimed) {
      this._logger.info(`${makerTxHash}-${makerTxOutputIndex} is already settled`)
      throw new Error(`${makerTxHash}-${makerTxOutputIndex} is already settled`)
    }
  }

  async makerParamsCheck (deposit: string, settle: string, makerWantsUnit: string, makerPaysUnit: string, collateralizedNrg:string, nrgUnit:string) {
    const collateralizedBN = humanToBN(collateralizedNrg, NRG)
    const unitBN = humanToBN(nrgUnit, NRG)

    // check collateralizedBN is a multiply of unitBN
    if (!(collateralizedBN.div(unitBN).mul(unitBN).eq(collateralizedBN))) {
      throw new Error(`Invalid nrgUnit - collateralizedNrg: ${collateralizedNrg} is not disivible by nrgUnit: ${nrgUnit}`)
    }

    if (parseInt(deposit) >= parseInt(settle)) {
      throw new Error(`Deposit (${deposit}) should happend before settle (${settle})`)
    }
    if (parseFloat(makerPaysUnit) < 0) {
      throw new Error(`Maker Pays Unit (${makerPaysUnit}) is less than 0`)
    }
    if (parseFloat(makerWantsUnit) < 0) {
      throw new Error(`Maker Wants Unit (${makerWantsUnit}) is less than 0`)
    }
  }

  async getMakerTransactionAndOutput (txHash: string, index: number):Promise<{makerTx:Transaction, makerTxOutput:TransactionOutput}> {
    const makerTx = await this.persistence.getTransactionByHash(txHash, 'bc')
    if (!makerTx) {
      throw new Error(`No maker Tx associate with ${txHash}`)
    }
    const makerTxOutput = makerTx.getOutputsList()[index]
    if (!makerTxOutput) {
      throw new Error(`No maker Tx output associate with hash: ${txHash}, outputIndex: ${index}`)
    }
    return {makerTx, makerTxOutput}
  }

  async getMakerData (makerTxHash: string, makerTxOutputIndex: number, collateralizedNrg:string):Promise<{
    monoidMakerTxHash:string, monoidMakerTxOutputIndex:number,
    makerTxInfo: Object, makerTxUnitBN:BN, makerTxCollateralizedBN:BN
  }> {
    const makerTxData = await this.getMakerTransactionAndOutput(makerTxHash, makerTxOutputIndex)
    const { makerTx, makerTxOutput } = makerTxData

    await this.isClaimedCheck(makerTxHash, makerTxOutputIndex)

    let makerTxOutputScript = Buffer.from(makerTxOutput.getOutputScript()).toString('ascii')
    let monoidMakerTxHash = makerTx.getHash()
    let monoidMakerTxOutputIndex = makerTxOutputIndex

    if (makerTxOutputScript.indexOf('OP_CALLBACK') > -1) {
      // partial order
      while (makerTxOutputScript.indexOf('OP_CALLBACK') > -1) {
        const [parentTxHash, parentOutputIndex] = makerTxOutputScript.split(' ')
        const _makerTxData = await this.getMakerTransactionAndOutput(parentTxHash, parseInt(parentOutputIndex, 10))
        const { makerTx: _makerTx, makerTxOutput: _makerTxOutput } = _makerTxData

        monoidMakerTxHash = _makerTx.getHash()
        monoidMakerTxOutputIndex = parentOutputIndex
        makerTxOutputScript = Buffer.from(_makerTxOutput.getOutputScript()).toString('ascii')
      }
    }

    if (makerTxOutputScript.indexOf('OP_MAKERCOLL') === -1) {
      throw new Error(`hash: ${makerTxHash}, outputIndex: ${makerTxOutputIndex} not a valid maker tx`)
    }

    const collateralizedBN = humanToBN(collateralizedNrg, NRG)
    const makerTxUnitBN = internalToBN(makerTxOutput.getUnit(), BOSON)

    // check collateralizedBN is a multiply of maker unit
    if (!(collateralizedBN.div(makerTxUnitBN).mul(makerTxUnitBN).eq(collateralizedBN))) {
      throw new Error('Invalid amount of collateralizedNrg')
    }

    // check that the takers collateral is not bigger than the makers
    const makerTxCollateralizedBN = new BN(makerTxOutput.getValue())
    if (collateralizedBN.gt(makerTxCollateralizedBN)) {
      throw new Error(`taker collateralizedNrg: ${collateralizedNrg} is greater than the amount of maker: ${makerTxCollateralizedBN.toString(10)}`)
    }

    // check if the tx is within the appropriate window
    const latestBlockHeight = (await this.persistence.get('bc.block.latest')).getHeight()
    const makerTxInfo = extractInfoFromCrossChainTxMakerOutputScript(makerTxOutputScript)
    let txBlockHashKey = await this.persistence.get(`bc.txblock.${monoidMakerTxHash}`)
    let txBlockHeight = (await this.persistence.get(txBlockHashKey)).getHeight()
    if (txBlockHeight + makerTxInfo.shiftStartsAt > latestBlockHeight || txBlockHeight + makerTxInfo.depositEndsAt < latestBlockHeight) {
      throw new Error(`Maker Tx is not in deposit window, ${makerTxHash}`)
    }

    const settledAtBCHeight = (new BN(txBlockHeight)).add(new BN(makerTxInfo.shiftStartsAt + makerTxInfo.settleEndsAt))
    const blockWindow = settledAtBCHeight.sub(new BN(latestBlockHeight))

    return {
      monoidMakerTxHash,
      monoidMakerTxOutputIndex,
      makerTxInfo,
      makerTxUnitBN,
      makerTxCollateralizedBN,
      blockWindow
    }
  }
}
