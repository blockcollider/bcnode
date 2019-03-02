/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const crypto = require('crypto')

const l2norm = require('compute-l2norm')
const cosineSimilarity = require('compute-cosine-similarity')
const cosineDistance = require('compute-cosine-distance')

const { distance } = require('../../mining/primitives')

// $FlowFixMe
const native = require('../../../native/index.node')

const ARRAY_A = [ 5, 23, 2, 5, 9 ]
const ARRAY_B = [ 3, 21, 2, 5, 14 ]

describe('math', () => {
  beforeAll(() => {
    native.initLogger()
  })

  it('divide', () => {
    for (let i = 0; i < 10000; i++) {
      const a = Math.random()
      const b = Math.random()

      const resJs = a / b
      const resNative = native.float_divide(a, b)

      expect(resJs).toEqual(resNative)
    }
  })

  it('multiply', () => {
    for (let i = 0; i < 10000; i++) {
      const a = Math.random()
      const b = Math.random()

      const resJs = a * b
      const resNative = native.float_multiply(a, b)

      expect(resJs).toEqual(resNative)
    }
  })

  it('l2norm', () => {
    const resJs = l2norm(ARRAY_A)
    const resNative = native.l2norm(ARRAY_A)
    expect(resJs).toEqual(resNative)
  })

  it('cosineSimilarity', () => {
    const resJs = cosineSimilarity(ARRAY_A, ARRAY_B)
    const resNative = native.cosine_similarity(ARRAY_A, ARRAY_B)

    expect(resJs).toEqual(resNative)
  })

  it('cosineDistance', () => {
    const resJs = cosineDistance(ARRAY_A, ARRAY_B)
    const resNative = native.cosine_distance(ARRAY_A, ARRAY_B)

    expect(resJs).toEqual(resNative)
  })

  it('distance', () => {
    let diffs = 0
    const freq = {}

    for (let i = 0; i < 1e4; i++) {
      const a = crypto.randomBytes(32).toString('hex')
      const b = crypto.randomBytes(32).toString('hex')

      const resJs = distance(a, b)
      const resNative = native.distance(a, b)

      if (resJs !== resNative) {
        diffs += 1

        const diff = resJs - resNative

        // console.log(`${i} - a`, a)
        // console.log(`${i} - b`, b)
        //
        // console.log(`${i} - JS`, resJs)
        // console.log(`${i} - RUST`, resNative)
        //
        // console.log(`${i} - diff`, diff)

        // console.log(i, a, b, resJs, resNative, diff)

        if (!freq[diff]) {
          freq[diff] = 0
        }

        freq[diff] += 1
      }
    }

    if (Object.keys(freq).length > 0) {
      console.log('freq', freq)
    }

    expect(diffs).toBe(0)
  })
})
