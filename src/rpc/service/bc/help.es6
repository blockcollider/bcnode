/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { HelpResponse } = require('../../../protos/bc_pb')

export default function help(context: Object, call: Object, callback: Function) {
  const reply = new HelpResponse(['Hi there!'])
  callback(null, reply)
}
