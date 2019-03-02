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
const { MinerClient } = require('../protos/miner_grpc_pb')
const { RoverClient } = require('../protos/rover_grpc_pb')

const { config } = require('../config')

const GRPC_HOST = process.env.BC_GRPC_HOST || config.grpc.host
const GRPC_PORT = process.env.BC_GRPC_PORT || config.grpc.port
const GRPC_URL = `${GRPC_HOST}:${GRPC_PORT}`
const GRPC_MINER_URL = `localhost:${process.env.BC_GRPC_RUST_MINER_PORT || 50051}`

export class RpcClient {
  _services: { bc: BcClient, miner: MinerClient, rover: RoverClient }; // eslint-disable-line no-undef

  constructor () {
    this._services = {
      bc: new BcClient(GRPC_URL, grpc.credentials.createInsecure()),
      miner: new MinerClient(GRPC_MINER_URL, grpc.credentials.createInsecure()),
      rover: new RoverClient(GRPC_URL, grpc.credentials.createInsecure())
    }
  }

  service (name: string): Object {
    return this._services[name]
  }

  get bc (): BcClient {
    return this._services.bc
  }

  get miner (): MinerClient {
    return this._services.miner
  }

  get rover (): RoverClient {
    return this._services.rover
  }
}

export default RpcClient
