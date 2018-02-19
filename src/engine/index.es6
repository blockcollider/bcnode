const logger = require('../logger').logger

// const RoverBase = require('../rovers/base').default
const Server = require('../server/index').default

export default class Engine {
  constructor () {
    this._rovers = null
    this._rpc = null
    this._server = null
    this._ws = null
  }

  get rovers () {
    return this._rovers
  }

  get rpc () {
    return this._rpc
  }

  get server () {
    return this._server
  }

  get ws () {
    return this._ws
  }

  startRovers () {
    logger.info('Starting Rovers')

    // this._rovers = new RoverBase()
  }

  startRpc () {
    logger.info('Starting RPC')
  }

  startServer () {
    this._server = new Server()
    this.server.run()
  }

  startWebSocket () {
    logger.info('Starting WebSocket')
    console.log('done')
  }
}
