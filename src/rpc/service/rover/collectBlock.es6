/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { Null } = require('../../../protos/core_pb')

export default function(context: Object, call: Object, callback: Function) {
  const blockchain = call.request.array[0];
  const hash = call.request.array[1];
  const key = `${blockchain}.block.latest`

  // console.log("NEW BLOCK", blockchain, hash, key)

  // TODO: Store block not just hash
  context.server.engine.persistence.put(key, hash)
    .then(() => {
      callback(null, Null)
    })
}
