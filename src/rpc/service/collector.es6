/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { BlockReply } = require('../../protos/block_pb')

const RpcServer = require('../server').default

export default class CollectorServiceImpl {
  _server: RpcServer; // eslint-disable-line no-undef

  constructor (server: RpcServer) {
    this._server = server
  }

  get server () : RpcServer {
    return this._server
  }

  /**
   * Implements the collectBlock RPC method.
   */
  collectBlock (call: Object, callback: Function) {
    console.log('collectBlock()', call.request.array)

    const reply = new BlockReply()
    callback(null, reply)
  }
}
