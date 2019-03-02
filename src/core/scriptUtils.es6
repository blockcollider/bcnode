/**
 * Copyright (c) 2018-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const secp256k1 = require('secp256k1')
const keccak = require('keccak')
const { is } = require('ramda')

const { leftPadBuffer } = require('../utils/buffer')
const { Transaction, TransactionInput, TransactionOutput } = require('../protos/core_pb')
const { unlock } = require('../script/index')
const { txHash } = require('../core/txUtils')

// validates an input script unlocks an output script
export const validateScripts = (input: TransactionInput|string, output: TransactionOutput|string): boolean => {
  if (!is(String, input)) {
    input = Buffer.from(input.getInputScript()).toString('ascii')
  }
  if (!is(String, output)) {
    output = Buffer.from(output.getInputScript()).toString('ascii')
  }
  return unlock(input, output)
}

// returns public key from signed transaction
const pubKeyRecover = (tx: Transaction): Buffer => {
  const signature = Buffer.concat([
    leftPadBuffer(Buffer.from(tx.getR()), 32),
    leftPadBuffer(Buffer.from(tx.getS()), 32)
  ], 64)

  const v = parseInt(Buffer.from(tx.getV()).toString('hex'), 16)
  const senderPubKey = secp256k1.recover(txHash(tx), signature, v)
  return secp256k1.publicKeyConvert(senderPubKey, false).slice(1)
}

const pubKeyToAddr = (key: Buffer): string => {
  console.assert(key.length === 64) // eslint-disable-line no-console
  const digest = keccak('keccak256').update(key).digest()

  // see https://github.com/ethereumjs/ethereumjs-util/blob/master/index.js#L317
  return `0x${digest.slice(-20).toString('hex')}`
}

export const fromAddress = (tx: Transaction): string => {
  if (!tx.getV() || !tx.getR() || !tx.getS()) {
    throw new Error('Cannot get from address from unsigned transaction')
  }

  const convPubKey = pubKeyRecover(tx)
  return pubKeyToAddr(convPubKey)
}
