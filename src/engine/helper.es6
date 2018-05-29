/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Functions
// [x] - timestampIs70secondsBelowLocalTime
// [ ] - doesNewBlockPreviousHashReferenceBlockInMetaVerse
// [ ] - isNewBlockTimestampLowerThanLowestInMetaverse
// [ ] - isNewBlockDifficultyLowerThanLowestInMetaverse
// [ ] - isNewBlockHeightLowerThanLowestInMetaverse
// [ ] - isNewBlockTimestampGreaterThanHighestInMetaverse

/**
 * High-level functions
 */
export const shouldBlockBeAddedToMetaverse = (newBlock: Object) => {
  // TODO: Implement
  return true
}

export const addBlockToMetaverse = (newBlock: Object) => {

}

/**
 * Helper functions
 */
export const isBlockValid = (newBlock: Object) => {
  // TODO: Implement
  return true
}

export const shouldMetaverseBeReorganized = () => {
  // TODO: Implement
  return false
}

export const timestampIs70secondsBelowLocalTime = (newBlock: Object): boolean => {
  return (Date.now() * 0.001 - newBlock.timestamp) > 70
}
