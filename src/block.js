
var moment = require('moment');
var _ = require('lodash');
var big = require('big.js');
var string = require('./utils/strings.js');
var Crypt = require("./crypt.js");
var Transaction = require("./transaction.js");
var log;

var crypt = new Crypt();

var privKey = crypt.createSecPrivateKey(); 

process.on("uncaughtError", function(err){

    if(err) { console.trace(err); } else {

       console.log("exit"); 
    }

});

if(global.log == undefined){
    var Log = require("./log.js");
    log = new Log(); 
} else {
    log = global.log;
}

if(global._MinerReward == undefined){
    global._MinerReward = 6;
}

if(global._TxTypeFilter == undefined){
    global._TxTypeFiler = [1]; // filter out coinbase transactions from the merkle tree
}

if(global._TxMinerRewardPerc == undefined){
    global._TxMinerRewardPerc = 0.7;
}

if(global._EmblemIntersectMultiplier == undefined){
    global._EmblemIntersectMultiplier = function(emblems, range){

    function log(b, n) {  
        return Math.log(n) / Math.log(b);  
    }  

  }
}


function Block(opts) {

    var self = this;
    var options = {
        preBonusDistance: 0.71,
        maxMutations: 224,
        distance: 0.71,
        range: 2200,
    emblems: 0,
        mne: 2,
        ne: 0,
        ntx: 0,
        miner: false,
    hash: false,
    sig: false,
    input: false,
    blockHash: false,
    merkleRoot: false,
        txs: [],
        blocks: []
    }

    if(opts != undefined){

        Object.keys(opts).map(function(k){
            options[k] = opts[k];
        });

    }

    Object.keys(options).map(function(k){
        self[k] = options[k];
    });

}

