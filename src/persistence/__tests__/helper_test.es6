/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow-disable
 */

const { Block } = require('../../protos/core_pb')
const { serialize, deserialize } = require('../helper')

describe('codec', () => {
  describe('works with plain javascript values', () => {
    it('can serialize null', () => {
      const serialized = serialize(null)
      expect(deserialize(serialized)).toBe(null)
    })

    it('can serialize boolean', () => {
      expect(deserialize(serialize(false))).toBe(false)
      expect(deserialize(serialize(true))).toBe(true)
    })

    it('can serialize number', () => {
      expect(deserialize(serialize(1))).toBe(1)
      expect(deserialize(serialize(3.141592))).toBe(3.141592)
    })

    it('can serialize string', () => {
      expect(deserialize(serialize('test string'))).toBe('test string')
      expect(deserialize(serialize(''))).toBe('')
    })

    it('can serialize plain js object', () => {
      const testObj = { nl: null,
        u: undefined,
        b: false,
        n: 3.141592,
        s: 'string',
        o: {},
        a: [1, 2, 3]
      }
      expect(deserialize(serialize(testObj))).toEqual(testObj)
    })
  })

  describe('works with BC protobuf messages', () => {
    it('can serialize block', () => {
      const blockData = ['btc', 'df8031d3a1ae0c9697349b2652bedfa89202023c4b33dbed56649899b3270054']
      const b = new Block(blockData)
      expect(deserialize(serialize(b))).toEqual(b)
    })
  })
})
