var string = require('../utils/strings.js')
var crypto = require('crypto')
var portscanner = require('portscanner')
var Log = require('../log.js')
var ethUtils = require('ethereumjs-util')

var log = new Log()

const LRUCache = require('lru-cache')
const ms = require('ms')
const assert = require('assert')
const EthereumTx = require('ethereumjs-tx')
const EthereumBlock = require('ethereumjs-block')
const chalk = require('chalk')
const rlp = require('rlp-encoding')

const ID = 'eth'
const DEFAULT_TYPE = 'log'
const DAO_FORK_SUPPORT = true
const ETH_1920000 = '4985f5ca3d2afbec36529aa96f74de3cc10a2a4a6c44f2157a57d2c6059a11bb'

const ETH_1920000_HEADER = rlp.decode(
  Buffer.from(
    'f9020da0a218e2c611f21232d857e3c8cecdcdf1f65f25a4477f98f6f47e4063807f2308a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d4934794bcdfc35b86bedf72f0cda046a3c16829a2ef41d1a0c5e389416116e3696cce82ec4533cce33efccb24ce245ae9546a4b8f0d5e9a75a07701df8e07169452554d14aadd7bfa256d4a1d0355c1d174ab373e3e2d0a3743a026cf9d9422e9dd95aedc7914db690b92bab6902f5221d62694a2fa5d065f534bb90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008638c3bf2616aa831d4c008347e7c08301482084578f7aa88d64616f2d686172642d666f726ba05b5acbf4bf305f948bd7be176047b20623e1417f75597341a059729165b9239788bede87201de42426',
    'hex'
  )
)
const ETC_1920000 = '94365e3a8c0b35089c1d1195081fe7489b528a84b22199c916180db8b28ade7f'

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

function stringToInt (str) {
  var a = Buffer(str.slice(2, str.length + 1), 'hex')
  var b = ethUtils.bufferToInt(a)

  return b
}

function transmitRoverBlock (block) {
  var d = block.toJSON({ labeled: true })

  var obj = {}

  obj.blockNumber = parseInt(d.header.number, 16)
  obj.prevHash = d.header.parentHash
  obj.blockHash = '0x' + block.hash().toString('hex')
  obj.root = d.header.stateRoot
  obj.nonce = parseInt(d.header.nonce, 16)
  obj.timestamp = parseInt(d.header.timestamp, 16)
  obj.difficulty = parseInt(d.header.difficulty, 16)
  obj.coinbase = d.header.coinbase
  obj.marked = false
  obj.transactions = d.transactions.map(function (t) {
    var tx = new EthereumTx(t)
    // var v = ethUtils.bufferToInt(t.v)
    // var e = ethUtils.ecrecover(tx.hash(true), v, t.r, t.s).toString("hex");

    t.txHash = ethUtils.bufferToHex(tx.hash(true))

    return t
  })

  send('block', obj)
}

function isOpenPort (host, port, cb) {
  portscanner.checkPortStatus(8545, host, cb)
}

Network.prototype = {
  close: function () {
    var self = this

    try {
      send('log', 'disconnecting ' + ID + ' rover')

      self.dpt.stop()

      process.exit()
    } catch (err) {
      log.error(err)

      send('error', err)
    }
  }
}

process.on('uncaughtError', function (e) {
  console.trace(e)
  console.trace('critical error ETH rover, exiting...')
  process.exit(3)
})

process.on('message', function (msg) {
  var args = []
  var func = ''

  if (msg.func != undefined) {
    func = msg.func

    if (msg.args != undefined) {
      args = msg.args
    }

    if (Controller[msg.func] != undefined) {
      Controller[func].call(args)
    }
  }
})
