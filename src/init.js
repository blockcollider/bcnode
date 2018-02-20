const Lock = require('./lock.js')
const Log = require('./log.js')

global._BlockColliderVersion = '0.0.1'
global.log = new Log()
global._GenesisPath = './genesis.json'

const log = global.log
const path = require('path' + '') // make browserify skip it
const fs = require('fs')
const async = require('async')
const Identity = require('./identity.js')
const Network = require('./network.js')
const RoverBase = require('./rovers/base.js')
const RoverBaseGUI = require('./browser/roverbase/server.js')
const Storage = require('./storage.js')
const colors = require('colors')

function getColor (tag) {
  if (tag == 'wav') return colors.bgCyan(tag)

  if (tag == 'lsk') return colors.bgRed(tag)

  if (tag == 'eth') return colors.bgMagenta(tag)

  if (tag == 'btc') return colors.bgYellow(tag)

  if (tag == 'neo') return colors.bgGreen(tag)
}

function readFile () {
  try {
    return require(global._GenesisPath)
  } catch (err) {
    log.error('unable to parse GENESIS file ' + global._GenesisPath)
  }
}

module.exports = function main (opts) {
  var identity = new Identity()

  identity.load(function (err, data) {
    if (err) {
      log.error(err)
      process.exit(3)
    } else {
      log.info('identity setup complete')

      global._BlockColliderIdentity = identity

      var network = new Network()

      var base = new RoverBase()

      network.setup(function () {
        var networkInterfaces = network.connect()

        var dht = networkInterfaces.dht

        var p2p = networkInterfaces.p2p

        var storage = new Storage()

        var blockQueue = async.queue(function (msg, cb) {
          storage.addBlock(msg, cb)
        })

        storage.init(function () {
          if (opts.norovers) {
            log.warn('startup configuration deploys no rovers')
          } else if (opts.rovers != undefined) {
            for (var i = 0; i < opts.rovers.length; i++) {
              base.launchRover(opts.rovers[i])
            }
          } else {
            base.launchRover('btc')
            base.launchRover('eth')
            base.launchRover('neo')
            base.launchRover('wav')
          }

          /* In Development */
          // base.launchRover("lsk");

          /* Rover Base Monitor GUI */
          if (opts.roverbase) {
            RoverBaseGUI({})
          }

          /* Rover Base Events */
          base.events.on('pow', function (msg) {
            console.log('--------------POW---------------')
            console.log(msg)
          })

          base.events.on('metric', function (msg) {
            console.log('--------------METRIC---------------')
            console.log(msg)
          })

          base.events.on('log', function (msg) {
            console.log(msg)
          })

          base.events.on('info', function (msg) {
            console.log(msg)
          })

          base.events.on('block', function (msg) {
            blockQueue.push(msg, function (err, msg) {
              if (err) {
                log.error(err)
              } else {
                // elselog.info("new "+getColor(msg.id)+" block "+msg.data.blockNumber+" TXs "+msg.data.transactions.length);
                log.info(
                  'new ' + getColor(msg.id) + ' block ' + msg.data.blockNumber
                )
              }
            })
          })

          /* Storage Events */
          storage.events.on('blockadded', function (block) {
            dht.quasarPublish('block', block)
          })

          /* DHT Events */
          dht.subscribe('block', function (block) {
            storage.addBlock(block, function (err, s) {
              if (err) {
                log.error(err)
              } else {
              }
            })
          })

          dht.subscribe('tx', function (tx) {
            storage.addBlockTransaction(tx)
          })
        })
      })
    }
  })
}
