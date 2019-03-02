/**
 * Copyright (c) 2017-present, Block Collider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type { Logger } from 'winston'
import type BN from 'bn.js'

const Async = require('async')
const Heap = require('heap')
const { EventEmitter } = require('events')

const { getLogger } = require('../logger')
const txUtils = require('../core/txUtils')
const PersistenceRocksDb = require('../persistence').RocksDb
const { Transaction, OutPoint } = require('../protos/core_pb')

const EVENTS = {
  txAdd: 'tx.add',
  txRemove: 'tx.remove'
}

class TxMemPool {
  _data: Array<{ hash: string, fee: BN, tx: Transaction }>
  _txHashSet: Set<string>

  constructor () {
    this._data = []
    this._txHashSet = new Set()
  }

  add (tx: { hash: string, fee: BN, tx: Transaction }) {
    if (this._txHashSet.has(tx.hash)) {
      return
    }
    this._data.push(tx)
    this._txHashSet.add(tx.hash)
  }

  del (txHash: string) {
    const idx = this._data.findIndex(ele => ele.hash === txHash)
    if (idx !== -1) {
      this._data.splice(idx, 1)
      this._txHashSet.delete(txHash)
    }
  }

  loadBestPendingTxs (number: number, baseOnFunc: ({ fee: BN }, { fee: BN }) => number): Array<{ hash: string, fee: BN, tx: Transaction }> {
    let nlargest = []
    if (number >= this._data.length) {
      nlargest = this._data
    } else {
      nlargest = Heap.nlargest(this._data, number, baseOnFunc)
    }
    return nlargest
  }
}

class TxPendingPool {
  _persistence: PersistenceRocksDb
  _logger: Logger

  static _dbEvent = new EventEmitter()
  static _txMemPool = new TxMemPool()

  constructor (persistence: PersistenceRocksDb) {
    this._persistence = persistence
    this._logger = getLogger(__filename)
  }

  isAnyOutputClaimed (tx: Transaction, chainId: string): Promise<boolean> {
    const txInputs = tx.getInputsList()
    return new Promise((resolve) => {
      Async.each(txInputs, (input, cb) => {
        const outPoint = input.getOutPoint()
        const outPointClaimKey = TxPendingPool.getOutpointClaimKey(outPoint.getHash(), outPoint.getIndex(), chainId)

        this._persistence.get(outPointClaimKey).then((res) => {
          if (res === null) {
            cb()
          } else {
            cb(new Error(`${outPointClaimKey} already claimed`))
          }
        }).catch((e) => {
          cb(e)
        })
      }, (err) => {
        if (err) {
          this._logger.info(err)
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }

  listenNewPendingTx (callback: ({ hash: string, tx: Transaction }) => void) {
    TxPendingPool._dbEvent.on(EVENTS.txAdd, callback)
  }

  async loadBestPendingTxs (number: number, baseOnFunc: ?({ fee: BN }, { fee: BN }) => number): Promise<Transaction[]> {
    if (!baseOnFunc) {
      baseOnFunc = (tx1, tx2) => tx1.fee.cmp(tx2.fee)
    }

    const nlargest = TxPendingPool._txMemPool.loadBestPendingTxs(number, baseOnFunc)
    return nlargest.map(l => l.tx)
  }

  async markOutPointAsClaimed (outPoint: OutPoint, chainId: string) {
    const outPointClaimKey = TxPendingPool.getOutpointClaimKey(outPoint.getHash(), outPoint.getIndex(), chainId)
    await this._persistence.put(outPointClaimKey, true)
  }

  async markTxsAsMined (txs: Transaction[], chainId: string) {
    await Promise.all(
      txs.map(async tx => {
        const txHash = txUtils.txHash(tx)
        const inputs = tx.getInputsList()

        await Promise.all(
          inputs.map(async input => {
            const outPoint = input.getOutPoint()
            await this.markOutPointAsClaimed(outPoint, chainId)
          })
        )

        await this._persistence.del(txHash)
        TxPendingPool._txMemPool.del(txHash)
        TxPendingPool._dbEvent.emit(EVENTS.txRemove, { hash: txHash, tx: tx })
      })
    )
  }

  async tryAddingNewTx (tx: Transaction, chainId: string): Promise<boolean|Error> {
    if (await this.isAnyOutputClaimed(tx, chainId)) {
      this._logger.info(`${tx.getHash()}-${chainId} is already claimed`)
      throw new Error(`${tx.getHash()}-${chainId} is already claimed`)
    }

    const txBinary = tx.serializeBinary()
    const txHash = txUtils.txHash(tx)
    const txFee = txUtils.calcTxFee(tx)

    await this._persistence.put(txHash, txBinary)
    TxPendingPool._txMemPool.add({ hash: txHash, fee: txFee, tx: tx })
    TxPendingPool._dbEvent.emit(EVENTS.txAdd, {hash: txHash, tx: tx})
    return true
  }

  static getOutpointClaimKey (txHash: string, outPointIndex: number|string, chainId: string): string {
    return `${chainId}.op.${txHash}.${outPointIndex}`
  }
}

module.exports = TxPendingPool
