/**
 * Copyright (c) 2018-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { blake2bl } = require('../../utils/crypto')
const { ScriptTemplates, txHash, txSign, fromAddress } = require('../txUtils')
const { Transaction } = require('../../protos/core_pb')

const SAMPLE_ADDRESS = '0xac206b88c5f37b43e61dc6d585218f548d453dc9'
const SAMPLE_PRIVATE_KEY = Buffer.from('612a1ff4ffc18c35d2ebe93cb9ca40c310b8765fb4b80705ee6f709495e3b6fa', 'hex')

describe('txUtils', () => {
  let unsignedTx1
  beforeEach(() => {
    unsignedTx1 = new Transaction()
  })

  describe.only('ScriptTemplates.validateScript', () => {
    it('validates simple lock script', () => {
      const newOutputLockScript = [
        'OP_DUP',
        'OP_BLAKE2BL',
        blake2bl(blake2bl('')),
        'OP_EQUALVERIFY',
        'OP_CHECKSIG'
      ].join(' ')

      expect(ScriptTemplates.validateScript(newOutputLockScript)).toBe(true)
    })

    it('validates lock script with OP_CHECKLOCKTIMEVERIFY', () => {
      const newOutputLockScript = [
        '1b77a5', // 1800101
        'OP_CHECKLOCKTIMEVERIFY',
        'OP_DUP',
        'OP_BLAKE2BL',
        blake2bl(blake2bl('minerAddress')),
        'OP_EQUALVERIFY',
        'OP_CHECKSIG'
      ].join(' ')

      expect(ScriptTemplates.validateScript(newOutputLockScript)).toBe(true)
    })
  })

  describe('txHash', () => {
    it('creates hash', () => {
      const hash = txHash(unsignedTx1)
      expect(hash).toEqual(Buffer.from('ba86cad211a47d04f2052509e0fa4db52edc108d0543cb45caee504f41bfef12', 'hex'))
    })
  })

  describe('txSign', () => {
    it('signs transaction', () => {
      const signed = txSign(unsignedTx1, SAMPLE_PRIVATE_KEY)

      // $FlowFixMe
      expect(signed.getR()).toBeTruthy()
      // $FlowFixMe
      expect(signed.getS()).toBeTruthy()
      // $FlowFixMe
      expect(signed.getV()).toBeTruthy()
    })
  })

  describe('fromAddress', () => {
    it('fails for unsigned tx', () => {
      expect(() => fromAddress(unsignedTx1)).toThrowError(/unsigned/)
    })

    it('creates from address from signed transaction', () => {
      const signed = txSign(unsignedTx1, SAMPLE_PRIVATE_KEY)
      const from = fromAddress(signed)
      expect(from).toBe(SAMPLE_ADDRESS)
      expect(from).toBe(signed.getRecipient())
    })
  })
})
