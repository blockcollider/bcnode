const path = require('path')

const bodyParser = require('body-parser')
const express = require('express')
const expressWinston = require('express-winston')
const responseTime = require('response-time')
const serveIndex = require('serve-index')
const socketIo = require('socket.io')

const logging = require('../logger')
const config = require('../../config/config')
const { Null } = require('../protos/core_pb')
const { RpcClient } = require('../rpc')

const assetsDir = path.resolve(__dirname, '..', '..', 'assets', 'apps')

// See http://www.programwitherik.com/getting-started-with-socket-io-node-js-and-express/
export default class Server {
  constructor () {
    this._opts = null
    this._app = null
    this._io = null
    this._rpcClient = new RpcClient()
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

  get rpcClient () {
    return this._rpcClient
  }

  get server () {
    return this._server
  }

  run (opts) {
    this._opts = opts

    this._logger.info('Starting Server for Web UI')

    // Create express app instance
    this._app = express()
    this._app.use(expressWinston.logger({ winstonInstance: this._logger }))
    this._app.use(responseTime())
    this._app.use(bodyParser.json())

    // TODO: Generate automagically
    const mapping = {
      getLatestBlocks: Null,
      help: Null
    }

    this._app.use('/rpc', jsonRpcMiddleware(mapping))

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
      // console.log('/rpc, req: ', req.body)

      const { method } = req.rpcBody

      // Handle error state as described - http://www.jsonrpc.org/specification#error_object
      if (!this.rpcClient.bc[method]) {
        return res.json({
          code: -32601,
          message: 'Method not found'
        })
      }

      const { MsgType, params, id } = req.rpcBody
      const msg = new MsgType(params)

      this.rpcClient.bc[method](msg, (err, response) => {
        if (err) {
          this._logger.error(err)

          return res.json({
            error: err
          })
        }

        res.json({
          jsonrpc: '2.0',
          result: response.toObject(),
          id
        })
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

/**
 * Converts incoming json body to rpc body using mapping provided
 *
 *  Mapping
 *
 *  ```
 *  {
 *    subtract: Object
 *  }
 *  ```
 *
 * Incoming JSON body
 *
 * ```
 * {
 *   jsonrpc: '2.0',
 *   method: 'subtract',
 *   params: [ 42, 23 ],
 *   id: 1
 * }
 * ```
 *
 * Fabricated (output) RPC message
 *
 * ```
 * {
 *   method: 'subtract',
 *   params: [42, 23],
 *   MsgType: Object
 * }
 * ```
 *
 * @param mappings
 * @return {Function}
 */
// TODO: Order named params to params array
// TODO: Handle RPC call batch
export function jsonRpcMiddleware (mappings) {
  // TODO: Report why is the request invalid
  function validRequest (rpc) {
    return rpc.jsonrpc === '2.0' &&
      (typeof rpc.id === 'number' || typeof rpc.id === 'string') &&
      typeof rpc.method === 'string'
  }

  return function (req, res, next) {
    if (!validRequest(req.body)) {
      res.json({
        code: -32600,
        message: 'Invalid Request'
      })

      return
    }

    const { method, params } = req.body
    req.rpcBody = {
      method,
      params, // Handle named params
      MsgType: mappings[req.body.method],
      id: req.body.id
    }

    next()
  }
}
