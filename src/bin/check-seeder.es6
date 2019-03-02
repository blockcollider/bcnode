const crypto = require('crypto')
const { inspect } = require('util')
const Client = require('bittorrent-tracker')
const debug = require('debug')('bcnode:check-seeder')

const nodeId = crypto.createHash('sha1').update(crypto.randomBytes(32).toString('hex')).digest('hex')
const seederOptions = {
  infoHash: 'fc0259ff8af753962e94c6d6945f525d33d87802',
  // infoHash: '68cb1ee15af08755204674752ef9aee13db93bb7',
  peerId: nodeId,
  port: 36060,
  announce: ['udp://tds-r3.blockcollider.org:16060/announce'],
  quiet: false,
  log: true
}

const dhtClient = new Client(seederOptions)

dhtClient.on('error', (err) => {
  debug(err.message)
})

dhtClient.on('warning', function (err) {
  debug(err.message)
})

dhtClient.on('peer', (peer) => {
  debug(inspect(peer))
})

dhtClient.on('update', function (data) {
  debug('got an announce response from tracker: ' + data.announce)
  debug('number of seeders in the swarm: ' + data.complete)
  debug('number of leechers in the swarm: ' + data.incomplete)
})

const refreshWindow = 10023
setInterval(() => {
  try {
    dhtClient.update()
  } catch (err) {
    debug(err.message)
  }
}, refreshWindow)

dhtClient.start()
