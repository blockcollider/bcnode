/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { Suite } = require('benchmark')

export class Benchmark {
  _suite: Suite // eslint-disable-line no-undef

  constructor () {
    this._suite = new Suite()

    this._suite
      .add('RegExp#test', () => {
        /o/.test('Hello World!')
      })
      // .add('String#indexOf', () => {
      //   'Hello World!'.indexOf('o') > -1
      // })
  }

  suite (): Suite {
    return this._suite
  }

  run (): Promise<*> {
    return new Promise((resolve) => {
      this._suite
        .on('cycle', (event) => {
          console.log(String(event.target))
        })
        .on('complete', () => {
          resolve()
        })
        .run({
          async: false
        })
    })
  }
}