Block.prototype = {

  types: function(key, val){

    var dict = {
      distance: "float",
      range: "numeral",
      emblems: "float",  
      mne: "numeral",
      ne: "numeral",
      ntx: "numeral",
      miner: "string",
      hash: "string",
      sig: "string",
      input: "string",
      merkleRoot: "string",
      txs: "array",
      blocks: "array"  
    }

  },

  addEmblemDistance: function(emblems){

    var self = this;

    if(isNaN(Number(emblems)) === true){
      log.warn("unable to compute emblem balance with value: "+emblems); 
      return 0;
    }

    if(big(emblems).eq(0) == true) {
      
      return 0;

    } else {

      return big(Math.log(emblems)).times(Math.log(emblems)).toFixed(8);  

    }
    
  },

    addTransaction: function(tx){

        var self = this;

        var totalRange = self.txs.reduce(function(all, s){

            all = big(s.distance).add(all).toFixed(0);

            return all;

        }, 0);

        var rangeWithTx = big(tx.distance).add(totalRange).toFixed(0);

    var emblems = self.addEmblemDistance(self.emblems);

    var range = big(self.range).add(emblems).toFixed(0);

        if(big(rangeWithTx).lte(range) === true){
            self.txs.push(tx);
        }

        return self;

    },

    addTransactions: function(txs){

        var self = this;
            txs.map(function(tx){ self.addTransaction(tx); });
        return self;

    },

    addBlock: function(block, forceAdd){

        //  var edge = {
        //      "tag":"btc",
        //      "org":"0x231fec41c8433409b352f911bc6b34fed15ddc0ef3a2e15a98ca0365c52559b3",
        //      "n": 477727,
        //      "input": "000000000000000000d3e789d269a2cbecbf38208c5d9f2242176be02ca911f9",
        //      "ph": "0000000000000000009aa4e42f09efe4496f5e48afdc70f8d0184a7c0c504e68"
        //  }
    
        var self = this;

    var block = _.cloneDeep(block);

        var matches = self.blocks.filter(function(b){

            if(b.org == block.org || b.tag == block.tag){
                return b;
            }

        }, []);

        if(matches.length == 0){

            self.blocks.push(block);
            self.ne = self.blocks.length;

        } else {

            if(forceAdd == undefined){
                log.info("sequence "+block.tag+" exists");
          self.addMutation(block);
            } else if(forceAdd == true){
                log.info("sequence "+block.tag+" exists");
          self.addMutation(block);
            } else if(forceAdd == false){

                log.info(block.tag+" block pending network baseline");
                
                self.blocks = self.blocks.filter(function(b){
                       if(b.org != block.org && b.tag != block.tag){
                            return b; 
                       }
                });

                self.blocks.unshift(block);

            }

        }

        return self;

    },

    addMerkleRoot: function() {

        var self = this;

        var merkleRoot = self.txs.reduce(function(all, tx){

            if(all == ""){
                return tx.hash; 
            } else {
                return string.blake2bl(all+tx.hash);
            }

        }, "");


        if(merkleRoot === false || merkleRoot == undefined){
            log.error("transactions malformed, unable to set merkleRoot");
        } else {
            self.merkleRoot = merkleRoot;
        }

        return self;

    },

  addMutation: function(block){

    var self = this;

    var found = false;

    var blocks = self.blocks.map(function(e){

      if(e.org === block.org){

        found = true;

        e.n = block.n;

        //log.info(e.input);

        if(e.input.indexOf("::") > -1){

          var c = e.input.split("::").length;

          if(c > self.maxMutations){

            log.warn("maximum mutations added to block--edge is deleted.");
            //self.preBonusDistance = big(self.preBonusDistance).times(0.97).toFixed(8);
            self.distance = self.preBonusDistance; 

            log.info("distance adjusted to "+self.distance);

            return false;

          } else {

            e.input = e.input+"::"+block.input;

                self.distance = big(self.distance).times(0.99).toFixed(8);

          } 

        } else {

          e.input = e.input+"::"+block.input;

            self.distance = big(self.distance).times(0.99).toFixed(8);

        }


      } 

      return e;  

    });

    if(found == false){

      self.addBlock(block);

    } else {

      var blocksFalse = blocks.filter(function(e){

        if(e != false){
          return e;
        }

      });

      if(self.blocks.length != blocksFalse.length){

        self.blocks = blocksFalse;

        self.addBlock(block);

      } 

    }

    return self;

  },

    addSignature: function(priv){

    var self = this;

    var set = [
      self.miner,
      self.input,
      self.blockHash,
      self.merkleRoot
    ];    

    var set = string.blake2bl(set.join(""));

    self.hash = set;

    self.sig = crypt.signSec(set, priv);

    return self;

    },

    claimBlock: function(blockHash, minerPrivateKey){

        // Should be done after all transactions have been added.

        var self = this;

            if(self.miner != false) {
                log.error("miner already set for block");
                process.exit(3);
            }

    var publicKey = crypt.createSecPublicKey(minerPrivateKey);

        var minerAddress = string.privateKeyToAddress(minerPrivateKey);

        var minerICAPAddress = string.addressToIcap(minerAddress);

        var coinbaseTx = {
            "type": 1,
            "value": global._MinerReward, // NRG award in wei + 70% of fees of transactions 
            "to": minerICAPAddress, // public key
            "from": self.input,  
            "index": 1 
        }

        var set = [
            coinbaseTx.type,
            coinbaseTx.value,
            coinbaseTx.to,
            coinbaseTx.from,
            coinbaseTx.index
        ]

        coinbaseTx.hash = string.blake2bl(set.join(""));

        self.miner = publicKey;

        self.txs.unshift(coinbaseTx);

        self.txs = self.txs.map(function(tx, i){
                 tx.index = i+1;
                 return tx;
            });

        self.ntx = self.txs.length;

        self.addMerkleRoot();

    self.addSignature(minerPrivateKey)

        return self;

    },


}

module.exports = Block;

