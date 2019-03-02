
'use strict';

const BN = require('bn.js')
const assert = require('assert');
const secp256k1 = require('secp256k1');
//const hash256 = require('bcrypto/lib/hash256');
const hash256 = require('./digest').sha256;
const { randomBytes } = require('crypto')
const schnorr = require('./blorr.js');
const Signature = require('elliptic/lib/elliptic/ec/signature');

//describe('Schnorr', function() {

const randomPrivateKey = () => {
  let privKey
  do {
    privKey = randomBytes(32)
  } while (!secp256k1.privateKeyVerify(privKey))

  return privKey
}

let m = randomBytes(32)

console.log("\n--Signature 1---");
const key = randomPrivateKey();
console.log('\n--Private Key--');

const pub = secp256k1.publicKeyCreate(key, false);

const msg = hash256(Buffer.from(m, 'ascii'));
const sig = schnorr.sign(msg, key);
const sig1 = new Signature(sig);

console.log("Message:"+m);

console.log("Private Key:",key.toString('hex'));
console.log("Public key:",pub);

console.log("\nSignature1 [s]:",sig1.s);
console.log("\nSignature1 [r]:",sig1.r);

console.log("\n--Signature 2---");
const key2 = randomPrivateKey()
const pub2 = secp256k1.publicKeyCreate(key2, false);

const sig2 = schnorr.sign(msg, key2);
const sig21 = new Signature(sig2);

console.log("Message:"+m);

console.log("Private Key:",key2.toString('hex'));
console.log("Public key:",pub2);

console.log("\nSignature2 [s]:",sig21.s);
console.log("\nSignature2 [r]:",sig21.r);

var pub3 = [];
pub3.push(pub);
pub3.push(pub2);
const pub4 = schnorr.combineKeys(pub3);
console.log("\nCombined Public key:",pub4);

const rtn=schnorr.verify(msg, sig, pub);
console.log("\nMerged Signature verified:",rtn);
console.log("\n-----");

const pair = schnorr.generateNoncePair(msg, key)

////////////////////////////////////////////

// maker's address is the address
//
var sigs = [];
sigs.push(sig1);
sig21.r = sig1.r
sigs.push(sig21);

// [outPoint] index OP_CALLBACK [publicKey] OP_SCHNORRPUBCOMB
// OP_SCHNORRPUBCOMB takes 2 public keys and returns a combined public key
// REF: https://asecuritysite.com/encryption/sch
// multiply all of the keys when the summation of the keys is created
// and then hash of it. The transactions can then be signed.

const combinedSigs = schnorr.combineSigs(sigs);

console.log("\nCombSignature [s]:",combinedSigs.s);
console.log("\nCombSignature [r]:",combinedSigs.r);

const partialPubKey = schnorr.recover(combinedSigs, msg)
const A = schnorr.recover(sig1, msg)
const B = schnorr.recover(sig21, msg)

var pubList = [];
pubList.push(B);
pubList.push(A);
const secondPartial = schnorr.combineKeys(pubList);

console.log("\nCombined PubKey", partialPubKey);
console.log("\nCombined PubKey", secondPartial);

const rtn2=schnorr.verify(msg, combinedSigs, partialPubKey);
console.log("\nCombined Signature verified:",rtn);
console.log("\n-----");
console.log("\n-----");
console.log("\n-----");
console.log("\n-----");
console.log("\n-----");
console.log("\n-----");

const keyA = randomPrivateKey()
const pubA = secp256k1.publicKeyCreate(keyA, true);
const sigA = schnorr.sign(msg, keyA)
const sigAs = new Signature(sigA)
const nonceObject = schnorr.generateNoncePair(Buffer.from(msg, 'hex'), keyA, schnorr.hash(sigA.r, pubA))

console.log(nonceObject)

const keyB = randomPrivateKey()
const pubB = secp256k1.publicKeyCreate(keyB, true);
console.log(nonceObject.toArrayLike(Buffer, 'be', 32));
const sigB = schnorr.sign(msg, keyB, schnorr.hash(nonceObject.r))
const sigBs = new Signature(sigB)


//const combinedSigsAB = schnorr.combinedSigs([sigAs, sigBs])
//
//console.log("\nSignature A [s]:",sigAs.s);
//console.log("\nSignature A [r]:",sigAs.r);
//console.log("\nSignature B [s]:",sigBs.s);
//console.log("\nSignature B [r]:",sigBs.r);
//
//console.log("\nCombSignature AB [s]:",combinedSigsAB.s);
//console.log("\nCombSignature AB [r]:",combinedSigsAB.r);

// console.log("\nCombined Signature AB", combinedSigsAB);

//const signatureA = new Signature(sigA)
//const r = signatureA.r


// schnorr.partialSign = function partialSign(msg, priv, privNonce, pubNonce) {
//schnorr.generateNoncePair = function generateNoncePair(msg, priv, data) {

//});
