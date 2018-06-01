/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { RpcServer } from '../../server'

const { Stats } = require('../../../protos/core_pb')

export default function stats (context: RpcServer, call: Object, callback: Function) {
  const reply = new Stats()
  callback(null, reply)
}
