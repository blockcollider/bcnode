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

export const ROVER_SECONDS_PER_BLOCK = {
  'btc': 600.0,
  'eth': 15.0,
  'lsk': 10.0,
  'neo': 15.0,
  'wav': 65.0 // measured on blocks 1352650 - 1352150
}

export function randomInt (low: number, high: number): number {
  return Math.floor(Math.random() * (high - low) + low)
}
