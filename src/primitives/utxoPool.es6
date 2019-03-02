/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import UTXO from './utxo'
import { TransactionOutput } from '../protos/core_pb'

export default class UTXOPool {
  _h: Map<UTXO, TransactionOutput>

  constructor () {
    this._h = new Map()
  }

  addUTXO (utxo: UTXO, txOut: TransactionOutput) {
    this._h.set(utxo, txOut)
  }

  removeUTXO (utxo: UTXO) {
    this._h.delete(utxo)
  }

  getTxOutput (ut: UTXO): TransactionOutput {
    return this._h.get(ut)
  }

  contains (utxo: UTXO): bool {
    return this._h.has(utxo)
  }

  getAllUTXO (): UTXO[] {
    const allUTXO: UTXO[] = []
    for (let ut of this._h.keys()) {
      allUTXO.push(ut)
    }
    return allUTXO
  }
}
