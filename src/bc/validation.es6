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

const { getLogger } = require('../logger')
const { blake2bl } = require('../utils/crypto')
const { concatAll } = require('../utils/ramda')
const { BcBlock } = require('../protos/core_pb')
const {
  getChildrenBlocksHashes,
  getChildrenRootHash,
  blockchainMapToList,
  createMerkleRoot,
  prepareWork,
  distance
} = require('./miner')
const GENESIS_DATA = require('./genesis.raw')

const logger = getLogger(__filename)

export function isValidBlock (newBlock: BcBlock): bool {
  return theBlockChainFingerPrintMatchGenesisBlock(newBlock) &&
    numberOfBlockchainsNeededMatchesChildBlock(newBlock) &&
    ifMoreThanOneHeaderPerBlockchainAreTheyOrdered(newBlock) &&
    isChainRootCorrectlyCalculated(newBlock) &&
    isMerkleRootCorrectlyCalculated(newBlock) &&
    isDistanceCorrectlyCalculated(newBlock)
}

function theBlockChainFingerPrintMatchGenesisBlock (newBlock: BcBlock): bool {
  logger.info('theBlockChainFingerPrintMatchGenesisBlock validation failed')
  return newBlock.getBlockchainFingerprintsRoot() === GENESIS_DATA.blockchainFingerprintsRoot
}

function numberOfBlockchainsNeededMatchesChildBlock (newBlock: BcBlock): bool {
  logger.info('numberOfBlockchainsNeededMatchesChildBlock validation failed')
  // verify that all blockain header lists are non empty and that there is childBlockchainCount of them
  return Object.values(newBlock.getBlockchainHeaders().toObject().filter(headersList => headersList.length > 0)).length === GENESIS_DATA.childBlockchainCount
}

function ifMoreThanOneHeaderPerBlockchainAreTheyOrdered (newBlock: BcBlock): bool {
  logger.info('ifMoreThanOneHeaderPerBlockchainAreTheyOrdered validation failed')
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

function isChainRootCorrectlyCalculated (newBlock: BcBlock): bool {
  logger.info('isChainRootCorrectlyCalculated validation failed')
  const receivedChainRoot = newBlock.getChainRoot()

  const expectedBlockHashes = getChildrenBlocksHashes(blockchainMapToList(newBlock.getBlockchainHeaders()))
  const expectedChainRoot = blake2bl(getChildrenRootHash(expectedBlockHashes).toString())
  return receivedChainRoot === expectedChainRoot
}

function isMerkleRootCorrectlyCalculated (newBlock: BcBlock): bool {
  logger.info('isMerkleRootCorrectlyCalculated validation failed')
  const receivedMerkleRoot = newBlock.getMerkleRoot()

  const blockHashes = getChildrenBlocksHashes(blockchainMapToList(newBlock.getBlockchainHeaders()))
  const expectedMerkleRoot = createMerkleRoot(concatAll([
    blockHashes,
    newBlock.getTxsList(),
    [newBlock.getMiner(), newBlock.getHeight(), newBlock.getVersion(), newBlock.getSchemaVersion(), newBlock.getNrgGrant()]
  ]))

  return receivedMerkleRoot === expectedMerkleRoot
}

function isDistanceCorrectlyCalculated (newBlock: BcBlock): bool {
  logger.info('isDistanceCorrectlyCalculated validation failed')
  const receivedDistance = newBlock.getDistance()

  const expectedWork = prepareWork(newBlock.getPreviousHash(), newBlock.getBlockchainHeaders())
  const expectedDistance = distance(expectedWork, blake2bl(newBlock.getMiner() + newBlock.getMerkleRoot() + blake2bl(newBlock.getNonce()) + newBlock.getTimestamp()))
  return receivedDistance === expectedDistance
}
