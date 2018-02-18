'use strict';

// https://github.com/PolkaJS/thresh-sig
const genesisSettings = require("../../config/genesis_settings.json");
const util = require('../../utils/util');
const crypto = require("crypto");
const consensus = require('../../protocol/consensus');
const encoding = require('../../utils/encoding');
const BN = require("bn.js");
const TX = require('../../primitives/tx');
const schnorr = require('../../crypto/schnorr');
const Block = require('../../primitives/block');
const Script = require('../../script/script');
const Output = require("../../primitives/output");
const SubOutput = require("../../primitives/suboutput");
const SubStack = require("../../primitives/substack");
const {secp256k1, hash256} = require('bcrypto');

const Events = require('events').EventEmitter

const script = new Script()

const output = new Output()

output.script.pushSym("MARK")

// Given any (s, R) on chain, create (t, T), and assert that the adaptor signature was: s' = s - t, with R' = R - T, so adaptor verify eqn was: s'G = R' + H(P || R'+T || m)P

const t = secp256k1.generatePrivateKey();
const T = secp256k1.publicKeyCreate(t, true);  

const keyA = secp256k1.generatePrivateKey();
const keyB = secp256k1.generatePrivateKey();
const pubA = secp256k1.publicKeyCreate(keyA, true);
const pubB = secp256k1.publicKeyCreate(keyB, true);
const msgA = hash256.digest(Buffer.from('foo', 'ascii'));
const msgB = hash256.digest(Buffer.from('car','ascii'));
const pubNonce = schnorr.generateNoncePair(msgA, keyA);
const sigA = schnorr.partialSign(msgA, keyA, keyA, pubNonce);
const sigB = schnorr.partialSign(msgB, keyB, keyA, pubNonce);
//const sig = schnorr.combineSigs([sigA,sigB]);

const original = schnorr.sign(msgA, keyA);
const sig = schnorr.sign(msgA, keyA);

const pubKey = schnorr.recover(sig, msgA);

var G = new BN(T).div(new BN(t));

console.log(G);
var R = new BN(G).mul(sig.r);

console.log(R);
sig.r = sig.r.sub(new BN(T));
sig.s = sig.s.sub(new BN(t));


console.log(pubKey);

//console.log(schnorr.recover(sig, msgA));





//-> T
//
//-> Payment to T
//
//Signature + T
//
//Public Key + T
//
//Signature + PrivK

//////////////////////////////////////////////////////////////
/*
 *
 * <address> <lock> OP_COMMITBIT 
 *
 *
 */


//////////////////////////////////////////////////////////////
/*
 * User claims amount from substack  
 * INTPUT: <mark/null> <amount> <txid> <chainSignature> <claimTXSignature> 
 * OUTPUT: OP_OVER OP_SWAP OP_VERIFYSIGCLAIM OP_DUP <chain> <filter/null> <benefactor> OP_CHECKSIGCHAINBENEFACTOR OP_VERIFYSIGCHAINTXID OP_DUP <amount> OP_BALANCEUNITS OP_SEND 
 *
 */
 

//////////////////////////////////////////////////////////////
/*
 * User creates Stable Coin
 * INTPUT: PrevOut: hash
 * OUTPUT: <mark/null> OP_TOSTACK <blockheight> OP_LOCKSTACKIMMUTABLEEXP
 *
 *       SUBINTPUT: 300 OP_BALANCE 
 *       --
 *       SUBOUTPUT: OP_OVER OP_SWAP OP_VERIFYSIGCLAIM OP_DUP <ethereumAddress> <filter/null>  OP_CHECKSIGCHAINBENEFACTOR OP_VERIFYSIGCHAINTXID OP_DUP <unit> OP_BALANCEUNIT <mark/null> 100 OP_BALANCE
 *       SUBOUTPUT: OP_OVER OP_SWAP OP_VERIFYSIGCLAIM OP_DUP <bitcoinAddress> <filter/null> <benefactor> OP_CHECKSIGCHAINBENEFACTOR OP_VERIFYSIGCHAINTXID OP_DUP <unit> OP_BALANCEUNIT <mark/null> 100 OP_BALANCE
 *       SUBOUTPUT: OP_OVER OP_SWAP OP_VERIFYSIGCLAIM OP_DUP <zeroX> <filter/null> <benefactor> OP_CHECKSIGCHAINBENEFACTOR OP_VERIFYSIGCHAINTXID OP_DUP <unit> OP_BALANCEUNIT <mark/null> 100 OP_BALANCE
 *
 */

//OP_VERIFYAGELTE verifies the transaction not the stack age

//Required OP_PUSHDATA

var bob = "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3";

//input: 50 NRG 
//
//output: bob 400 OP_SEND 5000 OP_VERIFYAGELTE 80 OP_VERIFYDEPTHLTE 100 OP_SENDUNIT bob 34029384 OP_STACKEXPIRE
//
//bob is sent upto 400 NRG which is less then or eq block 5000 and has a depth less then or eq to 80
//
//The amount sent is greater than 100 and at a rate of 50/400 the stack expiration should return before block 35029384
//
//and be returned to bobs address
//
//If I sent 100 NEW NRG I would recieve for collateral 12.5 OLD NRG (100 * 50/400)
//
//Or the NRG must be purchased in amounts of 12.5 (50/(400/100))
//
//input bob 100 
//
//output 



