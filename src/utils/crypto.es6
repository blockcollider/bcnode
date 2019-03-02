/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const avon = require('avon')
const toBuffer: (buf: Buffer|string) => Buffer = require('to-buffer')

/**
 * Calculates blake2b hash
 *
 * @param input - string to be hashed
 * @returns {String} hash
 */
export const blake2b = (input: string | Buffer): string => {
  return avon.sumBuffer(toBuffer(input), avon.ALGORITHMS.B).toString('hex')
}

/**
 * Calculates blake2bl hash
 *
 * @param input - string to be hashed
 * @returns {String} hash
 */
export const blake2bl = (input: string | Buffer): string => {
  return blake2b(input).slice(64, 128)
}

/**
 * Calculates blake2bls hash
 *
 * @param input - string to be hashed
 * @returns {String} hash
 */
export const blake2bls = (input: string | Buffer): string => {
  return blake2b(input).slice(88, 128)
}

/**
 * Calculates blake2blc hash
 *
 * @param input - compressed address blake
 * @returns {String} hash
 */
export const blake2blc = (input: string | Buffer): string => {
  const preimage = blake2bl(input)
  const compressed = blake2bls(preimage)
  return compressed
}
