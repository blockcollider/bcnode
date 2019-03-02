/* eslint-disable */
const process = require('process')
const path = require('path')
const { inspect } = require('util')
const { randomBytes } = require('crypto')

const secp256k1 = require('secp256k1')
const { equals } = require('ramda')

const { signData } = require('../core/txUtils')
const { blake2bl } = require('../utils/crypto')
const { bufferToInt } = require('../utils/buffer')

process.env.BC_LOG = 'error'
process.env.BC_DEBUG = true


const randomPrivateKey = () => {
  let privKey
  do {
    privKey = randomBytes(32)
  } while (!secp256k1.privateKeyVerify(privKey))
  return privKey
}

const dataToMsgHash = (data: Buffer): Buffer => {
  return Buffer.from(blake2bl(data.toString('hex')), 'hex')
}

process.on('unhandledRejection', (e) => {
  console.error(e.stack)
});

const privKey = randomPrivateKey()
const pubKey = secp256k1.publicKeyCreate(privKey) // uncompressed

const data1 = randomBytes(128)
const data2 = randomBytes(128)

console.log(`data1 !== data2: ${!equals(data1, data2)}`)

const signature = signData(data1, privKey)

const reconstructedPk1 = secp256k1.recover(dataToMsgHash(data1), signature.slice(0, 64), bufferToInt(signature.slice(64)))
const reconstructedPk2 = secp256k1.recover(dataToMsgHash(data2), signature.slice(0, 64), bufferToInt(signature.slice(64)))

console.log(`Sig:\t\t${signature.toString('hex')}\nPrivKey:\t${privKey.toString('hex')}\nPubKey:\t\t${pubKey.toString('hex')}`)
console.log(`rPubKey1:\t${reconstructedPk1.toString('hex')}`);
console.log(`rPubKey2:\t${reconstructedPk2.toString('hex')}`);
console.log(`pubKey === reconstructedPk1: ${equals(pubKey, reconstructedPk1)}`)
console.log(`pubKey === reconstructedPk2: ${equals(pubKey, reconstructedPk2)}`)

const result1 = secp256k1.verify(dataToMsgHash(data1), signature.slice(0, 64), pubKey)
const result1recon = secp256k1.verify(dataToMsgHash(data1), signature.slice(0, 64), reconstructedPk1)
const result2 = secp256k1.verify(dataToMsgHash(data2), signature.slice(0, 64), pubKey)
const result2recon = secp256k1.verify(dataToMsgHash(data2), signature.slice(0, 64), reconstructedPk2)

console.log(`Results ###> r1: ${result1}, r1r: ${result1recon}, r2: ${result2}, r2r: ${result2recon}`)
