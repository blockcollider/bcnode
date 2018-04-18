/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 *    DOCUMENT IN FOUR PARTS
 *
 *      PART 1: Difiiculty of the next block [COMPLETE]
 *
 *      PART 2: Mining a block hash [COMPLETE]
 *
 *      PART 3: Blockchain header proofs [IN PROGRESS]
 *
 *      PART 4: Create Block Collider Block Hash  [COMPLETE]
 *
 */
const similarity = require('compute-cosine-similarity')
const BN = require('bn.js')
const { all, zip, splitEvery, reverse, fromPairs } = require('ramda')

const { blake2bl } = require('../utils/crypto')
const { Block, BcBlock, BcTransaction, ChildBlockHeader } = require('../protos/core_pb')

const MINIMUM_DIFFICULTY = new BN(11801972029393, 16)

/// /////////////////////////////////////////////////////////////////////
/// ////////////////////////
/// ////////////////////////  PART 1  - Dificulty of the next block
/// ////////////////////////
/// /////////////////////////////////////////////////////////////////////

/**
 * Determines the singularity height and difficulty
 *
 * @param {BN|Difficulty} x
 * @param {Number} parentBlockHeight
 * @returns {BN|Difficulty}
 */
export function getExpFactorDiff (calculatedDifficulty: BN, parentBlockHeight: number) {
  const big1 = new BN(1, 16)
  const big2 = new BN(2, 16)
  const expDiffPeriod = new BN(66000000, 16)

  // periodCount = (parentBlockHeight + 1) / 66000000
  let periodCount = new BN(parentBlockHeight).add(big1)
  periodCount = periodCount.div(expDiffPeriod)

  // if (periodCount > 2)
  if (periodCount.gt(big2) === true) {
    // return calculatedDifficulty + (2 ^ (periodCount - 2))
    let y = periodCount.sub(big2)
    y = big2.pow(y)
    calculatedDifficulty = calculatedDifficulty.add(y)
    return calculatedDifficulty
  }
  return calculatedDifficulty
}

/**
 * FUNCTION: getDiff(t)
 *   Gets the difficulty of a given blockchain without singularity calculation
 *
 * @param {Number|Epoch} currentBlockTime
 * @param {Number|Epoch} previousBlockTime
 * @param {Number} parentDiff
 * @param {Number} minimalDiffulty
 * @param {Number} handicap
 * @returns {BN|Difficulty}
 */
export function getDiff (currentBlockTime: number, previousBlockTime: number, previousDifficulty: number, minimalDiffulty: number, handicap: number = 0) {
  // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2.md

  let bigMinimalDifficulty = new BN(minimalDiffulty, 16)

  const bigPreviousBlockTime = new BN(previousBlockTime, 16)
  const bigPreviousDifficulty = new BN(previousDifficulty, 16)
  const bigCurentBlockTime = new BN(currentBlockTime, 16)
  const bigMinus99 = new BN(-99, 16)
  const big7 = new BN(7, 16)
  const big6 = new BN(6, 16)
  const big3 = new BN(3, 16)
  const big1 = new BN(1, 16)
  const big0 = new BN(0, 16)
  const elapsedTime = bigCurentBlockTime.sub(bigPreviousBlockTime)

  // if elapsedTime !== 0
  if (elapsedTime.eq(big0) === false) {
    // minimalDiffulty = minimalDiffulty / elapsedTime
    bigMinimalDifficulty = bigMinimalDifficulty.div(elapsedTime)
  } else {
    // minimalDiffulty = 1
    bigMinimalDifficulty = big1
  }

  let x
  let y

  // x = 1 - (elapsedTime / 6) + handicap
  x = elapsedTime // Get the window of time between bigCurentBlockTime - bigPreviousBlockTime
  x = x.div(big6) // Divide this difference by the seconds (in BN)
  x = big1.sub(x) // Move X to a negative / 0 val integer
  x = x.add(new BN(handicap, 16))

  // x = (x < 99) ? - 99 : x
  if (x.lt(bigMinus99) === true) {
    x = bigMinus99
  }

  // x === 0 && elapsedTime > 7
  if (x.eq(big0) === true && elapsedTime.gt(big7) === true) {
    // x = x - 1
    x = x.sub(big1) // Move X to a negative factor
  } else if (x.gt(big0) === true) {
    // x = (x * (6 - elapsedTime)) ^ 3
    x = x.mul(big6.sub(elapsedTime)).pow(big3) // Significantly decrease difficulty for slower blocks
  }

  // Divide the previous difficulty by the minimum difficulty
  if (bigMinimalDifficulty.eq(big0)) {
    y = big1
  } else {
    y = bigPreviousDifficulty.div(bigMinimalDifficulty)
  }

  // x = (x * y) + previousDifficulty
  x = x.mul(y) // Multiple the purposed difficulty by the minimalDiffulty bound
  x = x.add(bigPreviousDifficulty) // Add the previous parents difficulty to the purposed difficulty

  // x = Math.max(x, minimumDiff)
  if (x.lt(bigMinimalDifficulty) === true) {
    x = bigMinimalDifficulty // Force minimum difficulty
  }

  return x
}

