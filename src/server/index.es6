const path = require('path')
const express = require('express')
const serveIndex = require('serve-index')
const socketIo = require('socket.io')
const logging = require('../logger')

const config = require('../../config/config')

const assetsDir = path.resolve(__dirname, '..', '..', 'assets')

// See http://www.programwitherik.com/getting-started-with-socket-io-node-js-and-express/
export default class Server {
  constructor () {
    this._opts = null
    this._app = null
    this._io = null
    this._server = null
    this._logger = logging.getLogger(__filename)
  }

  get app () {
    return this._app
  }

  get io () {
    return this._io
  }

  get opts () {
    return this._opts
  }

  get server () {
    return this._server
  }

  run (opts) {
    this._opts = opts

    this._logger.info('Starting Server for Web UI')

    // Create express app instance
    this._app = express()

    // Create http server
    const server = (this._server = require('http').Server(this.app))

    if (this.opts.ws) {
      this.initWebSocket()
    }

    if (this.opts.rpc) {
      this.initRpc()
    }

    if (this.opts.ui) {
      this.initUi()
    }

    // Listen for connections
    const port = config.server.port
    server.listen(port, () => {
      this._logger.info(`Server available at http://0.0.0.0:${port}`)
    })
  }

  initWebSocket () {
    const io = (this._io = socketIo(this.server, {
      path: '/ws'
    }))

    io.on('connection', client => {
      this._logger.info('Client connected', client.handshake.address)

      client.emit({
        msg: 'test'
      })

      client.on('join', function (data) {
        this._logger.log(data)
      })

      client.on('disconnect', reason => {
        this._logger.info(
          'Client disconnected',
          client.request.connection.remoteAddress
        )
      })
    })
  }

  initRpc () {
    this.app.post('/rpc', (req, res) => {
      res.json({
        msg: 'Not implemented yet!'
      })
    })
  }

  initUi () {
    // Serve static content
    this.app.use(
      express.static(assetsDir),
      serveIndex(assetsDir, {
        icons: true
      })
    )
  }
}
