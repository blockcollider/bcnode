/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { Stats } = require('../../protos/core_pb')

const RpcServer = require('../server').default

export default class BcServiceImpl {
  _server: RpcServer; // eslint-disable-line no-undef

  constructor (server: RpcServer) {
    this._server = server
  }

  get server () : RpcServer {
    return this._server
  }

  /**
   * Implements the stats RPC method.
   */
  statistic (call: Object, callback: Function) {
    console.log('statistic()', call.request.array)

    const reply = new Stats()
    callback(null, reply)
  }
}
