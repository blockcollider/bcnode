/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { groupWith } = require('ramda')

// see getDecisivePeriodOfCrossChainBlocksStatus internal fn
const toMissingIntervals = (blockNumbers: number[]) =>
  groupWith((a, b) => a - 1 === b, blockNumbers)
    .map((arr) => [arr[0],arr[arr.length-1]])

describe('test', () => {
  it('works for common case', () => {
    // means we have blocks [1,2,3,4,7,8,15,26,27,28]
    const missingBlocks =  [25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 14, 13, 12, 11, 10, 9, 6, 5]
    expect(toMissingIntervals(missingBlocks)).toEqual([
      [25, 16],
      [14, 9],
      [6, 5]
    ])
  })

  it('works for no missing blocks', () =>  {
    const missingBlocks = []
    expect(toMissingIntervals(missingBlocks)).toEqual([])
  })

  it('works for continuous missing row', () =>  {
    const missingBlocks = [6, 5, 4, 3, 2, 1]
    expect(toMissingIntervals(missingBlocks)).toEqual([[6, 1]])
  })
})
