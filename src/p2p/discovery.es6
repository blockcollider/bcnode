const Client = require('bittorrent-tracker')
const swarm = require('discovery-swarm')
const { networks } = require('../config/networks')
const seederBootstrap = require('../utils/templates/collocation.json')
const dhtBootstrap = require('../utils/templates/bootstrap')
let seeds = seederBootstrap
const logging = require('../logger')
const BC_NETWORK: 'main'|'test' = process.env.BC_NETWORK || 'main'

function random (range) {
  return Math.floor(Math.random() * range)
}

// function randomId () {
//  return crypto.randomBytes(20)
// }
// function randomIndex (items, last) {
//  const d = items[Math.floor(Math.random() * items.length)]
//  if (last !== undefined && last === d) {
//    return randomIndex(items, last)
//  }
//  return d
// }

function Discovery (nodeId) {
  // bootstrap from two randomly selected nodes

  if (process.env.MIN_HEALH_NETWORK === 'true') {
    seeds = seederBootstrap
  }

  if (process.env.BC_SEED_FILE !== undefined) {
    seeds = require(process.env.BC_SEED_FILE)
  }

  if (process.env.BC_SEED !== undefined) {
    let seed = process.env.BC_SEED
    if (seed.indexOf(',') > -1) {
      seed = seed.split(',')
      seeds = seeds.concat(seed)
    } else {
      seeds.unshift(seed)
    }
  }

  const { infoHash, portBase, maximumWaypoints } = networks[BC_NETWORK]
  const maxConnections = process.env.BC_MAX_CONNECTIONS || maximumWaypoints
  const seederPort = process.env.BC_SEEDER_PORT || portBase
  const port = process.env.BC_DISCOVERY_PORT || portBase + 1
  this.options = {
    maxConnections: maxConnections,
    port: port,
    utp: process.env.BC_DISCOVERY_UTP || true,
    tcp: process.env.BC_DISCOVERY_TCP || true,
    dns: process.env.BC_DISCOVERY_MDNS === 'true',
    dht: {
      bootstrap: dhtBootstrap,
      interval: 19000 + random(1000),
      maxConnections: maxConnections,
      concurrency: maxConnections
    }
  }
  this.streamOptions = {
    infoHash: infoHash,
    peerId: nodeId,
    port: seederPort,
    announce: seeds,
    quiet: true,
    log: false
  }
  this.port = port
  this.seederPort = seederPort
  this.nodeId = nodeId
  this._logger = logging.getLogger(__filename)
  this._logger.info('assigned edge <- ' + infoHash)
  this._logger.info(`nodeId ${nodeId}`)
  this.hash = infoHash
}

Discovery.prototype = {
  seeder: function () {
    const self = this
    const client = new Client(self.streamOptions)
    const refreshWindow = 10000 + random(50000)

    client.on('error', (err) => {
      self._logger.error(err.message)
    })

    client.on('warning', function (err) {
      self._logger.warn(err.message)
    })

    setInterval(() => {
      try {
        client.update()
      } catch (err) {
        this._logger.warn(err.message)
      }
    }, refreshWindow)

    return client
  },

  start: function () {
    this._logger.info('initializing far reach discovery from ' + this.port + '@' + this.hash)
    this.dht = swarm(this.options)
    this.dht.hash = this.hash
    this.dht.port = this.port
    this.dht.listen(this.port)

    this.dht.qbroadcast = async (msg, filters) => {
      const warnings = []
      if (filters === undefined) {
        filters = []
      }
      for (const conn of this.dht.connections) {
        const idr = conn.remoteHost || conn.host
        this._logger.info('announce <- ' + idr)
        if (filters.indexOf(idr) < 0) {
          const res = await this.dht.qsend(conn, msg)
          if (!res || res.success === false) {
            warnings.push(res)
          }
        }
      }
      return warnings
    }
    return this.dht
  },

  stop: function () {
    this.dht.leave(this.hash)
  }
}

module.exports = Discovery
