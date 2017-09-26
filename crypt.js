

var { randomBytes } = require('crypto');
var forge = require('node-forge');
var ed = require('ed25519-supercop');
var secp256k1 = require('secp256k1');


function Crypt() { }

Crypt.prototype = {

	createSecPrivateKey: function(){
		return randomBytes(32);
	},

	privateKeyVerify: function(key){
		return secp256k1.privateKeyVerify(key);
	},

	publicKeyCreate: function(privKey){
		return secp256k1.publicKeyCreate(privKey);
	},

	signSec: function(msg, privKey){
		return secp256k1.sign(msg, privKey);
	},

	validSec: function(msg, sig, pubKey){
		return secp256k1.verify(msg, sig, pubKey);
	}

	/*
		ed25519
	*/
	createSeed: function() { 
		return ed.createSeed()
	},

	createEdPrivateKey: function(seed){
		return ed.createKeyPair(seed);
	},

	signEd: function(msg, pub, secret){
		return ed.sign(msg, pub, secret);
	},

	validEd: function(sig, msg, pub){
		return ed.verify(sig, msg, pub);	
	},

	// password based key derivation
	passwordKeyDerivation: function(pass, data) {

		var keySizeInBits = 128;
		var keySize = 16;
		var salt = forge.random.getBytes(8);  
		var key = forge.pkcs5.pbkdf2(pass, salt, 1000, keySizeInBits);  
		var iv = forge.random.getBytes(16);
		var input = forge.util.createBuffer(data);  
		var cipher = forge.aes.startEncrypting(key, iv);  
			cipher.update(input);  

		var status = cipher.finish();  
		var ciphertext = cipher.output.data.toHex();

		console.log(ciphertext);

	},

	decryptWithKey(pass, iv){


	}

}

var crypt = new Crypt();

var a= crypt.encryptWithPassword("test", "hello");

console.log(a);

