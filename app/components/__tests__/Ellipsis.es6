/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const {
  ellipsisLeft,
  ellipsisMiddle,
  ellipsisRight,
  formatText
} = require('../Ellipsis.jsx')

const TEXT_NUMBERS = '0123456789'
// const TEXT_LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const TEXT_LONG = 'The quick brown fox jumps over the lazy dog'

describe('Ellipsis', () => {
  describe('ellipsisLeft', () => {
    it('properly formats text', () => {
      const res = ellipsisLeft(TEXT_NUMBERS, 6, '...')
      expect(res).toEqual('...789')
    })
  })

  describe('ellipsisMiddle', () => {
    it('properly formats text', () => {
      const res = ellipsisMiddle(TEXT_NUMBERS, 6, '...')
      expect(res).toEqual('01...9')
    })
  })

  describe('ellipsisRight', () => {
    it('properly formats text', () => {
      const res = ellipsisRight(TEXT_NUMBERS, 6, '...')
      expect(res).toEqual('012...')
    })
  })

  describe('formatText', () => {
    it('properly formats text', () => {
      const res = formatText(TEXT_LONG, 12, '...')
      expect(res).toEqual('The qu...zy dog')
    })
  })
})
