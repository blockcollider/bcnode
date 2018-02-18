
var BASE36_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

var crypto = require('crypto');
var secp256k1 = require('secp256k1');
var hex = require('convert-hex');
var bs36 = require('base-x')(BASE36_ALPHABET)
var randomBytes = crypto.randomBytes;
var ethUtil = require('ethereumjs-util')
var bitPony = require('bitpony');
var string = require('./utils/strings.js');
var ICAP = require('ethereumjs-icap');


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
    while(true) {

    var privateKey = crypto.randomBytes(32);
    var p = ethUtil.privateToAddress(privateKey).toString("hex");

    if ((p[0] === '0') && (p[1] === '0')){

      var b = bs36.encode(hex.hexToBytes(p));

      if(b.length === 31 && /[LIO01]/.test(b.slice(1, 31)) == false){

        return privateKey.toString("hex");

      }

    }
    }
  },

  validSecPrivateKey: function(key){
    return secp256k1.privateKeyVerify(new Buffer(key, "hex"));
  },

  createSecPublicKey: function(privKey){
    return secp256k1.publicKeyCreate(new Buffer(privKey, "hex")).toString("hex");
  },

  signSec: function(msg, privKey){
    
    if(msg.length !== 64) {
      log.error("data to sign must be of length 64");
      return;
    }

    return secp256k1.sign(new Buffer(msg, "hex"), new Buffer(privKey, "hex")).signature.toString('hex');

  },

  validSecSignature: function(msg, sig, pubKey){

    if(msg.length !== 64) {
      log.error("data to sign must be of length 64");
      return;
    }

    return secp256k1.verify(new Buffer(msg, "hex"), new Buffer(sig, "hex"), new Buffer(pubKey, "hex"));

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


