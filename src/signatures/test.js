/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

'use strict';

const assert = require('./assert');
const elliptic = require('elliptic');
const curve = elliptic.ec('secp256k1').curve;
const crypto = require('crypto');
const Signature = require('elliptic/lib/elliptic/ec/signature');
const BN = require('bn.js');
const secp256k1 = require('secp256k1');
const sha256 = require('./digest').sha256;
const digest = require('./digest');
const schnorr = require('../crypto/schnorr');
const utils = elliptic.utils;

const { randomBytes } = require("crypto");

function createHash(key, R){
    return schnorr.hash(key, R);
}

function hashShortCurve(x) {

  //x = new BN(x, 16);
  //if (!x.red)
  //  x = x.toRed(this.red);

  //var y2 = x.redSqr().redMul(x).redIAdd(x.redMul(this.a)).redIAdd(this.b);
  //var y = y2.redSqrt();
  //if (y.redSqr().redSub(y2).cmp(this.zero) !== 0)
  //  return false;
  ////utils.toArray(x);

  return true;

}


function newPrivateKey() {

	let key;

	do {
		key = randomBytes(32)
	} while (!secp256k1.privateKeyVerify(key));

    return key;

}


// Alice buys Ethereum from Bob for Bitcoin

// ET = Ethereum transaction signed/unsigned sending Ether to Alice
// BT = Bitcoin transaction signed/unsigned sending Bitcoin to Bob
// H(ET) = Hash of Ethereum transaction hx sending Ether to Alice
// H(BT) = Hash of Bitcoin transaction hx sending Bitcoin to Bob
// Signature r | s
// Signature r + T | s + t

// R + T
// s + t


function Promise(d) {

	if(!d) throw Error("no data object provided to promise");

	this.version = d.version || 1;
	this.compiler = d.compiler; 	// TODO: Look up available blockchains from genesis block
	this.expire = d.expire; 		// Block Number
	this.data = d.data; 			// Full transaction compiles using referenced compiler model.
	this.fpk = 20000             	// Fee-per-kilobyte in transaction.
	this.proof = d.proof || false;
	this.header = d.header || false;

}

Promise.prototype = {

	_validated: false,

	_encoded: false,

	_lock: false,

	compile: function(){

		var self = this;
		var errors = [];

		/*
			1. Assert fee is set and correct.
			2. Assert compiler exists
			3. Assert code in compiler runs
		*/

		if(errors.length > 0) throw Error(errors);

		return self;

	},

	/* Takes Signature object or creates from header */

	encode: function(sig) {

		var self = this;

		if(self._validated != true){
			self.validate();
		}

		if(!sig) {
			sig =  ""; // FIXME: Set some reasonable init value
		}

		return self;

	}

}

var BobSendsEthereum = Buffer(digest.sha256(Buffer.from('transaction', 'ascii')));
var AliceReceivesEthereum = Buffer(digest.sha256(Buffer.from('transaction', 'ascii')));

var AliceSendsBitcoin = Buffer(digest.sha256(Buffer.from('transaction', 'ascii')));
var BobReceivesBitcoin = Buffer(digest.sha256(Buffer.from('transaction', 'ascii')));

var tx = digest.sha256(Buffer("0xf866068609184e72a0008303000094fa3caabc8eefec2b5e2895e5afbf79379e7268a780801ca07f158e380711daf356974ea62bd7850e58e9b", "hex"));

///////////////////

var msg = Buffer(digest.sha256(Buffer.from('transaction', 'ascii')));

var R = newPrivateKey();

var t = newPrivateKey();

var s = schnorr.sign(msg, R);

	s.s = new BN(tx);

console.log(s);

process.exit()

// Hash T from t and prepend with "03" for compact public
var Ta = Buffer(createHash(t, new BN(R)).toString("hex"), "hex");

var T = Buffer("03" + Ta.toString("hex"), "hex");

var RT = Buffer(new BN(T).add(new BN(R)).toString("hex"), "hex");

console.log("T: "+Ta.toString("hex"));
//console.log("PT: "+PT.toString("hex").length);

// Adaptor signature
var s = schnorr.sign(msg, RT, T);

// s + t
var st = s.s.add(new BN(t));

// Public address from s + t
var pub = secp256k1.publicKeyCreate(Buffer(st.toString("hex"), "hex"), true);

//console.log("pub: "+pub.toString("hex"));

//var nonce = schnorr.generateNoncePair(msg, Buffer(st), pub);
var drbg = schnorr.drbg(msg, Buffer(st.toString("hex"), "hex"), Buffer(new BN(pub.toString("hex")).toString("hex"), "hex"));

var l = drbg.generate(32);

console.log(l);

