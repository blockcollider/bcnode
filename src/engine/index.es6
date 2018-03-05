/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const config = require('../../config/config')
const logging = require('../logger')
const RoverManager = require('../rover/manager').default
const rovers = require('../rover/manager').rovers
const Server = require('../server/index').default
const PersistenceRocksDb = require('../persistence').RocksDb
const { RpcServer } = require('../rpc/index')

export default class Engine {
  _logger: Object; // eslint-disable-line no-undef
  _persistence: PersistenceRocksDb; // eslint-disable-line no-undef
  _rovers: RoverManager; // eslint-disable-line no-undef
  _rpc: RpcServer; // eslint-disable-line no-undef
  _server: Server; // eslint-disable-line no-undef

  constructor (logger: Object) {
    this._logger = logging.getLogger(__filename)
    this._persistence = new PersistenceRocksDb(config.persistence.path)
    this._rovers = new RoverManager()
    this._rpc = new RpcServer(this)
    this._server = new Server()
  }

  /**
   * Initialize engine internals
   *
   * - Open database
   * - Store name of available rovers as Buffer
   */
  // FIXME: Handle possible error
  async init () {
    const roverNames = Buffer.from(JSON.stringify(Object.keys(rovers)))

    await this._persistence.open()
      .then(() => this.persistence.put('rovers', roverNames))

    this._logger.info('Engine initialized')
  }

  /**
   * Get persistence
   * @return {Persistence}
   */
  get persistence (): PersistenceRocksDb {
    return this._persistence
  }

  /**
   * Get rovers manager
   * @returns RoverManager
   */
  get rovers (): RoverManager {
    return this._rovers
  }

  /**
   * Get instance of RpcServer
   * @returns RpcServer
   */
  get rpc (): RpcServer {
    return this._rpc
  }

  /**
   * Get instance of Server (Express on steroids)
   * @returns Server
   */
  get server (): Server {
    return this._server
  }

  /**
   * Start rovers
   * @param rovers - list (string; comma-delimited) of rover names to start
   */
  startRovers (rovers: string[]) {
    this._logger.info(`Starting rovers '${rovers.join(',')}'`)

    rovers.forEach(name => {
      if (name) {
        this._rovers.startRover(name)
      }
    })
  }

  /**
   * Start Server
   *
   * @param opts Options to start server with
   */
  startServer (opts: Object) {
    this.server.run(opts)
  }
}
