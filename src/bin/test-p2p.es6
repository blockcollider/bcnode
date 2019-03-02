/* eslint-disable */
const net = require('net')
const { randomBytes } = require('crypto')

const varint = require('varint')
const framer = require('frame-stream')
const StreamSkip = require('stream-skip')
const bufferSplit = require('buffer-split')
const debug = require('debug')('client')

const { encodeMessageToWire, encodeTypeAndData } = require('../p2p/codec')
const { MESSAGES, MSG_SEPARATOR } = require('../p2p/protocol')
const { BcBlock, Transaction } = require('../protos/core_pb')

process.env.BC_LOG = 'error'
process.env.BC_DEBUG = true

process.on('unhandledRejection', (e) => {
  console.error(e.stack)
});

const FRAMING_OPTS = {
  lengthSize: 4,
  getLength: function (buffer) {
    return buffer.readUInt32BE(0)
  },
  maxSize: 2 * 1024 * 1024 // 2MB
}

var client = net.createConnection({
  host: '165.227.135.80',
  port: 36061
}, () => {
  var msg = encodeTypeAndData(MESSAGES.GET_MULTIVERSE, [2, 10])
  var payload = encodeMessageToWire(msg)

  var id = randomBytes(32)
  var b = Buffer.allocUnsafe(1)
  varint.encode(id.length, b)
  client.write(Buffer.concat([b, id]))
  client.write(payload)
})

client
  .pipe(new StreamSkip({ skip: 33 })) // let's skip discovery-swarm handshake
  .pipe(framer.decode(FRAMING_OPTS))
  .on('data', (data) => {
  const type = data.slice(0, 7).toString('ascii')
  const parts = bufferSplit(data, Buffer.from(MSG_SEPARATOR[type]))
  const [, ...protos] = parts
  for (const raw of protos) {
    if (type === MESSAGES.TX || type === MESSAGES.TXS) {
      const t = Transaction.deserializeBinary(raw)
      debug(`Transaction ${b.getHash()}`)
    } else {
      const b = BcBlock.deserializeBinary(raw)
      debug(`Block #${b.getHeight()} ${b.getHash()}`)
    }
  }
})
