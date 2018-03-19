/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow-disabled
 */

const native = require('../../native/index.node')

const { Block } = require('../protos/core_pb')

export default class Miner {
  mine (blocks: Object) {
    const buf = blocks.serializeBinary()

    const raw = native.mine(buf)
    return Block.deserializeBinary(new Uint8Array(raw))
  }
}
