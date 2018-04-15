/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const grpc = require('grpc')

const { BcClient } = require('../protos/bc_grpc_pb')
const { RoverClient } = require('../protos/rover_grpc_pb')

const config = require('../../config/config')

const GRPC_HOST = process.env.BC_GRPC_HOST || config.grpc.host
const GRPC_PORT = process.env.BC_GRPC_PORT || config.grpc.port
const GRPC_URL = `${GRPC_HOST}:${GRPC_PORT}`

export default class RpcClient {
  _services: Object; // eslint-disable-line no-undef

  constructor () {
    this._services = {
      bc: new BcClient(GRPC_URL, grpc.credentials.createInsecure()),
      rover: new RoverClient(GRPC_URL, grpc.credentials.createInsecure())
    }
  }

  service (name: string): Object {
    return this._services[name]
  }

  get bc (): Object {
    return this.service('bc')
  }

  get rover (): Object {
    return this.service('rover')
  }
}
