/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow-disable
 */

const { Node } = require('../')

describe('Node', () => {
  it.skip('can instantiate self', () => {
    expect(new Node()).toBeInstanceOf(Node)
  })

  // it('can start', () => {
  //   const node = new Node()
  //   const res = node.start()
  //   expect(res).toEqual(true)
  // })
})
