/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
var { base } = require('./config.js')
var { blake2bl, blake2bls, blake2blc } = require('../utils/crypto')
var { bufferToInt } = require('../utils/buffer')
var BN = require('bn.js')
var secp256k1 = require('secp256k1')
var debug = require('debug')('bcnode:script:crypto')
// var schnorr = require('../crypto/blorr.js')

module.exports = {
  convertToHex (data: BN|string): string {
    if (BN.isBN(data)) {
      data = data.toBuffer().toString('hex')
    }
    return data
  },
  ripemd160 (data: BN|string): string {
    data = this.convertToHex(data)
    return require('ripemd160')(data).toString('hex')
  },
  sha1 (data: BN|string): string {
    data = this.convertToHex(data)
    return require('sha1')(data)
  },
  sha256 (data: BN|string): string {
    data = this.convertToHex(data)
    return require('sha256')(data)
  },
  blake2bl (data: BN|string): string {
    data = this.convertToHex(data)
    return blake2bl(data)
  },
  blake2bls (data: BN|string): string {
    data = this.convertToHex(data)
    return blake2bls(data)
  },
  processPubKey (data: BN): Buffer {
    // get pubkey from stack as a buffer
    return data.toBuffer()
  },
  processSignature (data: BN): Buffer {
    // get signature from stack as buffer
    return data.toBuffer()
  },
  verifySignature (msg: BN, signature: Buffer, pubKey: Buffer): Boolean {
    // use just first 64B of the signature - last one is recovery number
    debug(`${msg.toBuffer().toString('hex')},${signature.slice(0, 64).toString('hex')},${pubKey.toString('hex')}`)
    return secp256k1.verify(msg.toBuffer(), signature.slice(0, 64), pubKey)
  },
  // see txUtils.pubKeyRecover - that one returns uncompressed version of the public key
  pubKeyFromSignature (msg: BN, signature: Buffer): Buffer {
    const pubKey = secp256k1.recover(
      msg.toBuffer(),
      signature.slice(0, 64),
      bufferToInt(signature.slice(64))
    )
    return secp256k1.publicKeyConvert(pubKey, true) // return compressed pubKey
  }
  /// / SCHN: SCHNORR combine public keys
  // schnorrCombinePublicKeys (keys) {
  //  return schnorr.combineKeys(keys);
  // },
  /// / SCHN: schnorr combine signatures
  // schnorrCombineSignatures (sigs) {
  //  return schnorr.combineSignatures(keys);
  // },
  /// / SCHN: schnorr combine signatures
  // schnorrRecoverPublicKey (sig, msg) {
  //  return schnorr.recover(sig, msg);
  // },
  /// / SCHN: Verify msg signature set
  // schnorrVerify (msg, sig, pub) {
  //  return schnorr.verify(keys);
  // }
}
