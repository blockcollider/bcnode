const crypto = require('crypto')

const { signData, pubKeyRecover, pubKeyToAddr } = require('../core/txUtils')
const { blake2bl } = require('../utils/crypto')

const privHex = '612a1ff4ffc18c35d2ebe93cb9ca40c310b8765fb4b80705ee6f709495e3b6fa'
const priv = Buffer.from(privHex, 'hex')

const testData = crypto.randomBytes(512)
const signature = signData(testData, priv)

console.log(`Signature: ${signature.slice(0, 4).toString('hex')}...${signature.slice(60).toString('hex')}`) // eslint-disable-line no-console

const pubKey = pubKeyRecover(blake2bl(testData), signature)

console.log(`Pubkey: ${pubKey.toString('hex')}, l: ${pubKey.length}`) // eslint-disable-line no-console
// 0xac206b88c5F37b43e61Dc6D585218F548d453Dc9
console.log(`Address ${pubKeyToAddr(pubKey)}`) // eslint-disable-line no-console
