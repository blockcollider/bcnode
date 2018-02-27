/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const logging = require('../logger')
const RoverManager = require('../rover/manager').default
const Server = require('../server/index').default
const { RpcServer } = require('../rpc/index')

export default class Engine {
  _rovers: Object; // eslint-disable-line no-undef
  _server: Object; // eslint-disable-line no-undef
  _logger: Object; // eslint-disable-line no-undef
  _rpc: Object; // eslint-disable-line no-undef

  constructor (logger: Object) {
    this._rovers = new RoverManager()
    this._server = new Server()
    this._logger = logging.logger
    this._rpc = new RpcServer(this)
  }

  /**
   * Get rovers manager
   * @returns {null|*}
   */
  get rovers (): Object {
    return this._rovers
  }

  /**
   * Get instance of RpcServer
   * @returns {RpcServer|_require.RpcServer}
   */
  get rpc (): Object {
    return this._rpc
  }

  /**
   * Get instance of Server (Express on steroids)
   * @returns {null|*}
   */
  get server (): Object {
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
   *
   * @param opts Options to start server with
   */
  startServer (opts: Object) {
    this.server.run()
  }
}
