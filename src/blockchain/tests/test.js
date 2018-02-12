
const genesisSettings = require("../../config/genesis_settings.json");
const util = require('../../utils/util');
const crypto = require("crypto");
const consensus = require('../../protocol/consensus');
const encoding = require('../../utils/encoding');
const Logger = require('../../node/logger');
const TX = require('../../primitives/tx');
const Block = require('../../primitives/block');
const Script = require('../../script/script');
const Output = require("../../primitives/output");
const SubOutput = require("../../primitives/suboutput");
const SubStack = require("../../primitives/substack");
const Miner = require("../../mining/miner");

const Network = require("../../protocol/network");
const Chain = require("../../blockchain/chain");

const logger = new Logger();

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

  const tx = new TX({
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

  block.txs.push(tx);

  const mr = block.createMerkleRoot();

  block.merkleRoot = block.createMerkleRoot("hex");

  return block;

}

const main = createBlock({
  version: 1,
  //time: 1231006505,
  time: 1516951286,
  bits: 486604799,
  nonce: 2083236893
});


const network = Network.get("main");

const chain = new Chain({ 
    db: 'memory',
    logger: logger,
    network: network, 
    location: "/Users/mtxodus1/Documents/GitHub/bcnode/lib/blockchain/tests"  
}); 

const miner = new Miner({
  chain,
  version: 4
});

const cpu = miner.cpu;

async function handle(req, res) {

    try {

        await miner.open();
        const job = await miner.createJob();
        const block = await job.mineAsync();
        await chain.open();
        await chain.add(block);
        //const block = await cpu.mineBlock(main);
        res(block);

    } catch (err) {
        req(err);
    }

}

try { 

    handle(function(err){
        console.log(err);
    }, function(block){
        console.log(block); 
    });


} catch (err) { 
    console.trace(err);

}


