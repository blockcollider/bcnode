/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { blake2bl } = require('../utils/crypto')
const { BcBlock } = require('../protos/core_pb')
const {
  getChildrenBlocksHashes,
  getChildrenRootHash,
  blockchainMapToList
} = require('./miner')

export default function isValidBlock (newBlock: BcBlock): bool {
  return theBlockChainFingerPrintMatchGenesisBlock(newBlock) && // TODO
    numberOfBlockchainsNeededMatchesChildBlock(newBlock) && // TODO
    ifMoreThanOneHeaderPerBlockchainAreTheyOrdered(newBlock) && // TODO
    isChainRootCorrectlyCalculated(newBlock) &&
    isMerkleRootCorrectlyCalculated(newBlock) && // TODO
    isDistanceCorrectlyCalculated(newBlock) // TODO
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
  const receivedChainRoot = newBlock.getChainRoot()
  const expectedBlockHashes = getChildrenBlocksHashes(blockchainMapToList(newBlock.getBlockchainHeaders()))
  const expectedChainRoot = blake2bl(getChildrenRootHash(expectedBlockHashes).toString())
  return receivedChainRoot === expectedChainRoot
}

function isMerkleRootCorrectlyCalculated (newBlock: BcBlock) {
  return true
}

function isDistanceCorrectlyCalculated (newBlock: BcBlock) {
  return true
}
