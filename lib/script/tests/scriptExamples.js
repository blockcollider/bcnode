'use strict';

const genesisSettings = require("../../config/genesis_settings.json");
const util = require('../../utils/util');
const crypto = require("crypto");
const consensus = require('../../protocol/consensus');
const encoding = require('../../utils/encoding');
const TX = require('../../primitives/tx');
const Block = require('../../primitives/block');
const Script = require('../../script/script');
const Output = require("../../primitives/output");
const SubOutput = require("../../primitives/suboutput");
const SubStack = require("../../primitives/substack");

const randgen = require("randgen");
const pos = require("poisson-process");

const Events = require('events').EventEmitter;

const script = new Script();

const output = new Output(); 

output.script.pushSym("MARK")

//////////////////////////////////////////////////////////////
/*
 * User claims amount from substack  
 * INTPUT: <mark/null> <amount> <txid> <chainSignature> <claimTXSignature> 
 * OUTPUT: OP_OVER OP_SWAP OP_VERIFYSIGCLAIM OP_DUP <chain> <filter/null> <benefactor> OP_CHECKSIGCHAINBENEFACTOR OP_VERIFYSIGCHAINTXID OP_DUP <amount> OP_BALANCEUNITS OP_SEND 
 *
 */
 

//////////////////////////////////////////////////////////////
/*
 *
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



