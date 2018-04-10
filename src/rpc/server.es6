/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { EventEmitter } = require('events')

const grpc = require('grpc')
const config = require('../../config/config')

const { BcService } = require('../protos/bc_grpc_pb')
const { BcServiceImpl } = require('./service')

const { RoverService } = require('../protos/rover_grpc_pb')
const { RoverServiceImpl } = require('./service')

export default class RpcServer {
  _engine: Object // eslint-disable-line no-undef
  _rpcServer: Object // eslint-disable-line no-undef
  _emitter: any

  constructor (engine: Object) {
    this._engine = engine
    this._emitter = new EventEmitter()

    this._rpcServer = new grpc.Server()
    this._rpcServer.bind(`${config.grpc.host}:${config.grpc.port}`, grpc.ServerCredentials.createInsecure())

    // Register services
    this._rpcServer.addService(BcService, new BcServiceImpl(this))
    this._rpcServer.addService(RoverService, new RoverServiceImpl(this, this._emitter))

    this._rpcServer.start()
  }

  get emitter (): EventEmitter {
    return this._emitter
  }

  get server () : Object {
    return this._rpcServer
  }

  get engine () : Object {
    return this._engine
  }
}
