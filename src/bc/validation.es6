/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const {
  all,
  aperture,
  equals
} = require('ramda')

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
    ifMoreThanOneHeaderPerBlockchainAreTheyOrdered(newBlock) &&
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

function ifMoreThanOneHeaderPerBlockchainAreTheyOrdered (newBlock: BcBlock): bool {
  const headersMap = newBlock.getBlockchainHeaders()

  // gather true/false for each chain signalling if either there is only one header
  // (most common case) or headers maintain ordering
  const chainsConditions = Object.keys(headersMap.toObject()).map(listName => {
    const getMethodName = `get${listName[0].toUpperCase()}${listName.slice(1)}`
    const chainHeaders = headersMap[getMethodName]()
    if (chainHeaders.length === 1) {
      return true
    }

    // return true if left height < right height condition is valid
    // for all pairs ([[a, b], [b, c], [c, d]]) of chain headers ([a, b, c, d])
    // (in other words if ordering is maintained)
    return all(
      equals(true),
      aperture(2, chainHeaders).map(([a, b]) => a.getHeight() < b.getHeight())
    )
  })

  // check if all chain conditions are true
  return all(equals(true), chainsConditions)
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
