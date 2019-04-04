/*
 * Copyright (c) 2017-present, Block Collider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const BN = require('bn.js')
const { groupWith } = require('ramda')

const { BcBlock } = require('../protos/core_pb')

/**
 * Sorts blocks from highest to lowes by height
 */
export const sortBlocks = (list: BcBlock[]): BcBlock[] => {
  return list.sort((a, b) => {
    if (new BN(a.getHeight()).gt(new BN(b.getHeight())) === true) {
      return -1
    }
    if (new BN(a.getHeight()).lt(new BN(b.getHeight())) === true) {
      return 1
    }
    return 0
  })
}

export const toMissingIntervals = (blockNumbers: number[]) =>
  groupWith((a, b) => a - 1 === b, blockNumbers)
    .map((arr) => [arr[0], arr[arr.length - 1]])
