/*
 * Copyright (c) 2017-present, Block Collider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type { BcBlock } from '../protos/core_pb'

const PersistenceRocksDb = require('../persistence').RocksDb
const { blake2bl } = require('../utils/crypto')
const { values } = require('ramda')
const {
  extractInfoFromCrossChainTxMakerOutputScript,
  extractInfoFromCrossChainTxTakerInputScript,
  extractInfoFromCrossChainTxTakerOutputScript
} = require('../core/txUtils')
const { internalToHuman, COIN_FRACS: { NRG } } = require('../core/coin')

class UnsettledTxManager {
  _persistence: PersistenceRocksDb

  static maker = 'maker'
  static taker = 'taker'

  constructor (persistence: PersistenceRocksDb) {
    this._persistence = persistence
  }

  static watchKey (bridgedChain: string, toAddr: string): string {
    return `${bridgedChain}.watch.${toAddr}`
  }

  static generateSettleInfoKey (side: 'maker'|'taker', chainId: string, address: string): string {
    return `${side}.wants.${chainId}.${address}`
  }

  static getSettledTxKeyByTxHashAndOutputIdx (txHash: string, outputIndex: string|number): string {
    return `settle.tx.${txHash}.${outputIndex}`
  }

  /*
    key: ${side}.wants.${chainId}.${address}
    var makerToWatch = {
      settleEndsAt: 1221111,
      monoidCollateralizedNrg: "12",
      takers: [
        {
          settled: false,
          // makerTx: { hash: 'i am maker tx hash', outputIndex: 0}, // to settle this trade
          tx: { hash: 'i am taker bc tx hash', outputIndex: 0, collateralizedNrg: 60 }, // this indicates taker settles the trade
          sendsAddress: 'xxx' // taker promises to sends
          paysUnit: ''
        }
      ]
    }

    var takerToWatch = {
      settleEndsAt: 12111,
      makers: [
        {
          settled: false,
          tx: {'xx', outputIndex: 0} // maker tx info
          takerTx: {hash: 'xx', outputIndex: 1, collateralizedNrg: 60} //
        }
      ]
    }
  */
  async setMakerTxSettleEndsAtHeight (makerWantsChainId: string, makerWantsAddress: string, settleEndsAt: number, collateralizedNrg: string) {
    const key = UnsettledTxManager.generateSettleInfoKey(UnsettledTxManager.maker, makerWantsChainId, makerWantsAddress)
    this._persistence.put(key, JSON.stringify({ settleEndsAt: settleEndsAt, monoidCollateralizedNrg: collateralizedNrg }))
  }

  // called when a block that has maker tx is added to the bc chain
  async watchCrossChainTx (newBcBlock: BcBlock) {
    const txs = newBcBlock.getTxsList()
    for (let i = 0; i < txs.length; i++) {
      const tx = txs[i]
      const outputs = tx.getOutputsList()
      for (let outIdx = 0; outIdx < outputs.length; outIdx++) {
        const output = outputs[outIdx]
        const outputScript = Buffer.from(output.getOutputScript()).toString('ascii')
        const collateralizedNrg = internalToHuman(output.getValue(), NRG)
        // only set the settle ends at for the OP_MONIOD
        if (outputScript.indexOf('OP_MONOID') > -1) {
          const makerInfo = extractInfoFromCrossChainTxMakerOutputScript(outputScript)
          await this.setMakerTxSettleEndsAtHeight(
            makerInfo.wantsChainId, makerInfo.wantsAddress, newBcBlock.getHeight() + makerInfo.shiftStartsAt + makerInfo.settleEndsAt,
            collateralizedNrg
          )
        } else if (outputScript.indexOf('OP_CALLBACK') > -1 && outputScript.indexOf('OP_MONAD') > -1) {
          // taker
          const takerInfoFromOutputScript = extractInfoFromCrossChainTxTakerOutputScript(outputScript)
          const makerTxHash = takerInfoFromOutputScript.makerTxHash
          const makerTxOutputIndex = takerInfoFromOutputScript.makerTxOutputIndex
          const makerTx = await this._persistence.getTransactionByHash(makerTxHash, 'bc')
          const makerTxOutput = makerTx.getOutputsList()[makerTxOutputIndex]

          const txInputs = tx.getInputsList()
          let txInputForTaker = null
          for (let txInput of txInputs) {
            const outPoint = txInput.getOutPoint()
            if (outPoint.getHash() === makerTxHash && outPoint.getIndex() === makerTxOutputIndex) {
              txInputForTaker = txInput
              break
            }
          }

          if (!txInputForTaker) {
            throw new Error(`Invalid tx, no taker input for the output`)
          }
          const takerInputScript = Buffer.from(txInputForTaker.getInputScript(), 'ascii').toString('ascii')
          const takerInputInfo = extractInfoFromCrossChainTxTakerInputScript(takerInputScript)

          let monoidMakerOutputLockScript = Buffer.from(makerTxOutput.getOutputScript()).toString('ascii')
          const monoidCollateralizedNrg = internalToHuman(makerTxOutput.getValue(), NRG)
          let monoidHash = makerTxHash
          let monoidTxOutputIndex = makerTxOutputIndex
          while (monoidMakerOutputLockScript.endsWith('OP_CALLBACK')) {
            const [parentTxHash, parentOutputIndex] = monoidMakerOutputLockScript.split(' ')
            const _makerTx = await this._persistence.getTransactionByHash(parentTxHash, 'bc')
            const _makerTxOutput = _makerTx.getOutputsList()[parentOutputIndex]

            monoidMakerOutputLockScript = Buffer.from(_makerTxOutput.getOutputScript()).toString('ascii')
            monoidHash = parentTxHash
            monoidTxOutputIndex = parentOutputIndex
          }
          const monoidMakerInfo = extractInfoFromCrossChainTxMakerOutputScript(monoidMakerOutputLockScript)

          const makerWatchInfo = {
            tx: {
              hash: makerTxHash,
              outputIndex: makerTxOutputIndex,
              monoidCollateralizedNrg: monoidCollateralizedNrg,
              monoidHash: monoidHash,
              monoidTxOutputIndex: monoidTxOutputIndex
            },
            wantsAddress: monoidMakerInfo.wantsAddress,
            wantsChainId: monoidMakerInfo.wantsChainId
          }
          const takerWatchInfo = {
            tx: { hash: tx.getHash(), outputIndex: outIdx, collateralizedNrg: collateralizedNrg },
            wantsAddress: takerInputInfo.takerWantsAddress,
            sendsAddress: takerInputInfo.takerSendsAddress,
            wantsChainId: monoidMakerInfo.paysChainId
          }
          await this.watchSettleMarkedTxs(makerWatchInfo, takerWatchInfo)
        }
      }
    }
  }

  async watchSettleMarkedTxs (
    makerTxInfo: {tx: {hash: string, outputIndex: number, monoidCollateralizedNrg: string, monoidHash: string, monoidTxOutputIndex: number}, wantsAddress: string, wantsChainId: string},
    takerTxInfo: {tx: {hash: string, outputIndex: number, collateralizedNrg: string}, wantsAddress: string, sendsAddress: string, wantsChainId: string}
  ) {
    const makerKey = UnsettledTxManager.generateSettleInfoKey(UnsettledTxManager.maker, makerTxInfo.wantsChainId, makerTxInfo.wantsAddress)
    let makerToWatchInfo = await this._persistence.get(makerKey)
    if (!makerToWatchInfo) {
      throw Error(`${makerKey} not found`)
    }
    makerToWatchInfo = JSON.parse(makerToWatchInfo)
    let found = false
    if (makerToWatchInfo.takers) {
      for (let taker of makerToWatchInfo.takers) {
        if (taker.tx.hash === takerTxInfo.tx.hash) {
          if (taker.tx.outputIndex !== takerTxInfo.tx.outputIndex || taker.tx.collateralizedNrg !== takerTxInfo.tx.collateralizedNrg) {
            throw Error(`Inconsistent state`) // TODO: more info
          }
          found = true
          break
        }
      }
    } else {
      makerToWatchInfo.takers = []
    }
    if (!found) {
      makerToWatchInfo.takers.push({
        settled: false,
        tx: takerTxInfo.tx,
        sendsAddress: takerTxInfo.sendsAddress
      })
    }
    await this._persistence.put(makerKey, JSON.stringify(makerToWatchInfo))

    const takerKey = UnsettledTxManager.generateSettleInfoKey(UnsettledTxManager.taker, takerTxInfo.wantsChainId, takerTxInfo.wantsAddress)
    const takerToWatchInfo = {
      settleEndsAt: makerToWatchInfo.settleEndsAt,
      makers: [{
        settled: false,
        takerTx: takerTxInfo.tx,
        tx: makerTxInfo.tx
      }]
    }
    await this._persistence.put(takerKey, JSON.stringify(takerToWatchInfo))
  }

  /*
   * setMarkedWatch adds addresses by callback hash to be watched
   * callback hash is required in the event the from two address is used in multiple trades
   * @param callbackHash {string}
   * @param callbackIndex {number}
   * @param bridgedChain {string}
   * @param bcSettleWindow {number}
   * @param toAddr {string}
   * @param bindFromAddr {string}
   */
  async setMarkedWatch (callbackHash: string, callbackIndex: number,
    bridgedChain: string, bcSettleWindow: number,
    toAddr: string, bindFromAddr: string = '0' // toMakerAddress, fromTakerAddress
  ) {
    const key = UnsettledTxManager.watchKey(bridgedChain, toAddr)
    const watchlist = await this._persistence.get(key)
    const bind = bindFromAddr === '0' ? false : bindFromAddr
    if (bindFromAddr === undefined || toAddr === bindFromAddr) {
      return Promise.resolve(false)
    }
    // basic protection against binding marked addresses from different chains
    if (bindFromAddr !== '0' && toAddr.length !== bindFromAddr.length) {
      return Promise.resolve(false)
    }
    const update = {
      callbackHash: callbackHash,
      callbackIndex: callbackIndex,
      bridgedChain: bridgedChain,
      bcSettleWindow: bcSettleWindow,
      toAddr: toAddr,
      bindFromAddress: bind
    }
    if (watchlist) {
      const updateValues = blake2bl(values(update).join(''))
      const map = watchlist.map((w) => {
        return blake2bl(values(w).join(''))
      })
      if (map.indexOf(updateValues) > -1) {
        return Promise.resolve(false)
      }
      watchlist.push(update)
      await this._persistence.scheduleAtBlockHeight(bcSettleWindow, 'delfromlist', key, update)
      await this._persistence.put(key, watchlist)
    } else {
      await this._persistence.scheduleAtBlockHeight(bcSettleWindow, 'delfromlist', key, update)
      await this._persistence.put(key, [update])
    }
    return Promise.resolve(true)
  }

  async isMarkedWatch (bridgedChain: string, toAddr: string, bindFromAddr: string = '0', currentBlockHeight: number) {
    const key = UnsettledTxManager.watchKey(bridgedChain, toAddr)
    const watchlist = await this._persistence.get(key)
    if (!watchlist) {
      return Promise.resolve(false)
      // check each and see if there is a match
    } else {
      const toRemove = []
      const matches = watchlist.reduce((all, watch) => {
        if (watch.toAddr === toAddr && watch.bridgedChain === bridgedChain) {
          if (bindFromAddr !== watch.bindFromAddr) {
            if (bindFromAddr === '0' && watch.bcSettleWindow <= currentBlockHeight) {
              // its clear
              all.push(watch)
            }
          } else if (bindFromAddr === watch.bindFromAddr && watch.bcSettleWindow <= currentBlockHeight) {
            all.push(watch)
          } else if (bindFromAddr === watch.bindFromAddr && watch.bcSettleWindow > currentBlockHeight) {
            toRemove.push(blake2bl(values(watch).join('')))
          }
        }
        return all
      }, [])

      if (toRemove.length > 0) {
        const newWatchlist = watchlist.reduce((all, w) => {
          const wk = blake2bl(values(w).join(''))
          if (toRemove.indexOf(wk) < 0) {
            all.push(w)
          }
          return all
        }, [])

        // save the remaining subset if exists
        if (newWatchlist.length > 0) {
          await this._persistence.put(key, newWatchlist)
        } else {
        // remove the key
          await this._persistence.del(key)
        }
      }
      // if there are any matches the address is watched
      if (matches.length === 0) {
        return Promise.resolve(false)
      } else {
        return Promise.resolve(true)
      }
    }
  }

  async markTxAsSettledViaNewBlock (newBlock: BcBlock) {
    const headersMap = newBlock.getBlockchainHeaders()
    const bridgedChains = Object.keys(headersMap.toObject())

    for (let listName of bridgedChains) {
      const getMethodName = `get${listName[0].toUpperCase()}${listName.slice(1)}`
      const chainHeaders = headersMap[getMethodName]()
      for (let chainHeader of chainHeaders) {
        const markedTxs = chainHeader.getMarkedTxsList()
        for (let markedTx of markedTxs) {
          const markedTokenType = markedTx.getToken()
          if (markedTokenType === listName) {
            const addrFrom = markedTx.getAddrFrom()
            const addrTo = markedTx.getAddrTo()
            await this.markTxAsSettled(addrFrom, addrTo, listName)
          }
        }
      }
    }
  }

  async markTxAsSettled (addrFrom: string, addrTo: string, bridgedChain: string) {
    const makerKey = UnsettledTxManager.generateSettleInfoKey(UnsettledTxManager.maker, bridgedChain, addrTo)
    let makerToWatchInfo = await this._persistence.get(makerKey)
    if (makerToWatchInfo) { // to settle a maker tx
      makerToWatchInfo = JSON.stringify(makerToWatchInfo)
      for (var i = 0; i < makerToWatchInfo.takers.length; i++) {
        const taker = makerToWatchInfo.takers[i]
        if (taker.sendsAddress === addrFrom) {
          taker.settled = true
          await this._persistence.put(makerKey, JSON.stringify(makerToWatchInfo))
          // taker settles the trade, mark getSettledTxKeyByTxHashAndOutputIdx as true, so that taker can spend its collateralized nrg
          await this._persistence.put(UnsettledTxManager.getSettledTxKeyByTxHashAndOutputIdx(taker.tx.hash, taker.tx.outputIndex), true)
          return
        }
      }
    } else {
      const takerKey = UnsettledTxManager.generateSettleInfoKey(UnsettledTxManager.taker, bridgedChain, addrTo)
      let takerToWatchInfo = await this._persistence.get(takerKey)
      if (takerToWatchInfo) {
        takerToWatchInfo = JSON.parse(takerToWatchInfo)
        takerToWatchInfo.makers[0].settled = true
        await this._persistence.put(takerKey, JSON.stringify(takerToWatchInfo))
        // maker settles the trade, mark getSettledTxKeyByTxHashAndOutputIdx as true, so that maker can spend its collateralized nrg
        await this._persistence.put(
          UnsettledTxManager.getSettledTxKeyByTxHashAndOutputIdx(takerToWatchInfo.makers[0].tx.hash, takerToWatchInfo.makers[0].tx.outputIndex),
          true
        )
      }
    }
  }

  async getTxSettleInfo (txHash: string, txOutputIndex: string|number) {
    // this means taker fullfills its part
    const key = UnsettledTxManager.getSettledTxKeyByTxHashAndOutputIdx(txHash, txOutputIndex)
    const res = await this._persistence.get(key)
    return res
  }

  async isBeforeSettleHeight (addrFrom: string, addrTo: string, bridgedChain: string, currentBcHeight: number|null): Promise<boolean> {
    if (!currentBcHeight) {
      let latest = await this._persistence.get('bc.block.latest')
      if (!latest) {
        return false
      }
      currentBcHeight = parseInt(latest.getHeight())
    }

    const makerKey = UnsettledTxManager.generateSettleInfoKey(UnsettledTxManager.maker, bridgedChain, addrTo)
    let res = await this._persistence.get(makerKey)
    if (!res) {
      const takerKey = UnsettledTxManager.generateSettleInfoKey(UnsettledTxManager.taker, bridgedChain, addrTo)
      res = await this._persistence.get(takerKey)
    }

    if (res) {
      res = JSON.parse(res)
      return currentBcHeight <= res.settleEndsAt
    } else {
      return false
    }
  }
}

module.exports = {
  UnsettledTxManager: UnsettledTxManager
}