export function createMerkleRoot (list: string[], prev: ?string): string {
  if (list.length > 0) {
    if (prev !== undefined) {
      // $FlowFixMe
      prev = blake2bl(prev + list.shift())
    } else {
      prev = blake2bl(list.shift())
    }
    return createMerkleRoot(list, prev)
  }
  // $FlowFixMe
  return prev
}

/// /////////////////////////////////////////////////////////////////////
/// ////////////////////////
/// ////////////////////////  PART 2 - Mining a Block
/// ////////////////////////
/// /////////////////////////////////////////////////////////////////////

/**
 * The Blake2BL hash of the proof of a block
 */
// const blockProofs = [
//   '9b80fc5cba6238801d745ca139ec639924d27ed004c22609d6d9409f1221b8ce', // BTC
//   '781ff33f4d7d36b3f599d8125fd74ed37e2a1564ddc3f06fb22e1b0bf668a4f7', // ETH
//   'e0f0d5bc8d1fd6d98fc6d1487a2d59b5ed406940cbd33f2f5f065a2594ff4c48', // LSK
//   'ef631e3582896d9eb9c9477fb09bf8d189afd9bae8f5a577c2107fd0760b022e', // WAV
//   'e2d5d4f3536cdfa49953fb4a96aa3b4a64fd40c157f1b3c69fb84b3e1693feb0', // NEO
//   '1f591769bc88e2307d207fc4ee5d519cd3c03e365fa16bf5f63f449b46d6cdef' // EMB (Block Collider)
// ]

/**
 *  Converts characters of string into ASCII codes
 *
 * @returns {Number|Array}
 */
export function split (t: string): number[] {
  return t.split('').map(function (an) {
    return an.charCodeAt(0)
  })
}

/**
 * Converts cosine similary to cos distance
 */
export function dist (x: number[], y: number[], clbk: ?Function) {
  let s
  if (arguments.length > 2) {
    s = similarity(x, y, clbk)
  } else {
    s = similarity(x, y)
  }
  return s !== null ? 1 - s : s
}

/**
 * Returns summed distances between two strings broken into of 8 bits
 *
 * @param {Hash} a
 * @param {Hash} b
 * @returns {Number}
 */
export function distance (a: string, b: string) {
  const aChunks = reverse(splitEvery(32, split(a)))
  const bChunks = splitEvery(32, split(b))
  const chunks = zip(aChunks, bChunks)

  const value = chunks.reduce(function (all, [a, b]) {
    return all + dist(b, a)
  }, 0)

  // TODO this is the previous implementation - because of
  // ac.pop() we need to reverse(aChunks) to produce same number
  // is that correct or just side-effect?
  // const value = bc.reduce(function (all, bd, i) {
  //   return all + dist(bd, ac.pop())
  // }, 0)
  return Math.floor(value * 1000000000000000) // TODO: Move to safe MATH
}

/**
 * Finds the mean of the distances from a provided set of hashed header proofs
 *
 * // @param {Array} work
 * @returns {Object} dist,nonce
 */
