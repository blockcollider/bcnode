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

const { BlockIn, BlockOut } = require('../protos/miner_pb')

export default class Miner {
  mine (block: BlockIn) : BlockOut {
    const buf = block.serializeBinary()
    const raw = native.mine(buf)
    return BlockOut.deserializeBinary(new Uint8Array(raw))
  }
}
