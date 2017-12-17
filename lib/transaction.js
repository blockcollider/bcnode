
var string = require('./utils/strings.js');
var Promise = require("./lib/promise.js");


function Transaction(opts) {

    // type 01 : coinbase transaction used in miner reward payment
    // type 02 : transfer transaction used for NRG credit/debit 
    // type 03 : callback transaction used for NRG-callbacks
    // type 05 : promise transaction used for multi-chain promises
    // type 66 : bleed transaction code 
    // type 88 : emblem transaction used for EMBLEM credit/debit 
    // type 99 : private chain transaction type 

    var self = this;
    var options = {}

    if(opts != undefined){

        Object.keys(opts).map(function(k){
            options[k] = opts[k];
        });

    }

    Object.keys(options).map(function(k){
        self[k] = options[k];
    });

}

Transaction.prototype = {

    sendNRG: function(){

    },

    sendEmblems: function(){

    },

    createCallback: function(tx, chain, opts){

        /* Create/update Bore Lock 
         *  
         * @Object tx: presigned chain transction, compiler meta data 
         * @Object chain: cross-compiler meta data
         *
         * */

        var options = {
            schnorr: true
        }

        if(opts != undefined){
            Object.keys(opt).map(function(k){
                options[k] = opts[k];
            });
        }


    },

    createPromise: function(compiler, data, expireBlock){

        var self = this;

        // TODO: Add default 1000 blocks to chain
        if(!expireBlock){
           expireBlock = 400380; 
        }

        var promise = new Promise({
            expire: expireBlock,
            compiler: compiler,
            data: data
        }).on(data).sign();

        return promise;

    },

    createHash: function(){

        var self = this;

        var set = [
            self.type,
            self.nonce,
            self.distance,
            self.value,
            self.fee,
            self.compiler,
            self.from,
            self.to,
            self.input,
            self.trust
        ]

        var set = set.filter(function(a){

            if(a != undefined){
                return a;
            }

        });

        var ts = set.join("");

        self.hash = string.blake2bl(ts);

        return self;

    },

    addSignature: function(privKey){

    }

}

module.exports = Transaction;

