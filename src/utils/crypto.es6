/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const avon = require('avon')

/**
 * Calculates blake2b hash
 *
 * @param input - string to be hashed
 * @returns {String} hash
 */
export const blake2b = (input: string): string => {
  return avon.sumBuffer(Buffer.from(input), avon.ALGORITHMS.B).toString('hex')
}

/**
 * Calculates blake2bl hash
 *
 * @param input - string to be hashed
 * @returns {String} hash
 */
export const blake2bl = (input: string): string => {
  return blake2b(input).slice(64, 128)
}

/**
 * Calculates blake2bls hash
 *
 * @param input - string to be hashed
 * @returns {String} hash
 */
export const blake2bls = (input: string): string => {
  return blake2b(input).slice(88, 128)
}
