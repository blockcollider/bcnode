const child = require('child_process')
const time = require('../utils/time.js')
const EventEmitter = require('events').EventEmitter
const socket = require('socket.io')(6600)
const logger = require('../logger').logger;

let timeOffset = 0

global._RoverRestartDelay = 5000

socket.on('connection', function (client) {
  var id = global._BlockColliderIdentity
  var connId = client.conn.id

  var base = {
    publicKey: id.colliderBase.publicKey,
    address: id.colliderBase.address
  }

  function broadcast (type, msg) {
    if (global.disableBroadcast) return

    let data = {
      type: type,
      body: msg,
      timestamp: new Date()
    }

    client.emit('msg', data)
  }

  client.emit('setup', base)

  // events.on('block', msg => {
  //   broadcast('block', msg)
  // })
  //
  // events.on('tx', msg => {
  //   broadcast('tx', msg)
  // })
  //
  // events.on('pow', msg => {
  //   broadcast('pow', msg)
  // })
  //
  // events.on('metric', msg => {
  //   broadcast('metric', msg)
  // })
})

var heart = setInterval(function () {
  socket.emit('ping', timeOffset)
}, 5000)

export default class RoverBase {
  constructor (opts) {
    this._options = {
      port: 6600
    }

    if (opts) {
      Object.keys(opts).map(k => {
        this._options[k] = opts[k]
      })
    }

    this._events = new EventEmitter()

    this._running = []
  }

  get events () {
    return this._events
  }

  get options () {
    return this._options
  }

  get running () {
    return this._running
  }

  killAll () {
    self.running.map(r => {
      console.log(r)
    })
  }

  launchRover (roverId) {
    var self = this

    var running = self.running.map(function (r) {
      return r.id
    })

    if (running.indexOf(roverId) > -1) {
      logger.info('rover ' + roverId + ' already started')
    } else {
      logger.info(roverId + ' rover leaving base')

      var n = child.fork('./rovers/' + roverId + '_rover.js')
      var meta = {
        id: roverId,
        process: n
      }

      n.on('message', function (msg) {
        var type = 'log'
        var id = 'coin'
        if (msg.type != undefined) {
          type = msg.type
          msg.utc = time.now()
        }

        if (msg.id != undefined) {
          id = msg.id
        }

        socket.emit(type, msg)
        events.emit(type, msg)
      })

      n.on('exit', function () {
        var restartSeconds = global._RoverRestartDelay / 1000

        logger.info(roverId + ' exited restarting in ' + restartSeconds + 's')
        self.running = self.running.filter(function (r) {
          if (r.id != roverId) {
            return r
          }
        })

        setTimeout(function () {
          self.launchRover(roverId)
        }, global._RoverRestartDelay)
      })

      n.send({
        func: 'init',
        args: [
          {
            identity: global._BlockColliderIdentity
          }
        ]
      })

      self.running.push(meta)

      return self.events
    }
  }
}

RoverBase.updateSNTPOffset = function updateSNTPOffset() {
  time.offset((err, offset) => {
    if (err) {
      console.trace(err)
    } else {
      timeOffset = offset
    }
  })
}

RoverBase.updateSNTPOffset()
