const logger = require('../logger').logger

// const RoverBase = require('../rovers/base').default
const Server = require('../server/index').default

export default class Engine {
  constructor () {
    this._rovers = null
    this._rpc = null
    this._server = null
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

  // TODO: Pass which rovers should be started
  startRovers () {
    logger.info('Starting Rovers')

    // this._rovers = new RoverBase()
  }

  startRpc () {
    logger.info('Starting RPC')
  }

  /**
   *
   * @param opts Options to start server with
   */
  startServer (opts) {
    this._server = new Server(opts)
    this.server.run()
  }
}
