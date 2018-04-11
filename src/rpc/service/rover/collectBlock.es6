/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { Null } = require('../../../protos/core_pb')

export default function (context: Object, call: Object, callback: Function) {
  const block = call.request
  const blockchain = block.getBlockchain()
  const key = `${blockchain}.block.latest`

  context.server.engine.persistence.put(key, block)
    .then(() => {
      callback(null, new Null())
    })
  context.emitter.emit('message', { name: 'block.latest', data: { blockchain, hash: block.getHash() } })
}
