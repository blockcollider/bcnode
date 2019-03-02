var { Peer, Messages } = require('bitcore-p2p')
var ms = require('ms')

var args = process.argv.slice(2)

if (args.length !== 2) {
  console.log('Invoke as node get-btc-block.js peerip:peerport hashPreviousToTheWantedBlock')
  process.exit(1)
}

var [peerInfo, hash] = args
var [peerIp, peerPort] = peerInfo.split(':')

var peer = new Peer({ host: peerIp, port: peerPort })
const BTC_GENESIS_HASH = '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f'

let disconnectTimeout

// peer.on('headers', (msg) => {
//   console.log(msg.headers)
//   const firstHeader = msg.headers[0]
//   const lastHeader = msg.headers[msg.headers.length - 1]
//   console.log(`F: ${firstHeader.hash}, ${firstHeader.blockNumber}, L: ${lastHeader.hash}, ${lastHeader.blockNumber}`)
//   var peerMsg = new Messages().GetBlocks({ starts: [firstHeader.hash], stop: firstHeader.previousHash })
//   peer.sendMessage(peerMsg)
//   clearTimeout(disconnectTimeout)
//   disconnectTimeout = setTimeout(() => peer.disconnect(), ms('10s'))
// })
peer.on('block', (msg) => console.log(msg.block))
peer.on('inv', (msg) => {
  var peerMsg = new Messages().GetData(msg.inventory)
  peer.sendMessage(peerMsg)
  clearTimeout(disconnectTimeout)
  disconnectTimeout = setTimeout(() => peer.disconnect(), ms('10s'))
})

peer.on('ready', () => {
  var msg = new Messages().GetBlocks({ starts: [hash], stop: BTC_GENESIS_HASH })

  peer.sendMessage(msg)
  disconnectTimeout = setTimeout(() => peer.disconnect(), ms('10s'))
})

peer.connect()
