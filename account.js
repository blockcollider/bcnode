
var pt = require('prompt');
var Crypt = require("./crypt.js");
var crypt = new Crypt();
var colors = require("colors/safe");
var fs = require('fs-extra')
var string = require('./strings.js');
var bitcoin = require('bitcoinjs-lib')

function Account(opts) {

    var options = {
        path: "./",
		file: "accounts.json"
    }

    if(opts != undefined) {

		Object.keys(opts).map(function(k){
			this[k] = opts[k];
		});
        
    } else {

		Object.keys(options).map(function(k){
			this[k] = options[k];
		});

	}

}

Account.prototype = {

    createColliderBase: function(cb) {
	
		var self = this;
			self.createAddress(cb);	

    },

    unlockColliderBase: function(cb) {

		var self = this;
	 		
		var identity = self.path+"/identity.json";

		self.unlockAccount(identity.base.publicKey, cb);

    },

	unlockAccount: function(publicKey, cb, colliderBase){

		var self = this;

	},

    createAddress: function(cb) {

	  var self = this;

  	  pt.message = colors.green("BlockCollider");

  	  pt.delimiter = colors.grey(":");

	  pt.start();

	  pt.get([{

		  properties: {

			password: {
			  description: 'Password to secure collider base on disk',
			  delimiter: colors.grey(">"),
			  hidden: true,
			  required: true,
			  conform: function (value) {
				if(value != undefined && value.length > 3 && value != "password" && value != "pass") {
					return true;
				}
			  }

			}
		  },
		}
		], function (err, result) {

			pt.stop();

			if(err) { cb(err); } else {

				console.log("now in acccount: "+self.networkKey);

				// Bitcoin
				var privateKey = crypt.createSecPrivateKey();
				var publicKey = crypt.createSecPublicKey(privateKey);
				var blakeKey = string.blake2b(publicKey.toString("hex")); 
				var publicKeyHash = bitcoin.crypto.hash160(blakeKey);
				var addr = bitcoin.address.toBase58Check(publicKeyHash, bitcoin.networks.bitcoin.pubKeyHash)

				var account = {
					publicKey: publicKey.toString("hex"), 
					address: addr,
					ePrivateKey: crypt.encrypt(privateKey.toString("hex"), result.password),
					networkSig: crypt.signSec(self.networkKey, privateKey.toString("hex"))  
				}

				cb(null, account);

			}
	  });

    },

	storeAccount: function(obj, cb){

		var self = this;

		fs.pathExists(file, (err, exists) => {

		  if(err) { cb(err); } else {

			  var accounts= {}
		      var file = self.path+"/"+self.file;

			  if(exists == true) {

				accounts = require(file);

			  }

			  accounts[obj.pubk] = obj;

			  fs.writeFile(file, JSON.stringify(accounts), "utf8", function(err, s){

				if(err) { cb(err); } else {

					cb(null, obj);

				}

			  });

		  }

		});

	},

	createAccount: function(cb) {

		var self = this;

		self.createAddress(function(err, account){

			if(err) { cb(err); } else {
				
				self.storeAccount(account, cb);

			}

		});

	}, 

    importAccount: function(){

    },

    getAccounts: function() {


    },

    removeAccount: function() {


    }

}

module.exports = Account;
