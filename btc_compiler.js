
const bitcoin = require('bitcoinjs-lib')

function Compiler() {

}

Compiler.prototype = {

    codeFromHex: function(code, cb){

		var self = this;

    },

	// https://github.com/bitcoinjs/bitcoinjs-lib/blob/9bae30d1121a9d382f2f461fad0194a0e97dfd1e/test/integration/transactions.js 
	createTransaction: function(params, privKeyWIF, cb){

		try { 

            var privKey = bitcoin.ECPair.fromWIF(privKeyWIF)

            var tx = new bitcoin.TransactionBuilder()

                tx.sign(0, privKey)

			cb(null, tx.build().toHex());

		} catch (err) {

			cb(err);

		}

	}

}


module.exports = Compiler;

