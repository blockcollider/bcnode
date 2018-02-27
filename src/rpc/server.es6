/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const grpc = require('grpc')
const { BlockReply } = require('../protos/block_pb')
const { CollectorService } = require('../protos/collector_grpc_pb')

const config = require('../../config/config')

export default class RpcServer {
  _engine: Object // eslint-disable-line no-undef
  _rpcServer: Object // eslint-disable-line no-undef

  constructor (engine: Object) {
    this._engine = engine

    this._rpcServer = new grpc.Server()
    this._rpcServer.bind(`${config.grpc.host}:${config.grpc.port}`, grpc.ServerCredentials.createInsecure())

    // TODO: Register dynamically service/**/*.es6
    this._rpcServer.addService(CollectorService, {
      collectBlock: this.collectBlock.bind(this)
    })

    this._rpcServer.start()
  }

  get engine () : Object {
    return this._engine
  }

  /**
   * Implements the collectBlock RPC method.
   */
  collectBlock (call: Object, callback: Function) {
    const reply = new BlockReply()
    console.log('collectBlock()', call)
    callback(null, reply)
  }
}
