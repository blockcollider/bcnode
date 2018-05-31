/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type Multiverse from '../bc/multiverse'
import type BcBlock from '../protos/core_pb'

// Functions
// [x] - timestampIs70secondsBelowLocalTime
// [x] - doesNewBlockPreviousHashReferenceBlockInMultiverse
// [ ] - isNewBlockDifficultyLowerThanLowestInMultiverse
// [x] - isNewBlockHeightLowerThanLowestInMultiverse
// [x] - isNewBlockTimestampGreaterThanHighestInMultiverse
// [x] - isNewBlockTimestampLowerThanLowestInMultiverse

/**
 * High-level functions
 */
export const shouldBlockBeAddedToMultiverse = (newBlock: BcBlock, multiverse: Multiverse, triggerSync: Function): bool => {
  if (timestampIsSignificantSecondsBelowLocalTime(newBlock)) {
    triggerSync()
    return false
  }

  if (doesNewBlockPreviousHashReferenceBlockInMultiverse(newBlock, multiverse)) {
    multiverse.addBlock(newBlock)
    return true
  }

  if (isNewBlockHeightLowerThanLowestInMultiverse(newBlock, multiverse)) {
    triggerSync()
    return false
  }

  if (isNewBlockTimestampGreaterThanHighestInMultiverse(newBlock, multiverse)) {
    triggerSync()
    return false
  }

  multiverse.addBlock(newBlock)
  return true
}

const isTimestampWithin = (newBlock: BcBlock, seconds: number): boolean => {
  return (Date.now() * 0.001 - newBlock.getTimestamp()) < seconds
}

export const timestampIsSignificantSecondsBelowLocalTime = (newBlock: BcBlock): boolean => {
  return isTimestampWithin(newBlock, 12) === false
}

export const doesNewBlockPreviousHashReferenceBlockInMultiverse = (newBlock: BcBlock, multiverse: Multiverse): boolean => {
  return multiverse.addBlock(newBlock)
}

export const isNewBlockHeightLowerThanLowestInMultiverse = (newBlock: BcBlock, multiverse: Multiverse): boolean => {
  multiverse.toFlatArray().forEach((block) => {
    if (block.getHeight() <= newBlock.getHeight()) {
      return false
    }
  })

  return true
}

export const isNewBlockTimestampGreaterThanHighestInMultiverse = (newBlock: BcBlock, multiverse: Multiverse): boolean => {
  multiverse.toFlatArray().forEach((block) => {
    if (block.getTimestamp() >= newBlock.getTimestamp()) {
      return false
    }
  })

  return true
}
