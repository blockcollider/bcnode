/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @no-flow
 */
const {
  errToObj,
  errToString
} = require('../error')

let simpleError
let circularError

describe('error helpers', () => {
  beforeEach(() => {
    simpleError = new Error('test 1')
    simpleError.stack = `Error: test 1
      at Foo.bar (/file/name1.js:1:1)
      at Quux.baz (/file/name2.js:13:37)
      `

    circularError = new Error('test 2')
    circularError.stack = ''
    circularError.parent = circularError
  })
  describe('errToObj()', () => {
    it('converts error to object', () => {
      expect(errToObj(simpleError)).toEqual({
        message: 'test 1',
        stack: [
          'Error: test 1',
          'at Foo.bar (/file/name1.js:1:1)',
          'at Quux.baz (/file/name2.js:13:37)'
        ]
      })
    })

    it('converts circular error to object', () => {
      expect(errToObj(circularError)).toEqual({
        message: 'test 2',
        stack: [],
        parent: circularError
      })
    })
  })

  describe('errToString()', () => {
    it('serializes simple error to string', () => {
      expect(errToString(simpleError)).toBe(`{ stack: \n   [ 'Error: test 1',\n     'at Foo.bar (/file/name1.js:1:1)',\n     'at Quux.baz (/file/name2.js:13:37)' ],\n  message: 'test 1' }`)
    })

    it('serializes error with circular reference in stack to string', () => {
      expect(errToString(circularError)).toBe(`{ stack: [],\n  message: 'test 2',\n  parent: { [Error: test 2] parent: [Circular] } }`)
    })
  })
})
