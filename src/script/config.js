/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const sha256 = require('sha256')
const KEYWORD = 'Secure'

module.exports = {
  nonce: Buffer.from(sha256(Buffer.from(KEYWORD, 'utf8')), 'hex'),
  base: 16
}