export function mine (work: string, miner: string, merkleRoot: string, threshold: number) {
  threshold = new BN(threshold, 16)
  let result

  // console.log('mining for threshold: ' + threshold)

  // TODO: @pm check
  while (true) {
  // if (i < 2) {
    let nonce = String(Math.random()) // random string
    let nonceHash = blake2bl(nonce)
    result = distance(work, blake2bl(miner + merkleRoot + nonceHash))
    if (new BN(result, 16).gt(new BN(threshold, 16)) === true) {
      return {
        distance: result,
        nonce: nonce
      }
    }
  }
}

/// /////////////////////////////////////////////////////////////////////
/// ////////////////////////
/// ////////////////////////  PART 3 - Blockchain Header Proofs
/// ////////////////////////
/// /////////////////////////////////////////////////////////////////////

/*
 * It will look like this:
 *
 *      function createBlockProof(blockchainFingerprint, rawBlock, callback)
 *
 * Where the fingerprint for Ethereum is "bbe5c469c469cec1f8c0b01de640df724f3d9053c23b19c6ed1bc6ee0faf5160"
 * as seen in bcnode/src/utils/templates/blockchain_fingerprints.json
 *
 */

export function getChildrenBlocksHashes (previousBlocks: Block[]): string[] {
  return previousBlocks.map(block => blake2bl(block.getHash() + block.getMerkleRoot()))
}

export function getChildrenRootHash (previousBlockHashes: string[]): BN {
  return previousBlockHashes.reduce((all: BN, blockHash) => {
    return all.xor(new BN(Buffer.from(blockHash, 'hex')))
  }, new BN(0))
}

export function getParentShareDiff (parentDifficulty: number, childChainCount: number): BN {
  return (new BN(parentDifficulty, 16)).div(new BN(childChainCount, 16))
}

export function getMinimumDifficulty (childChainCount: number): BN {
  // Standard deviation 100M cycles divided by the number of chains
  return MINIMUM_DIFFICULTY.div(new BN(childChainCount, 16))
}

function calculateHandicap (childrenPreviousBlocks: ChildBlockHeader[], childrenCurrentBlocks: ChildBlockHeader[]) {
  // If none of the chains have increased in height
  if (allChildBlocksHaveSameTimestamp(childrenPreviousBlocks, childrenCurrentBlocks)) {
    return 4
  }
  return 0
}

function allChildBlocksHaveSameTimestamp (childrenPreviousBlocks: ChildBlockHeader[], childrenCurrentBlocks: ChildBlockHeader[]) {
  const previousBlockTimestamps = childrenPreviousBlocks.map(block => block.getTimestamp())
  const currentBlockTimestamps = childrenCurrentBlocks.map(block => block.getTimestamp())
  const tsPairs = zip(previousBlockTimestamps, currentBlockTimestamps)
  return all(r => r, tsPairs.map(([previousTs, currentTs]) => previousTs === currentTs))
}

// TODO rename arguments to better describe data
export function getNewPreExpDifficulty (
  previousBlock: BcBlock,
  parentShareDiff: BN,
  minimumDiffShare: BN,
  childrenPreviousBlocks: ChildBlockHeader[],
  childrenCurrentBlocks: ChildBlockHeader[]
) {
  let handicap = calculateHandicap(childrenPreviousBlocks, childrenCurrentBlocks)

  const currentChildrenDifficulty = getDiff(
    (Date.now() / 1000) << 0, // TODO inject current date
    previousBlock.getTimestamp(),
    minimumDiffShare,
    MINIMUM_DIFFICULTY,
    handicap
  )

  const newDifficulty: BN = zip(childrenPreviousBlocks, childrenCurrentBlocks).reduce((sum: BN, [previousHeader, currentHeader]) => {
    // TODO @pm - basic confirmation count is 0 - we can't divide by 0 here, should we start from 1 then?
    const confirmationCount = (currentHeader.getChildBlockConfirmationsInParentCount()) ? currentHeader.getChildBlockConfirmationsInParentCount() : 1
    const timeBonus = (currentHeader.getTimestamp() - previousHeader.getTimestamp()) / confirmationCount
    return sum.add(
      getDiff(
        previousHeader.getTimestamp() + timeBonus,
        previousHeader.getTimestamp(),
        parentShareDiff,
        minimumDiffShare
      )
    )
  }, new BN(0))

  newDifficulty.add(currentChildrenDifficulty)

  const preExpDiff = getDiff(
    (Date.now() / 1000) << 0,
    previousBlock.getTimestamp(),
    MINIMUM_DIFFICULTY,
    newDifficulty
  ) // Calculate the final pre-singularity difficulty adjustment

  return preExpDiff
}