//console.log(drbg);
//
//var pex = schnorr.partialSign(msg, Buffer(rand.toString("hex"), "hex"), T);
//
//var sigs = schnorr.combineSigs(p, pex);
//
//
//console.log("about to partially sign");
//
//schnorr.partialSign(msg, st, T, T);

process.exit();












// The nonce is from the previous block hash of the same chain

// Original key
var os = newPrivateKey();

// Signature key
var sig = schnorr.sign(msg, os);

// Original public key
var opub = secp256k1.publicKeyCreate(Buffer(os.toString("hex"), "hex"), true);

var bconpub = new BN(opub);

assert.strictEqual(schnorr.verify(msg, sig, opub), true);

// Secret key
var t = newPrivateKey();

// Send to Alice
var T = crypto.createHash("sha256").update(t);

var bnos = new BN(os);
var bnt = new BN(t);

// s = os + t
var s = bnt.add(bnos);

console.log(bnt.toString('hex'));

// t = s - os;
var bnt = s.sub(bnos);

console.log(bnt.toString('hex'));


var spub = secp256k1.publicKeyCreate(Buffer(s.toString("hex"), "hex"), true);

//console.log(spub.toString("hex"));










function createSig(pv) {
	let t;

	do {
		t = randomBytes(32)
	} while (!secp256k1.privateKeyVerify(t));

	let T = secp256k1.publicKeyCreate(t, true);

	console.log("Private key: "+t.toString("hex"));

	const pub = secp256k1.publicKeyCreate(t);

	var msg = digest.hash256(Buffer.from('foo', 'ascii'));

	const sig = schnorr.sign(msg, t);

	console.log("Public key: "+pub.toString("hex"));


	return {
		priv: t,
		sig: sig,
		msg: msg,
		pub: pub
	}

}

var randomString = function(length) {
    let r = curve.g.mul(BN(883338));
	return r;
}

//var pairA = createSig("2733303904aabf426b6cea21139763238d9f9f4fda79195dc0c80e9bb233c261");
//
//var sigA = pairA.sig;
//var pubA = pairA.pub;
//var privA = pairA.priv;
//var msg = pairA.msg;
//
//var pairB = createSig("f827998c66a870674313bdbf8d00c4507dcc55cf8ce85a674fd07ac5672b9441");
//
//var sigB = pairB.sig;
//var pubB = pairB.pub;
//var privB = pairB.priv;
//var msg = pairB.msg;
//
////var noncePair = schnorr.generateNoncePair(msg, pairA.priv, digest.hash256(Buffer.from("foo", "ascii")));
//
////console.log(noncePair.toString("hex"));
//
//var dust = digest.hash256(Buffer.from('crunch', 'ascii'));
//
//console.log(pubA.length);
//console.log(digest.hash256(pubA).toString("hex"));
//
//var p = curve.point( '0948 7239995a 5ee76b55 f9c2f098', 'a89c e5af8724 c0a23e0e 0ff77500');
//
//console.log(Object.getPrototypeOf(p));
//
//console.log("pubA: "+pubA.toString("hex"));
//
//var am = schnorr.sign(msg, pairA.priv, pubA);
//var sm = schnorr.sign(msg, pairB.priv, pubB);
//
//
//console.log(sm);
//
//
//var m = schnorr.combineKeys([pubA,pubB]);
//var cm = schnorr.generateNoncePair(msg,privA,pubA);
//
//var am = schnorr.sign(msg, pairA.priv, cm);
//
//var drbg = schnorr.drbg(msg, pairA.priv, cm);
//var k = new BN(drbg.generate(32));
//
//var p = schnorr.partialSign(msg, pairA.priv, k, cm);
//
//console.log(am);
//console.log(p);
//
//
////
////console.log(am.s.toString("hex"));
////
////const g = new Signature(sigA);
////const s = new Signature(sigB);
////
////console.log(g);
////
////console.log("am r: "+am.r);
////
////var m = schnorr.combineSigs([am,sm]);
////var combinedPubKey = schnorr.recover(m, msg);
////
////var carA = schnorr.recover(m, dust);
////var carB = schnorr.recover(am, msg);
//////
////
////console.log("carB "+carB.toString("hex"));
////
////assert.strictEqual(schnorr.verify(msg, m, combinedPubKey), true);
////assert.strictEqual(schnorr.verify(dust, m, combinedPubKey), true);
//
////
////var m = schnorr.combineKeys([pubA,pubB]);
////
////console.log(m);
//////console.log("Recovered Public Key: "+rec.toString("hex"));
////
////assert.strictEqual(schnorr.verify(msg, sigA, pubA), true);
////assert.bufferEqual(schnorr.recover(sigA, msg), pubA);
////
////assert.strictEqual(schnorr.verify(msg, sigB, pubB), true);
////assert.bufferEqual(schnorr.recover(sigB, msg), pubB);
//
