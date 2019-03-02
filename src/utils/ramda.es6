/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const {
  reduce,
  concat,
  map,
  range
} = require('ramda')

export const concatAll = reduce(concat, [])

export const randRange = (min: number, max: number) => Math.random() * ((max - min) + 1) + min << 0

export const rangeStep = (start: number, step: number, stop: number) => map(
  n => start + step * n,
  range(0, (1 + (stop - start) / step) >>> 0)
)
