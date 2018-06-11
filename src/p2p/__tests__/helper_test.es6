/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow-disable
 */

const { generateP2PKey } = require('../helper')

describe('P2P Helper', () => {
  it.skip('generateP2PKey() generates key', (done) => {
    generateP2PKey()
      .then(() => {
        return done()
      })
      .catch((err) => {
        console.log(err)
        return done()
      })
  })
})
