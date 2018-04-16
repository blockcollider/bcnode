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

const Engine = require('../engine').default
const logging = require('../logger')

const { BcService } = require('../protos/bc_grpc_pb')
const { BcServiceImpl } = require('./service')

const { RoverService } = require('../protos/rover_grpc_pb')
const { RoverServiceImpl } = require('./service')

const GRPC_HOST = process.env.BC_GRPC_HOST || config.grpc.host
const GRPC_PORT = process.env.BC_GRPC_PORT || config.grpc.port
const GRPC_URL = `${GRPC_HOST}:${GRPC_PORT}`

export default class RpcServer {
  _logger: Object; // eslint-disable-line no-undef
  _engine: Engine // eslint-disable-line no-undef
  _rpcServer: Object // eslint-disable-line no-undef

  constructor (engine: Engine) {
    this._logger = logging.getLogger(__filename)
    this._engine = engine

    this._rpcServer = new grpc.Server()
    this._rpcServer.bind(GRPC_URL, grpc.ServerCredentials.createInsecure())

    // Start BcService
    this._logger.info(`Starting gRPC BcService - ${GRPC_URL}`)
    this._rpcServer.addService(BcService, new BcServiceImpl(this))

    // Start RoverService
    this._logger.info(`Starting gRPC RoverService - ${GRPC_URL}`)
    this._rpcServer.addService(RoverService, new RoverServiceImpl(this, this.emitter))

    this._rpcServer.start()
  }

  get emitter (): EventEmitter {
    return this._engine._emitter
  }

  get server () : Object {
    return this._rpcServer
  }

  get engine () : Engine {
    return this._engine
  }
}
