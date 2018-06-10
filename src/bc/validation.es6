/**
 * Copyright (c) 2017-present, Block Collider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { inspect } = require('util')
const {
  all,
  aperture,
  equals,
  flatten,
  identity,
  reject,
  sort
} = require('ramda')

const { getLogger } = require('../logger')
const { blake2bl } = require('../utils/crypto')
const { concatAll } = require('../utils/ramda')
const { BcBlock, BlockchainHeader } = require('../protos/core_pb')
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
  if (newBlock === undefined) {
    return false
  }
  if (!theBlockChainFingerPrintMatchGenesisBlock(newBlock)) {
    logger.warn('failed: theBlockChainFingerPrintMatchGenesisBlock')
    return false
  }
  if (!numberOfBlockchainsNeededMatchesChildBlock(newBlock)) {
    logger.warn('failed: numberOfBlockchainsNeededMatchesChildBlock')
    return false
  }
  if (!ifMoreThanOneHeaderPerBlockchainAreTheyOrdered(newBlock)) {
    logger.warn('failed: ifMoreThanOneHeaderPerBlockchainAreTheyOrdered')
    return false
  }
  if (!isChainRootCorrectlyCalculated(newBlock)) {
    logger.warn('failed: isChainRootCorrectlyCalculated')
    return false
  }
  if (!isMerkleRootCorrectlyCalculated(newBlock)) {
    logger.warn('failed: isMerkleRootCorrectlyCalculated')
    return false
  }
  if (!isDistanceCorrectlyCalculated(newBlock)) {
   logger.warn('failed: isDistanceCorrectlyCalculated')
   return false
  }
  return true
}

function theBlockChainFingerPrintMatchGenesisBlock (newBlock: BcBlock): bool {
  logger.info('theBlockChainFingerPrintMatchGenesisBlock validation running')
  return newBlock.getBlockchainFingerprintsRoot() === GENESIS_DATA.blockchainFingerprintsRoot
}

function numberOfBlockchainsNeededMatchesChildBlock (newBlock: BcBlock): bool {
  logger.info('numberOfBlockchainsNeededMatchesChildBlock validation running')
  // verify that all blockain header lists are non empty and that there is childBlockchainCount of them
  const headerValues = Object.values(newBlock.getBlockchainHeaders().toObject())
  // logger.info(inspect(headerValues, {depth: 3}))
  // $FlowFixMe
  const headerValuesWithLengthGtZero = headerValues.filter(headersList => headersList.length > 0)
  // logger.info(inspect(headerValuesWithLengthGtZero, {depth: 3}))
  // logger.info(GENESIS_DATA.childBlockchainCount)
  return headerValuesWithLengthGtZero.length === GENESIS_DATA.childBlockchainCount
}

function ifMoreThanOneHeaderPerBlockchainAreTheyOrdered (newBlock: BcBlock): bool {
  logger.info('ifMoreThanOneHeaderPerBlockchainAreTheyOrdered validation running')
  const headersMap = newBlock.getBlockchainHeaders()

  // gather true/false for each chain signalling if either there is only one header
  // (most common case) or headers maintain ordering
  const chainsConditions = Object.keys(headersMap.toObject()).map(listName => {
    const getMethodName = `get${listName[0].toUpperCase()}${listName.slice(1)}`
    const chainHeaders = headersMap[getMethodName]()
    if (chainHeaders.length === 1) {
      logger.debug(`ifMoreThanOneHeaderPerBlockchainAreTheyOrdered ${listName} single and valid`)
      return true
    }

    // return true if left height < right height condition is valid
    // for all pairs ([[a, b], [b, c], [c, d]]) of chain headers ([a, b, c, d])
    // (in other words if ordering is maintained)
    // TODO
    const orderingCorrect = all(
      equals(true),
      aperture(2, chainHeaders).map(([a, b]) => a.getHeight() < b.getHeight())
    )
    logger.debug(`ifMoreThanOneHeaderPerBlockchainAreTheyOrdered ${listName} multiple and valid: ${orderingCorrect.toString()}`)
    if (!orderingCorrect) {
      logger.debug(`ifMoreThanOneHeaderPerBlockchainAreTheyOrdered ${inspect(headersMap.toObject())}`)
    }
    return orderingCorrect
  })

  // check if all chain conditions are true
  logger.info(`ifMoreThanOneHeaderPerBlockchainAreTheyOrdered all chain conditions: ${inspect(chainsConditions)}`)
  return all(equals(true), chainsConditions)
}

function isChainRootCorrectlyCalculated (newBlock: BcBlock): bool {
  logger.info('isChainRootCorrectlyCalculated validation running')
  const receivedChainRoot = newBlock.getChainRoot()

  const expectedBlockHashes = getChildrenBlocksHashes(blockchainMapToList(newBlock.getBlockchainHeaders()))
  const expectedChainRoot = blake2bl(getChildrenRootHash(expectedBlockHashes).toString())
  return receivedChainRoot === expectedChainRoot
}

function isMerkleRootCorrectlyCalculated (newBlock: BcBlock): bool {
  logger.info('isMerkleRootCorrectlyCalculated validation running')
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
  logger.info('isDistanceCorrectlyCalculated validation running')
  const receivedDistance = newBlock.getDistance()

  const expectedWork = prepareWork(newBlock.getPreviousHash(), newBlock.getBlockchainHeaders())
  const expectedDistance = distance(
    expectedWork,
    blake2bl(
      newBlock.getMiner() +
      newBlock.getMerkleRoot() +
      blake2bl(newBlock.getNonce()) +
      newBlock.getTimestamp()
    )
  )
  return receivedDistance === expectedDistance
}

function blockainHeadersOrdered (childHeaderList: BlockchainHeader[], parentHeaderList: BlockchainHeader[]) {
  // check highest block from child list is higher or equally high as highest block from parent list
  const pickHighestFromList = (list: BlockchainHeader[]) => {
    if (list.length === 1) {
      return list[0]
    } else {
      return list.reduce((acc, curr) => curr.getHeight() > acc.getHeight() ? curr : acc, list[0])
    }
  }

  const highestChildHeader = pickHighestFromList(childHeaderList)
  const highestParentHeader = pickHighestFromList(parentHeaderList)

  // logger.debug(`blockainHeadersOrdered highestChild ${inspect(highestChildHeader.toObject())}, highestParent: ${inspect(highestParentHeader.toObject())}`)
  return highestChildHeader !== undefined && highestParentHeader !== undefined && highestChildHeader.getHeight() >= highestParentHeader.getHeight()
}

export function validateBlockSequence (blocks: BcBlock[]): bool {
  // if any of the submissions are undefined reject the sequence
  if (reject(identity, blocks).length > 0) {
    return false
  }
  // BC: 10 > BC: 9 > BC: 8 ...
  const sortedBlocks = sort((a, b) => b.getHeight() - a.getHeight(), blocks)

  logger.debug(`validateBlockSequence sorted blocks ${sortedBlocks.map(b => b.getHeight()).toString()}`)
  // validate that Bc blocks are all in the same chain
  const validPairs = aperture(2, sortedBlocks).map(([a, b]) => {
    return a.getPreviousHash() === b.getHash()
  })

  logger.debug(`validateBlockSequence sorted blocks ${inspect(aperture(2, sortedBlocks.map(b => b.getHeight())))}`)
  if (!all(equals(true), validPairs)) {
    logger.debug(`validateBlockSequence validPairs: ${validPairs}`)
    return false
  }

  // validate that highest header from each blockchain list from each block maintains ordering
  // [[BC10, BC9], [BC9, BC8]]
  const pairs = aperture(2, sortedBlocks)

  // now create:
  // [[btcOrdered, ethOrdered, lskOrdered, neoOrdered, wavOrdered], [btcOrderder, ethOrdered, lskOrdered, neoOrdered, wavOrdered]]
  //                                e.g. BC10, BC9
  const validPairSubchains = pairs.map(([child, parent]) => {
    const childBlockchainHeaders = child.getBlockchainHeaders()
    const parentBlockchainHeaders = parent.getBlockchainHeaders()
    // TODO this should be a map over all members of BlockchainHeaders instance to prevent error after adding another chain to Collider
    return [
      blockainHeadersOrdered(childBlockchainHeaders.getBtcList(), parentBlockchainHeaders.getBtcList()),
      blockainHeadersOrdered(childBlockchainHeaders.getEthList(), parentBlockchainHeaders.getEthList()),
      blockainHeadersOrdered(childBlockchainHeaders.getLskList(), parentBlockchainHeaders.getLskList()),
      blockainHeadersOrdered(childBlockchainHeaders.getNeoList(), parentBlockchainHeaders.getNeoList()),
      blockainHeadersOrdered(childBlockchainHeaders.getWavList(), parentBlockchainHeaders.getWavList())
    ]
  })
  // flatten => [btc10_9Ordered, eth10_9Ordered, lsk10_9Ordered, neo10_9Ordered, wav10_9Ordered, btc9_8Orderded, eth9_8Ordered, lsk9_8Ordered, neo9_8Ordered, wav9_8Ordered]
  logger.debug(`validateBlockSequence validPairSubchains ${inspect(validPairSubchains)}`)
  if (!all(equals(true), flatten(validPairSubchains))) {
    return false
  }

  return true
}
