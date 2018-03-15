/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const crypto = require('crypto')
const { execSync } = require('child_process')

/**
 * Generate private key using random bytes
 */
export function getPrivateKey (length: number = 32) {
  return crypto.randomBytes(length)
}

/**
 * Detect java jre presence in the system
 */
export function javaJreAvailable (): boolean {
  try {
    execSync('javaa -version 2>&1')
    return true
  } catch (e) {
    return false
  }
}
