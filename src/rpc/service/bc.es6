/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const RpcServer = require('../server').default

const {
  help,
  stats
} = require('./bc/index')

export default class BcServiceImpl {
  _server: RpcServer; // eslint-disable-line no-undef

  constructor (server: RpcServer) {
    this._server = server
  }

  get server () : RpcServer {
    return this._server
  }

  /**
   * Help
   */
  help (call: Object, callback: Function) {
    help(this._getContext(), call, callback)
  }

  /**
   * Statistics
   */
  stats (call: Object, callback: Function) {
    stats(this._getContext(), call, callback)
  }

  _getContext () : Object {
    return {
      server: this._server
    }
  }
}
