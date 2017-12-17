

'use strict';


const assert = require('./signatures/assert');
const ee = require('events').EventEmitter;
const elliptic = require('elliptic');
const curve = elliptic.ec('secp256k1').curve;
const crypto = require('crypto');
const Signature = require('elliptic/lib/elliptic/ec/signature');
const BN = require('bn.js');
const secp256k1 = require('secp256k1');
const sha256 = require('./signatures/digest').sha256;
const digest = require('./signatures/digest');
const schnorr = require('./signatures/schnorr');
const utils = elliptic.utils;
const strings = require("./utils/strings.js");
const xc = require("./signatures/crypto-xor.js");
const Log = require("./log.js");
const { randomBytes } = require("crypto");

var log;

if(!global.log){
    log = new Log();
} else {
    log = global.log;
}

/* 
    BLOCK COLLIDER PROMISES 
    Adaptor-like Signatures which run if data is seen on member blockchains.

        var expectedTXData = "f866068609184e72a0008303000094fa3caabc8eefec2b5e2895e5afbf79379e7268a780801ca07f158e380711daf356974ea62bd7850e58e9b";

        var promise = new Promise({
            compiler: "NEO::29938",
            expire: 432004,
            fpk: 66046
        }).on(expectedTXData).sign();

*/ 

function createHash(key, R){
    return schnorr.hash(key, R);
}

function newPrivateKey() {

    log.warn("forced private key creation");

	let key;

	do {
		key = randomBytes(32) 
	} while (!secp256k1.privateKeyVerify(key));

    return key;

}



function Promise(d) {

	if(!d) throw Error("no data object provided to promise");

	this.version = d.version || 1;     // Client flag/version
	this.expect = d.expect || false    // The hash of the data expected to be seen on a blockchain.
	this.expire = d.expire; 		   // TODO: Confirm Block Number in future
    this.output = d.output || false;            // Resulting transaction hash miners use to prove TX submission. 
	this.fpk = d.fpk || 66046          // Fee-per-kilobyte in transaction.
	this.compiler = d.compiler; 	   // TODO: Look up available blockchains from genesis block
	this.data = d.data || false;       // Data of transaction to be run.
	this.extdata = d.data || false;    // Data is stored on member blockchain. 
	this.next = d.next || false;       // Reference address of signature to evaluated next. 

}

Promise.prototype = {

    privateKey: false, // Used for signatures by the active account.

    expect: false, // Used to encrypt/decrypt the transaction body.

    _events: false,

	_validated: false,

    _data: false,

	_signed: false,

	_lock: false,

    on: function(d){

        var self = this;

            if(self.expect == false){

                self.expect = Buffer.from(digest.sha256(Buffer.from(d, "hex")).toString("hex"), "hex");

            }
        
            self._data = d;
        
        return self;

    },

    /* Runs several validation checks, returns self  */ 
	validate: function(){

		var self = this;
		var errors = [];

        if(self._data == false && self.expect == false){
            errors.push(Error("add data with .on() method"));
        }

		/*
			1. Assert fee is set and correct.
			2. Assert compiler exists.
			3. Assert code in compiler runs on _data.
		*/

		if(errors.length > 0) throw Error(errors);

        self._validated = true;

		return self;

	},

	/* Takes Signature object or creates from header 
       XOR encrypts transaction with hash of sha.
    */ 
	sign: function(sig, pk) {

		var self = this;

		if(self._validated != true){
			self.validate();
		}

		if(!sig){

            if(self.privateKey != false && pk == undefined){
                pk = self.privateKey;
            } else if(pk == undefined) {
                pk = newPrivateKey();
            }

            var msg = Buffer(digest.sha256(Buffer.from("SCRIPT_2", 'utf8')));

            sig = schnorr.sign(msg, pk); 

		}

        log.info("Public Origin R: " + sig.r.toString("hex"));
        log.info("Origin S: " + sig.s.toString("hex"));

        sig.s = sig.s.add(new BN(self.expect));

        sig.r = sig.r.add(new BN(digest.sha256(self.expect)));
        
        log.info("Public Adaptor R: " + sig.r.toString("hex"));
        log.info("Adaptor S: " + sig.s.toString("hex"));
        log.info("Adapter K: " + self.expect.toString("hex"));

        self.data = xc.encode(self.data, self.expect.toString("hex"));

        self._signed = true;

		return self;

	}
	
}



