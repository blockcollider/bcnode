/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { Null } = require('../../../protos/block_pb')

export default function(context: Object, call: Object, callback: Function) {
  // console.log(context, call, callback)

  callback(null, Null)
}
