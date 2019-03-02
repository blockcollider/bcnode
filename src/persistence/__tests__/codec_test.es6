/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow-disable
 */

const { Block } = require('../../protos/core_pb')
const { serialize, deserialize } = require('../codec')

describe('codec', () => {
  describe('type checks', () => {
    it('serialize returns buffer', () => {
      const payload = serialize('atest')
      expect(payload).toBeInstanceOf(Buffer)
    })
  })
  describe('works with plain javascript values', () => {
    it('can serialize null', () => {
      expect(() => {
        const serialized = serialize(null)
      }).toThrow()
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

    describe('object', () => {
      it('is rejected if general object', () => {
        const testObj = { nl: null,
          u: undefined,
          b: false,
          n: 3.141592,
          s: 'string',
          o: {},
          a: [1, 2, 3]
        }
        expect(() => {
          serialize(testObj)
        }).toThrow()
      })

      it('is serialized if versionData', () => {
        const versionData = { version: '1.2.3', commit: 'b6329860d9f2450bfefaf5a1fcc6613ddcf4409d', db_version: 1 }
        expect(deserialize(serialize(versionData))).toEqual(versionData)
      })

      it('is serialized if dhtId object', () => {
        const versionData = { id: 'node@id', timestamp: 1234567890 }
        expect(deserialize(serialize(versionData))).toEqual(versionData)
      })
    })
  })

  describe('works with BC protobuf messages', () => {
    it('can serialize block', () => {
      const blockData = ['btc', 'df8031d3a1ae0c9697349b2652bedfa89202023c4b33dbed56649899b3270054']
      const b = new Block(blockData)
      expect(deserialize(serialize(b)).toObject()).toEqual(b.toObject())
    })
  })
})
