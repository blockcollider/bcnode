const grpc = require('grpc')
const { resolve } = require('path')

const logging = require('../logger')
const RoverManager = require('../rover/manager').default
const Server = require('../server/index').default

const configDir = resolve(__dirname, '..', '..', 'config')
const configPath = resolve(configDir, 'config.json')
const config = require(configPath)

const { Block, BlockReply } = require('../protos/block_pb');
const { CollectorService } = require('../protos/collector_grpc_pb');

/**
 * Implements the collectBlock RPC method.
 */
function collectBlock(call, callback) {
  const reply = new BlockReply();
  console.log('collectBlock()', call)
  callback(null, reply);
}

export default class Engine {
  constructor (logger) {
    this._rovers = null
    this._rpc = null
    this._server = null
    this._logger = logging.logger

    this._grpc = new grpc.Server();
    this._grpc.bind(`0.0.0.0:${config.grpc.port}`, grpc.ServerCredentials.createInsecure());
    this._grpc.addService(CollectorService, {
      collectBlock: collectBlock
    });
    this._grpc.start();
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
