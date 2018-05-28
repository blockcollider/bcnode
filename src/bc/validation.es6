/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { blake2bl } = require('../utils/crypto')
const { concatAll } = require('../utils/ramda')
const { BcBlock } = require('../protos/core_pb')
const {
  getChildrenBlocksHashes,
  getChildrenRootHash,
  blockchainMapToList,
  createMerkleRoot
} = require('./miner')

export default function isValidBlock (newBlock: BcBlock): bool {
  return theBlockChainFingerPrintMatchGenesisBlock(newBlock) && // TODO
    numberOfBlockchainsNeededMatchesChildBlock(newBlock) && // TODO
    ifMoreThanOneHeaderPerBlockchainAreTheyOrdered(newBlock) && // TODO
    isChainRootCorrectlyCalculated(newBlock) &&
    isMerkleRootCorrectlyCalculated(newBlock) &&
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
  const receivedMerkleRoot = newBlock.getMerkleRoot()

  const blockHashes = getChildrenBlocksHashes(blockchainMapToList(newBlock.getBlockchainHeaders()))
  const expectedMerkleRoot = createMerkleRoot(concatAll([
    blockHashes,
    newBlock.getTxsList(),
    [newBlock.getMiner(), newBlock.getHeight(), newBlock.getVersion(), newBlock.getSchemaVersion(), newBlock.getNrgGrant()]
  ]))

  return receivedMerkleRoot === expectedMerkleRoot
}

function isDistanceCorrectlyCalculated (newBlock: BcBlock) {
  return true
}
