/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export default class UTXO {
  txHash: Buffer
  index: number

  constructor (txHash: Buffer, index: number) {
    this.txHash = txHash
    this.index = index
  }
}
