/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { BcBlock } = require('../protos/core_pb')
const { getChildrenRootHash } = require('./miner')

export default function isValidBlock (newBlock: BcBlock): bool {
  return theBlockChainFingerPrintMatchGenesisBlock(newBlock) &&
    numberOfBlockchainsNeededMatchesChildBlock(newBlock) &&
    ifMoreThanOneHeaderPerBlockchainAreTheyOrdered(newBlock) &&
    isChainRootCorrectlyCalculated(newBlock) &&
    isMerkleRootCorrectlyCalculated(newBlock) &&
    isDistanceCorrectlyCalculated(newBlock)
}

function theBlockChainFingerPrintMatchGenesisBlock (newBlock: BcBlock) {
  return true
}

function numberOfBlockchainsNeededMatchesChildBlock (newBlock: BcBlock) {
  return true
}

function ifMoreThanOneHeaderPerBlockchainAreTheyOrdered (newBlock: BcBlock) {
  return true
}

function isChainRootCorrectlyCalculated (newBlock: BcBlock) {
  const newBlock.getChainRoot()
  return true
}

function isMerkleRootCorrectlyCalculated (newBlock: BcBlock) {
  return true
}

function isDistanceCorrectlyCalculated (newBlock: BcBlock) {
  return true
}
