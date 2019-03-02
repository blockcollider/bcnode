'use strict';

const genesisSettings = require("../config/genesis_settings.json");
const util = require('../utils/util');
const consensus = require('../protocol/consensus');
const encoding = require('../utils/encoding');
const TX = require('../primitives/tx');
const Block = require('../primitives/block');
const Script = require('../script/script');

function createGenesisBlock(options) {
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
      script: Script.fromPubkey(key)
  }

  const tx = new TX({
    version: 1,
    inputs: [coinbaseInput],
    outputs: [genesisOutput],
    locktime: 0
  });

  const block = new Block({
    version: options.version,
    prevBlock: encoding.NULL_HASH,
    merkleRoot: tx.hash('hex'),
    time: options.time,
    bits: options.bits,
    nonce: options.nonce,
    height: 0
  });

  console.log("hello");
  block.txs.push(tx);

  return block;
}

const main = createGenesisBlock({
  version: 1,
  time: 1231006505,
  bits: 486604799,
  nonce: 2083236893
});

const testnet = createGenesisBlock({
  version: 1,
  time: 1296688602,
  bits: 486604799,
  nonce: 414098458
});

const regtest = createGenesisBlock({
  version: 1,
  time: 1296688602,
  bits: 545259519,
  nonce: 2
});

const segnet3 = createGenesisBlock({
  version: 1,
  time: 1452831101,
  bits: 486604799,
  nonce: 0
});

const segnet4 = createGenesisBlock({
  version: 1,
  time: 1452831101,
  bits: 503447551,
  nonce: 0
});

const btcd = createGenesisBlock({
  version: 1,
  time: 1401292357,
  bits: 545259519,
  nonce: 2
});

//util.log(main);
//util.log('');
//util.log('main hash: %s', main.rhash());
//util.log('main raw: %s', main.toRaw().toString('hex'));
//util.log('');