export function prepareWork (previousBlock: BcBlock, childrenCurrentBlocks: Block[]): string {
  const newChainRoot = getChildrenRootHash(getChildrenBlocksHashes(childrenCurrentBlocks))
  const work = blake2bl(
    newChainRoot.xor(
      new BN(
        Buffer.from(
          blake2bl(previousBlock.getHash() + previousBlock.getMerkleRoot()),
          'hex'
        )
      )
    ).toString()
  )

  return work
}

/**
 * Create a ChildBlockHeader[] for new BcBlock, before count new confirmation count for each child block.
 *
 * Assumption here is that confirmation count of all headers from previous block is taken and incrementend by one
 * except for the one which caused the new block being mine - for that case is is reset to 0
 */
function prepareChildBlockHeadersList (previousBlock: BcBlock, currentBlocks: Block[], newChildBlock: Block): ChildBlockHeader[] {
  const newChildBlockConfirmations = fromPairs(previousBlock.getChildBlockHeadersList().map(header => {
    // TODO @pm - basic confirmation count is 0 - we can't divide by 0, should we start from 1 then?
    const confirmationCount = (header.getBlockchain() === newChildBlock.getBlockchain()) ? 1 : header.getChildBlockConfirmationsInParentCount() + 1
    return [header.getBlockchain(), confirmationCount]
  }))
  return currentBlocks.map(currentBlock => {
    const header = new ChildBlockHeader()
    header.setBlockchain(currentBlock.getBlockchain())
    header.setHash(currentBlock.getHash())
    header.setPreviousHash(currentBlock.getPreviousHash())
    header.setTimestamp(currentBlock.getTimestamp())
    header.setHeight(currentBlock.getHeight())
    header.setMerkleRoot(currentBlock.getMerkleRoot())
    header.setChildBlockConfirmationsInParentCount(newChildBlockConfirmations[currentBlock.getBlockchain()])
    return header
  })
}

export function prepareNewBlock (previousBlock: BcBlock, childrenCurrentBlocks: Block[], blockWhichTriggeredMining: Block, newTransactions: BcTransaction[], minerAddress: string): BcBlock {
  const blockHashes = getChildrenBlocksHashes(childrenCurrentBlocks)
  const newChainRoot = getChildrenRootHash(blockHashes)

  const childBlockHeadersList = prepareChildBlockHeadersList(previousBlock, childrenCurrentBlocks, blockWhichTriggeredMining)

  const parentShareDiff = getParentShareDiff(previousBlock.getDifficulty(), blockHashes.length)
  const minimumDiffShare = getMinimumDifficulty(blockHashes.length)
  const preExpDiff = getNewPreExpDifficulty(
    previousBlock,
    parentShareDiff,
    minimumDiffShare,
    previousBlock.getChildBlockHeadersList(),
    childBlockHeadersList
  )

  const oldTransactions = previousBlock.getTransactionsList()
  const newMerkleRoot = createMerkleRoot(
    blockHashes.concat(oldTransactions.concat([minerAddress, 1]))
  ) // blockchains, transactions, miner address, height

  const newBlock = new BcBlock()
  newBlock.setHash(blake2bl(previousBlock.getHash() + newMerkleRoot))
  newBlock.setHeight(previousBlock.getHeight() + 1)
  newBlock.setMiner(minerAddress)
  newBlock.setDifficulty(getExpFactorDiff(preExpDiff, previousBlock.getHeight()).toNumber())
  // TODO remove - should be assigned after mining
  // newBlock.setTimestamp(Date.now())
  newBlock.setMerkleRoot(newMerkleRoot)
  newBlock.setChainRoot(blake2bl(newChainRoot.toString()))
  newBlock.setDistance(0)
  newBlock.setTxCount(0)
  // TODO remove - should be assigned after mining
  // newBlock.setNonce(0)
  newBlock.setTransactionsList(newTransactions)
  newBlock.setChildBlockchainCount(childrenCurrentBlocks.length)
  newBlock.setChildBlockHeadersList(childBlockHeadersList)

  return newBlock
}
