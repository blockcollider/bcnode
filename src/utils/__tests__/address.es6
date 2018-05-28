/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const address = require('../address').default
describe('address', () => {
  it('confirms string is keccak40', () => {
    const addr = "0x0d0707963952f2fba59dd06f2b425ace40b482fe"
    expect(address.assert("keccak40", addr)).toBe(true)
  })
})
