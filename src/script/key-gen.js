/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
var ecdsa = require('ecdsa')
var sr = require('secure-random')
var bigi = require('bigi')
var config = require('./config.js')

module.exports = {
  generateSignature () {
    var CoinKey = require('coinkey')

    // Generate random public-private keys
    var ck = new CoinKey(sr.randomBuffer(32), true)
    var pubKeyString = ck.publicKey.toString('hex')

    // Sign message
    var shaMsg = config.nonce
    var signature = ecdsa.sign(shaMsg, ck.privateKey)
    var signatureString = signature.r.toString() + signature.s.toString()

    return {
      signatureString: signatureString,
      pubKeyString: pubKeyString
    }
  },

  processPubKeyString (pubKeyString: string) {
    if (pubKeyString.length % 2 !== 0) {
      pubKeyString = '0' + pubKeyString
    }
    return Buffer.from(pubKeyString, 'hex')
  },

  processSignatureString (signatureString: string) {
    var rString = signatureString.substr(0, signatureString.length / 2)
    var sString = signatureString.substr(signatureString.length / 2)
    return {
      r: new bigi(rString), // eslint-disable-line new-cap
      s: new bigi(sString) // eslint-disable-line new-cap
    }
  }
}
