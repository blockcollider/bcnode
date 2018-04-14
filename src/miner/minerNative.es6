/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// $FlowFixMe
const native = require('../../native/index.node')

const { MinerRequest, MinerResponse } = require('../protos/miner_pb')

export default class MinerNative {
  mine (block: MinerRequest) : MinerResponse {
    const buf = block.serializeBinary()
    const raw = native.mine(buf)
    return MinerResponse.deserializeBinary(new Uint8Array(raw))
  }
}
