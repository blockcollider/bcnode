/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { randomBytes } = require('crypto')

const secp256k1 = require('secp256k1')

const { signData } = require('../../core/txUtils')
const { blake2bl } = require('../../utils/crypto')
const { parse } = require('../script')

const randomPrivateKey = (): Buffer => {
  let privKey
  do {
    privKey = randomBytes(32)
  } while (!secp256k1.privateKeyVerify(privKey))

  return privKey
}

describe('random', () => {
  it('eth adress', () => {
    const pk = randomPrivateKey()
    const pub = secp256k1.publicKeyCreate(pk, false)
    const { pubKeyToAddrHuman } = require('../../core/txUtils')
    console.log(`Private key hex: ${pk.toString('hex')}`)
    console.log(`ETH address: ${pubKeyToAddrHuman(pub)}`)
  })
})

describe('script validator', () => {
  it('calculates blake2bl', () => {
    const data = 'abc'
    const hash = blake2bl(data)
    const hashScript = [
      hash,
      'OP_BLAKE2BL',
      blake2bl(hash),
      'OP_EQUALVERIFY'
    ].join(' ')
    expect(parse(hashScript).value).toBe(true)
  })

  it('compares 2 values', () => {
    const noeqScript = [
      'a',
      'b',
      'OP_EQUALVERIFY'
    ].join(' ')

    expect(() => {
      let _ = parse(noeqScript) // eslint-disable-line no-unused-vars
    }).toThrow(/OP_VERIFY\(\)/)

    const eqScript = [
      'a',
      'a',
      'OP_EQUALVERIFY'
    ].join(' ')

    expect(parse(eqScript).value).toBe(true)
  })

  it('verifies signature', () => {
    const privateKey = randomPrivateKey()
    const dataToSign = randomBytes(128)
    const msg = blake2bl(dataToSign)
    const publicKey = secp256k1.publicKeyCreate(privateKey, true).toString('hex') // compressed
    const signature = signData(dataToSign, privateKey).toString('hex')

    // here we inject data to sign as a first param, in practice it will be calculated
    // from TX data while validating
    const sigScript = [
      msg,
      signature,
      publicKey,
      'OP_CHECKSIGVERIFY'
    ].join(' ')

    expect(parse(sigScript).value).toBe(true)
  })

  it('verifies signature with no public key', () => {
    const privateKey = randomPrivateKey()
    const dataToSign = randomBytes(128)
    const msg = blake2bl(dataToSign)
    const signature = signData(dataToSign, privateKey).toString('hex')

    // here we inject data to sign as a first param, in practice it will be calculated
    // from TX data while validating
    const sigScript = [
      msg,
      signature,
      'OP_CHECKSIGNOPUBKEYVERIFY'
    ].join(' ')

    expect(parse(sigScript).value).toBe(true)
  })
})
