const path = require('path')
const express = require('express')
const serveIndex = require('serve-index')
const socketIo = require('socket.io')
const logger = require('../logger').logger

const assetsDir = path.resolve(__dirname, '..', '..', 'assets')

// See http://www.programwitherik.com/getting-started-with-socket-io-node-js-and-express/
export default class Server {
  constructor () {
    this._app = null
    this._io = null
    this._server = null
  }

  get app () {
    return this._app
  }

  get io () {
    return this._io
  }

  get server () {
    return this._server
  }

  run () {
    logger.info('Starting Server for Web UI')

    // Create express app instance
    const app = (this._app = express())

    // Create http server
    const server = (this._server = require('http').Server(this.app))

    // TODO: Init websocket only if requested
    const io = (this._io = socketIo(this.server, {
      path: '/ws'
    }))

    io.on('connection', client => {
      logger.info('Client connected', client.handshake.address)

      client.on('join', function (data) {
        logger.log(data)
      })

      client.on('disconnect', reason => {
        logger.info(
          'Client disconnected',
          client.request.connection.remoteAddress
        )
      })
    })

    // Routes
    this.app.post('/rpc', (req, res) => {
      res.json({
        msg: 'Not implemented yet!'
      })
    })

    // Serve static content
    app.use(
      express.static(assetsDir),
      serveIndex(assetsDir, {
        icons: true
      })
    )

    // Listen for connections
    const port = 3000
    server.listen(port, () => {
      logger.info(`Server available at http://0.0.0.0:${port}`)
    })
  }
}
