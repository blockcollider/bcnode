/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type { Logger } from 'winston'
import type { $Request, $Response, NextFunction } from 'express'

const path = require('path')
const http = require('http')
const bodyParser = require('body-parser')
const express = require('express')
const expressWinston = require('express-winston')
const responseTime = require('response-time')
const serveIndex = require('serve-index')
const WebSocket = require('ws')

const logging = require('../logger')
const config = require('../../config/config')
const { Null } = require('../protos/core_pb')
const { RpcClient, RpcServer } = require('../rpc')

const assetsDir = path.resolve(__dirname, '..', '..', 'assets', 'dist')
const docsDir = path.resolve(__dirname, '..', '..', 'docs')

type Opts = {|
  ws: bool,
  rpc: bool,
  ui: bool
|}

// See http://www.programwitherik.com/getting-started-with-socket-io-node-js-and-express/
export default class Server {
  _opts: Opts
  _app: express$Application // eslint-disable-line
  _wsServer: any
  _rpcClient: RpcClient
  _rpcServer: RpcServer
  _server: any
  _logger: Logger

  constructor (rpcServer: RpcServer) {
    // Create express app instance
    this._app = express()
    this._rpcClient = new RpcClient()
    this._rpcServer = rpcServer
    this._server = null
    this._logger = logging.getLogger(__filename)
  }

  get app (): express$Application { // eslint-disable-line
    return this._app
  }

  get opts (): Opts {
    return this._opts
  }

  get rpcClient (): RpcClient {
    return this._rpcClient
  }

  get server (): any {
    return this._server
  }

  run (opts: Opts) {
    this._opts = opts

    this._logger.info('Starting Server for Web UI')

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
    // $FlowFixMe see https://github.com/facebook/flow/issues/5113
    const server = (this._server = http.Server(this.app))

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
    this._wsServer = new WebSocket.Server({ server: this._server, path: '/ws' })

    // setup relaying events from rpc server to websockets
    this._rpcServer.emitter.on('collectBlock', ({ block }) => {
      this._wsServer.clients.forEach(c => {
        if (c.readyState === WebSocket.OPEN) {
          this._logger.debug(`Sending message to client `)
          try {
            c.send(JSON.stringify({
              timestamp: Date.now(),
              name: 'block.latest',
              data: { blockchain: block.getBlockchain(), hash: block.getHash() }
            }), e => {
              if (e) {
                this._logger.error(`Could not send\n ${e}`)
                c.terminate()
              }
            })
          } catch (e) {
            this._logger.error(`Could not send\n ${e.stack}`)
            c.terminate()
          }
        }
      })
    })
    this._wsServer.on('connection', (client, req) => {
      client.on('close', reason => {
        this._logger.info('Client connection closed', req.connection.remoteAddress)
      })

      client.on('error', error => {
        this._logger.warn(`Client exited with error\n${error.stack}`)
      })
    })

    this._wsServer.on('error', (error) => {
      // TODO restart WS server instead
      this._logger.warn(`WS server exited (and will not be available until next start) with error ${error}`)
    })
  }

  initRpc () {
    this.app.post('/rpc', (req, res: $Response, next: NextFunction) => {
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
    this.app.use('/doc', express.static(docsDir))

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
export function jsonRpcMiddleware (mappings: any) {
  // TODO: Report why is the request invalid
  function validRequest (rpc) {
    // $FlowFixMe
    return rpc.jsonrpc === '2.0' &&
      // $FlowFixMe
      (typeof rpc.id === 'number' || typeof rpc.id === 'string') &&
      // $FlowFixMe
      typeof rpc.method === 'string'
  }

  return function (req: $Request, res: $Response, next: NextFunction) {
    if (!validRequest(req.body)) {
      res.json({
        code: -32600,
        message: 'Invalid Request'
      })

      return
    }

    // $FlowFixMe
    const { method, params } = req.body
    // $FlowFixMe
    req.rpcBody = {
      method,
      params, // Handle named params
      // $FlowFixMe
      MsgType: mappings[req.body.method],
      // $FlowFixMe
      id: req.body.id
    }

    next()
  }
}
