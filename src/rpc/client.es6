/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const grpc = require('grpc')

const { CollectorClient } = require('../protos/collector_grpc_pb');

const config = require('../../config/config')

export default class RpcClient {
  _collector: Object;

  constructor () {
    this._collector = new CollectorClient(`${config.grpc.host}:${config.grpc.port}`, grpc.credentials.createInsecure());
  }

  get collector (): Object {
    return this._collector
  }
}
