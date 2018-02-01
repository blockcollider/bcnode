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

const events = new Events();

function createBlock(options) {
  let flags = options.flags;
  let key = options.key;
  let reward = options.reward;

  if (!flags) {
    flags = Buffer.from(genesisSettings.data, 'ascii');
  }

  if (!key) {
    key = Buffer.from(''
      + '04678afdb0fe5548271967f1a67130b7105cd6a828e039'
      + '09a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c3'
      + '84df7ba0b8d578a4c702b6bf11d5f', 'hex');
  }

  if (!reward)
    reward = 66 * consensus.COIN;

  const hash = crypto.createHash("sha256").update("test").digest("hex");

  const suboutput = new SubOutput();
        suboutput.script.pushSym("HASH160");

  const coinbaseInput = {
      prevout: {
        hash: encoding.NULL_HASH,
        index: 0xffffffff
      },
      script: Script()
        .pushInt(486604799)
        .pushPush(Buffer.from([4]))
        .pushData(flags)
        .compile(),
      sequence: 0xffffffff
    }

  const genesisOutput = {
      value: reward,
      script: Script.fromPubkey(key),
      stack: new SubStack()
  }

  const tx1 = new TX({
    version: 1,
    inputs: [coinbaseInput],
    outputs: [genesisOutput],
    locktime: 0
  });

  genesisOutput.stack.addOutput(suboutput);

  genesisOutput.stack.addInput({
      prevout: {
        hash: encoding.NULL_HASH,
        index: 0xffffffff
      },
      script: new Script(),
      sequence: 0xffffffff
  });

  const block = new Block({
    version: options.version,
    prevBlock: encoding.NULL_HASH,
    //merkleRoot: encoding.NULL_HASH,
    time: options.time,
    bits: options.bits,
    nonce: options.nonce,
    height: 0
  });

  block.txs.push(tx1);

  const mr = block.createMerkleRoot();

             block.merkleRoot = block.createMerkleRoot("hex");

  return block;

}

const main = createBlock({
  version: 1,
  time: 1231006505,
  bits: 486604799,
  nonce: 2083236893
});

//util.log(main);


function Miner(id, chains){
    this.chains = {};
    this.pending = [];
    this.events = events;
    this.cycle = 0;
    this.id = id;
    this.delayed = false;
    this.pos = pos.create(5000, function message() {
        events.emit("mine", id);
    })
    this.delay = pos.create(15000, function message() {
        events.emit("delay", id);
        var r = Math.floor(pos.sample(15000));
        setTimeout(function(){
           events.emit("faster", id); 
        }, r);
    })
}

Miner.prototype.nextCycle = function nextCycle(){
    this.cycle++;
}

Miner.prototype.addBlock = function addBlock(block){

    var chain = block.chain;
    var hash = block.hash;
    var height = block.height;

    if(this.chains[chain] == undefined){
        this.chains[chain] = {
            height: 0,
            blocks: [hash],
        }
    } else {

        if(this.delayed == true){
            this.pending.push(block);
        } else {

            if(this.chains[chain].blocks[0] != hash && this.chains[chain].blocks.length + 1 == block.height){

                this.chains[chain].blocks.unshift(block);
                this.chains[chain].height = this.chains[chain].blocks.length;

            } else if(this.chains[chain].blocks.length != block.height){

                this.pending.push(block);

                if(this.pending.length > 1){
                     var b = this.pending.shift()
                     this.addBlock(b);
                }

            }

        }

    }
}

function Chain(id){
    this.events = events;
    this.cycle = 0;
    this.id = id;
    this.blocks = [];
    this.pos = pos.create(1000, function message() {
        events.emit("block", id);
    })
}


function Simulation(opts){

    this.cycles = opts.cycles;
    this.miners = opts.miners;
    this.chains = opts.chains;

}


Simulation.prototype.run = function run(){

   var self = this; 
   var miners = [];
   var chains = [];
   var c = 0;

   for(var i = 0; i<self.chains; i++){
       chains.push(new Chain(i));
   }

   for(var i = 0; i<self.miners; i++){
       miners.push(new Miner(i, chains));
   }
    
   for(var i = 0; i<self.miners; i++){
       miners[i].pos.start();
       miners[i].delay.start();
   }

   for(var i = 0; i<self.chains; i++){
       chains[i].pos.start();
   }

   events.on("block", function(data){

       var id = data;
       var b = crypto.createHash("sha1").update(String(Math.random())).digest("hex")

       chains[id].blocks.push(b)

       var block = {
           hash: b, 
           height: chains[id].blocks.length,
           chain: id
       }

       console.log("new block from chain: "+data);

       for(var i = 0; i<self.miners; i++){
           miners[i].addBlock(block);
       }

   });

   events.on("mine", function(data){
       console.log("miner "+data+" found block");

       var s = "";
       miners.map(function(a){

           if(a.chains["1"] != undefined){
                s = s + " miner: "+a.id +":" +a.chains["1"].height
           }

           console.log(s);
       });

       if(miners[data].pending.length > 0){

           miners[data].pending.forEach(function(a){
                miners[data].addBlock(a);
           });

           miners[data].pending = [];

       }
   });

   events.on("delay", function(data){
       miners[data].delayed = true;
       console.log("miner "+data+" DELAYED");
   });
  
   events.on("faster", function(data){
       miners[data].delayed = false;

       if(miners[data].pending.length > 0){
            var b = miners[data].pending.shift()
            console.log(b);
            miners[data].addBlock(b);
       }

       console.log("miner "+data+" FASTER");

   });

}


var sim = new Simulation({
    chains: 6,
    miners: 5,
    cycles: 600
});

sim.run();



//util.log('');
//util.log('main hash: %s', main.rhash());
//util.log('main raw: %s', main.toRaw().toString('hex'));
//util.log('');



//const testnet = createGenesisBlock({
//  version: 1,
//  time: 1296688602,
//  bits: 486604799,
//  nonce: 414098458
//});
//
//const regtest = createGenesisBlock({
//  version: 1,
//  time: 1296688602,
//  bits: 545259519,
//  nonce: 2
//});
//
//const segnet3 = createGenesisBlock({
//  version: 1,
//  time: 1452831101,
//  bits: 486604799,
//  nonce: 0
//});
//
//const segnet4 = createGenesisBlock({
//  version: 1,
//  time: 1452831101,
//  bits: 503447551,
//  nonce: 0
//});
//
//const btcd = createGenesisBlock({
//  version: 1,
//  time: 1401292357,
//  bits: 545259519,
//  nonce: 2
//});


