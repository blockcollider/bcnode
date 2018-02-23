const logging = require('../logger')

// const RoverBase = require('../rovers/base').default

const RoverManager = require('../rover/manager').default

const Server = require('../server/index').default

export default class Engine {
  constructor (logger, hub) {
    this._rovers = null
    this._rpc = null
    this._server = null
    this._logger = logging.logger
    this._subscriber = hub.addSubscriber('rover.*.newblock', this._consumeBlock.bind(this))
  }

  _consumeBlock (topic, block) { // eslint-disable-line
    this._logger.info(`Engine: Got new block from ${topic}, block: ${block}`)
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
    this._logger.info(`Starting rovers ${rovers}`)

    this._rovers = new RoverManager(rovers)

    rovers.forEach((name) => {
      this._rovers.startRover(name)
    })
  }

  startRpc () {
    this._logger.info('Starting RPC')
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
