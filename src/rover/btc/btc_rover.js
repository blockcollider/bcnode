const Log = require('../log.js')
const _ = require('lodash')
const buffer = require('buffer')
const string = require('../utils/strings.js')

const crypto = require('crypto')
const Pool = require('bitcore-p2p').Pool
const Messages = require('bitcore-p2p').Messages
const Networks = require('bitcore-lib').Networks
const PrivateKey = require('bitcore-lib').PrivateKey
const LRUCache = require('lru-cache')
const Transaction = require('btc-transaction').Transaction
const convBin = require('binstring')
const big = require('big.js')

const txCache = new LRUCache({ max: 3000 })
const blocksCache = new LRUCache({ max: 110 })
const blocksNumber = new LRUCache({ max: 110 })
const async = require('async')

const log = new Log()

const MARKED_BTC_REGEX = []
const ID = 'btc'
const DEFAULT_TYPE = 'log'
const BLOCK_VERSION = 536870912

process.on('disconnect', function () {
  console.log('parent exited')
  process.exit()
})

process.on('uncaughtError', function (e) {
  console.trace(e)
  console.trace('critical error ' + ID + ' rover, exiting...')
  process.exit(3)
})

function send (type, data) {
  var d
  var t

  if (data == undefined) {
    t = DEFAULT_TYPE
    d = type
  } else {
    t = type
    d = data
  }

  var meta = {
    id: ID,
    type: t,
    data: d
  }

  process.send(meta)
}

function transmitRoverBlock (block) {
  var coinbaseTransaction = false

  var obj = {}

  obj.blockNumber = block.blockNumber
  obj.prevHash = string.swapOrder(block.header.prevHash.toString('hex'))
  obj.blockHash = block.header.hash
  obj.root = block.header.merkleRoot
  obj.timestamp = block.header.time
  obj.nonce = block.header.nonce
  obj.version = block.header.version
  obj.difficulty = block.header.getDifficulty()
  obj.transactions = block.transactions.reduce(function (all, t) {
    var tx = {
      txHash: t.hash,
      // inputs: t.inputs,
      // outputs: t.outputs,
      marked: false
    }

    all.push(tx)

    return all
  }, [])

  send('block', obj)
}

function getPrivateKey () {
  return crypto.randomBytes(32)
}

var handleTx = function (tx) {
  async.reduce(
    tx.outputs,
    {
      utxos: new Array(),
      keys: new Array(),
      amount: 0,
      n: 0
    },
    function (memo, out, next) {
      if (out.script.isPublicKeyHashOut()) {
        /// /db.get(out.script.toAddress(), function (err, result) {
        /// /  if (!(err)) {
        //    var key = new PrivateKey(result);
        //    memo.keys.push(key);
        //    var utxo = new Transaction.UnspentOutput({
        //      "txid" : tx.transaction.id,
        //      "vout" : memo.n,
        //      "address" : out.script.toAddress(),
        //      "script" : out.script,
        //      "satoshis" : out.satoshis,
        //      "output" : out
        //    });
        //    memo.utxos.push(utxo);
        //    memo.amount += out.satoshis;
        /// /  };
        //  memo.n++;
        //  next(null, memo);
        /// /});
      }
    },
    function (err, results) {}
  )
}

function onNewTx (tx, block) {
  if (txCache.has(tx.hash)) return

  txCache.set(tx.hash, true)

  if (tx.isCoinbase() == true) {
  }

  // handleTx(tx);
}

function onNewBlock (height, block, cb) {
  var hash = block.header.hash
  var timestamp = block.header.time

  if (blocksCache.has(hash)) return

  blocksCache.set(hash, true)

  var cbTx = block.transactions[0]

  var buf = convBin(cbTx.toString('hex'), { in: 'hex', out: 'buffer' })

  var coinbaseTx = Transaction.deserialize(buf)

  var blockNumber = coinbaseTx.ins[0].script.getBlockHeight()

  if (blocksNumber.has(blockNumber) == true) {
    log.warn('possible orphan conflict:  ' + blockNumber + ' ' + hash)
  } else {
    blocksNumber.set(blockNumber, true)
  }

  for (let tx of block.transactions) onNewTx(tx, block)

  block.blockNumber = blockNumber

  // if(blockNumber != undefined && isNaN(Number(blockNumber)) == false){

  var n = Number(blockNumber) - 1

  // if(big(n).eq(block.lastBlock) == true){

  transmitRoverBlock(block)

  /// }

  // }

  cb(null, blockNumber)
}





process.on('message', function (msg) {
  var args = []
  var func = ''

  if (msg.func != undefined) {
    func = msg.func

    if (msg.args != undefined) {
      args = msg.args
    }

    if (Controller[msg.func] != undefined) {
      Controller[func].apply(this, args)
    }
  }
})
