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
const { CollectorClient } = require('../protos/collector_grpc_pb')

const config = require('../../config/config')

export default class RpcClient {
  _services: Object; // eslint-disable-line no-undef

  constructor () {
    this._services = {
      bc: new BcClient(`${config.grpc.host}:${config.grpc.port}`, grpc.credentials.createInsecure()),
      collector: new CollectorClient(`${config.grpc.host}:${config.grpc.port}`, grpc.credentials.createInsecure())
    }
  }

  service (name: string): Object {
    return this._services[name]
  }

  get bc (): Object {
    return this.service('bc')
  }

  get collector (): Object {
    return this.service('collector')
  }
}