//var demo = { 
//    "version": 2,
//    "distance": 0.5, // distance threshold to be achieved by miners 
//    "range": 2200, // maximum distance of all transactions summed in block
//    "hash": "",
//    "ntx": 2, // number of transactions
//    "ne": 2, // numnber of edges
//    "mne": 2, // minimum numnber of edges
//    "miner": "0220d18aeddbf807bed67dcfbe58c171f63aa2df5a65695e6af18ca9710a662245", // public key of the miner
//    "input": "0xc8cf59fce963cc498c345f6d8869959d55fb11a6bc7092bf3a8826a94acfd3e4",  // the hash of the last block
//    "sig":"", // sig of the hash of the block by the miner
//    "proof": "", //  the string before blake2bl which is concatenated to the miner public key  
//    "merkleRoot": "",
//    "txs": [
//        //////// 
//        {
//            "type": "01",
//            "value": 2, // NRG award in wei 
//            "to": "XE5136GAE1KYDL1U9K5NDB25T4G2UXAP2U", // public key
//            "index": 1 // assigned by the miner
//        },
//        {
//            "type": "02", 
//            "nonce": 1, // assigned by the account 
//            "distance": 0.5,
//            "value": 2, // in atoms
//            "fee": 0.001,
//            "compiler": "0xc8cf59fce963cc498c345f6d8869959d55fb11a6bc7092bf3a8826a94acfd3e4",
//            "from": "0220d18aeddbf807bed67dcfbe58c171f63aa2df5a65695e6af18ca9710a662245",
//            "to": "XE5136GAE1KYDL1U9K5NDB25T4G2UXAP2U", // public key
//            "input": "", // data of the raw transaction data which when signed by black2bl is the work
//            "trust": "", // the signature approving the the transaction for the from address  
//            "sig": "", // hash of the transaction has signed by the public key of the miner 
//            "proof": "", // the raw value which when processed by blake2bl is below the dist of the work 
//            "miner": "", // the miner to recieve 20% of the transaction fee 
//            "index": 2 // assigned by the miner
//        }
//    ],
//    "edges": [
//        {
//            "tag":"eth",
//            "org":"0x2e2890dabd2353cc6adc6f39b08fe7241228c7662cca52416a8068a2b664ec7f",
//            "n": 16,
//            "input": "0xe21141a7cd65742e716f8363740b2649b68bd156c55b2304e62643d633f0d42a",
//            "ph": "0xa12638fec0100e2aa05c4d949808fbfef6540923932b190807fc88ae74831451"
//        },
//        {
//            "tag":"btc",
//            "org":"0x231fec41c8433409b352f911bc6b34fed15ddc0ef3a2e15a98ca0365c52559b3",
//            "n": 477727,
//            "input": "000000000000000000d3e789d269a2cbecbf38208c5d9f2242176be02ca911f9",
//            "ph": "0000000000000000009aa4e42f09efe4496f5e48afdc70f8d0184a7c0c504e68"
//        }
//    ]
//}

//var ethEdge = {
//  "tag":"eth",
//  "org":"0xe21141a7cd65742e716f8363740b2649b68bd156c55b2304e62643d633f0d42a",
//  "n": 16,
//  "input": "0xe21141a7cd65742e716f8363740b2649b68bd156c55b2304e62643d633f0d42a",
//  "ph": "0xa12638fec0100e2aa05c4d949808fbfef6540923932b190807fc88ae74831451"
//}
//
//var btcEdge = {
//  "tag":"btc",
//  "org":"0x231fec41c8433409b352f911bc6b34fed15ddc0ef3a2e15a98ca0365c52559b3",
//  "n": 477727,
//  "input": "000000000000000000d3e789d269a2cbecbf38208c5d9f2242176be02ca911f9",
//  "ph": "0000000000000000009aa4e42f09efe4496f5e48afdc70f8d0184a7c0c504e68"
//}
//
//var block = new Block({
//    "version": 2,
//    "distance": 0.72, 
//    "range": 2200,
//    "input": "69985e7ced6a0863bc3ecc64b6f10a2272480d3d67d194073a4716102fc20f55",
//  "proof": "nottherealproof"
//});
//
//var tx = new Transaction({
//        "type": 2,
//        "nonce": 1, 
//        "distance": 0.5,
//        "value": 2, 
//        "fee": 0.001,
//        "compiler": "0xc8cf59fce963cc498c345f6d8869959d55fb11a6bc7092bf3a8826a94acfd3e4",
//        "from": "0220d18aeddbf807bed67dcfbe58c171f63aa2df5a65695e6af18ca9710a662245",
//        "to": "XE5136GAE1KYDL1U9K5NDB25T4G2UXAP2U", // public key
//        "input": "", 
//        "trust": ""
//        //"sig": "", 
//        //"proof": "" 
//        //"miner": "",
//        //"index": 2 
//});
//
//tx.createHash();
//
//block.addBlock(ethEdge);
//block.addBlock(btcEdge);
//block.addTransaction(tx);
//block.claimBlock("prooftest", privKey);
//
//block.addMutation(ethEdge)
//   .addMutation(ethEdge);
//
//ethEdge.n = 17;
//
//block.addMutation(ethEdge);
//
//console.log(block);
//
//var valid = crypt.validSecSignature(block.hash, block.sig, block.miner);
//
//console.log("block is valid: "+valid);

//block.miner

//console.log(block);



