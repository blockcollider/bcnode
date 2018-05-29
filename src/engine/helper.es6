/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type Metaverse from '../bc/metaverse'
import type BcBlock from '../protos/core_pb'

// Functions
// [x] - timestampIs70secondsBelowLocalTime
// [x] - doesNewBlockPreviousHashReferenceBlockInMetaverse
// [ ] - isNewBlockDifficultyLowerThanLowestInMetaverse
// [x] - isNewBlockHeightLowerThanLowestInMetaverse
// [x] - isNewBlockTimestampGreaterThanHighestInMetaverse
// [x] - isNewBlockTimestampLowerThanLowestInMetaverse

/**
 * High-level functions
 */
export const shouldBlockBeAddedToMetaverse = (newBlock: BcBlock, metaverse: Metaverse, triggerSync: Function): bool => {
  if (timestampIsSignificantSecondsBelowLocalTime(newBlock)) {
    triggerSync()
    return false
  }

  if (doesNewBlockPreviousHashReferenceBlockInMetaverse(newBlock, metaverse)) {
    metaverse.addBlock(newBlock)
    return true
  }

  if (isNewBlockHeightLowerThanLowestInMetaverse(newBlock, metaverse)) {
    triggerSync()
    return false
  }

  if (isNewBlockTimestampGreaterThanHighestInMetaverse(newBlock, metaverse)) {
    triggerSync()
    return false
  }

  metaverse.addBlock(newBlock)
  return true
}

const isTimestampWithin = (newBlock: BcBlock, seconds: number): boolean => {
  return (Date.now() * 0.001 - newBlock.getTimestamp()) < seconds
}

export const timestampIsSignificantSecondsBelowLocalTime = (newBlock: BcBlock): boolean => {
  return isTimestampWithin(newBlock, 12) === false
}

export const doesNewBlockPreviousHashReferenceBlockInMetaverse = (newBlock: BcBlock, metaverse: Metaverse): boolean => {
  return metaverse.addBlock(newBlock)
}

export const isNewBlockHeightLowerThanLowestInMetaverse = (newBlock: BcBlock, metaverse: Metaverse): boolean => {
  metaverse.toFlatArray().forEach((block) => {
    if (block.getHeight() <= newBlock.getHeight()) {
      return false
    }
  })

  return true
}

export const isNewBlockTimestampGreaterThanHighestInMetaverse = (newBlock: BcBlock, metaverse: Metaverse): boolean => {
  metaverse.toFlatArray().forEach((block) => {
    if (block.getTimestamp() >= newBlock.getTimestamp()) {
      return false
    }
  })

  return true
}
