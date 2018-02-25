const logging = require('../logger')
const RoverManager = require('../rover/manager').default
const Server = require('../server/index').default
const { RpcServer } = require('../rpc/index')

export default class Engine {
  constructor (logger) {
    this._rovers = null
    this._server = null
    this._logger = logging.logger
    this._rpc = new RpcServer(this)
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

  startRovers (rovers: string[]) {
    this._logger.info(`Starting rovers '${rovers}'`)

    this._rovers = new RoverManager(rovers)

    rovers.forEach(name => {
      this._rovers.startRover(name)
    })
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
