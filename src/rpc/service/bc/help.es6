/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { HelpReply } = require('../../../protos/bc_pb')
const { Null } = require('../../../protos/core_pb')

export default function(context: Object, call: Object, callback: Function) {
  const reply = new HelpReply(['Hi there!'])
  callback(null, reply)
}
