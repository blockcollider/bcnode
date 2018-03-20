/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const crypto = require('crypto')

/**
 * Generate private key using random bytes
 */
export function getPrivateKey (length: number = 32) {
  return crypto.randomBytes(length)
}
