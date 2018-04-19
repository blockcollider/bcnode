/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { blake2b, blake2bl, blake2bls } = require('../crypto')

const CORRECT_HASH_EMPTY_STRING_B = '786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce'
const CORRECT_HASH_EMPTY_STRING_B_L = 'd25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce'
const CORRECT_HASH_EMPTY_STRING_B_LS = '934eb04b903a685b1448b755d56f701afe9be2ce'

describe('blake2b family', () => {
  describe('blake2b', () => {
    it('hashes', () => {
      const emptyHash = blake2b('')
      expect(emptyHash).toHaveLength(128)
      expect(emptyHash).toBe(CORRECT_HASH_EMPTY_STRING_B)
    })
  })

  describe('blake2bl', () => {
    it('hashes', () => {
      const emptyHash = blake2bl('')
      expect(emptyHash).toHaveLength(64)
      expect(emptyHash).toBe(CORRECT_HASH_EMPTY_STRING_B_L)
    })
  })

  describe('blake2bls', () => {
    it('hashes', () => {
      const emptyHash = blake2bls('')
      expect(emptyHash).toHaveLength(40)
      expect(emptyHash).toBe(CORRECT_HASH_EMPTY_STRING_B_LS)
    })
  })
})
