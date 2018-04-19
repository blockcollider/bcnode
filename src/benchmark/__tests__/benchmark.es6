/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { Benchmark } = require('../')

describe('Benchmark', () => {
  it('run()', (done) => {
    const benchmark = new Benchmark()
    benchmark
      .run()
      .then(done())
  })
})
