

var crypto = require('crypto');
var secp256k1 = require('secp256k1');
var randomBytes = crypto.randomBytes;
var bitPony = require('bitpony');
var string = require('./strings.js');


function Crypt() { }

Crypt.prototype = {

	/**************************************
		BTC Variable_length_integer
	*/
	readInt: function(i){
		return bitPony.var_int.read(i);
	},

	writeInt: function(i){
		return bitPony.var_int.write(i);
	},

	/**************************************
		BTC Variable_length_string
	*/
	readStr: function(i){
		return bitPony.string.read(i).toString();
	},

	writeStr: function(i){
		return bitPony.string.write(i).toString('hex');
	},

	/**************************************
		BTC network byte order 
	*/
	readHash: function(i){
		return bitPony.string.read(i);
	},

	writeHash: function(i){
		return bitPony.string.write(i);
	},

	createSecPrivateKey: function(){
		return randomBytes(32);
	},

	validSecPrivateKey: function(key){
		return secp256k1.privateKeyVerify(key);
	},

	createSecPublicKey: function(privKey){
		return secp256k1.publicKeyCreate(privKey);
	},

	signSec: function(msg, privKey){
		return secp256k1.sign(new Buffer(string.blake2s(msg), "hex"), new Buffer(privKey, "hex")).signature.toString('hex');
		//return secp256k1.sign(new Buffer(crypto.createHash("sha256").update(msg).digest("hex"), "hex"), new Buffer(privKey, "hex")).signature.toString('hex');
	},

	validSecSignature: function(msg, sig, pubKey){
		return secp256k1.verify(msg, sig, pubKey);
	},

	/**************************************
		AES-256-CTR
	*/
    encrypt: function(text, pass){

		  var iv = crypto.randomBytes(16);
		  var p = new Buffer(string.blake2bl(pass), "hex"); 
		  //var p = new Buffer(crypto.createHash("sha256").update(pass).digest("hex"), "hex");
		  var cipher = crypto.createCipheriv("AES-256-CTR", p, iv)
		  var encrypted = cipher.update(text)
		  	  encrypted = Buffer.concat([encrypted, cipher.final()]);

    	  return iv.toString('hex') + ':' + encrypted.toString('hex');

    },

	decrypt: function(text, pass){

		  var parts = text.split(":");
		  var iv = new Buffer(parts.shift(),"hex");
		  var encryptedText = new Buffer(parts.join(":"), "hex");
		  var p = new Buffer(string.blake2bl(pass), "hex");
		  var decipher = crypto.createDecipheriv("AES-128-CTR", p, iv);
		  var dec = decipher.update(encryptedText);

	      dec = Buffer.concat([dec, decipher.final()]);

		  return dec.toString();

	}

}

module.exports = Crypt;


