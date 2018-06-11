/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { BcBlock } = require('../../protos/core_pb')
const { Multiverse } = require('../multiverse')

describe('Multiverse', () => {
  test('constructor()', () => {
    const multiverse = new Multiverse()
    expect(multiverse.blocksCount).toEqual(0)
  })
})
