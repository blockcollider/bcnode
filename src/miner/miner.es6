/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @no-flow
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
const _ = require('lodash')

const { blake2bl } = require('../utils/crypto')
const { Block, BcBlock, BcTransaction } = require('../protos/core_pb')

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
export function getExpFactorDiff (x, parentBlockHeight) {
  const big1 = new BN(1, 16)
  const big2 = new BN(2, 16)
  const expDiffPeriod = new BN(66000000, 16)

  let periodCount = new BN(parentBlockHeight).add(big1)
  periodCount = periodCount.div(expDiffPeriod)

  if (periodCount.gt(big2) === true) {
    let y = periodCount.sub(big2)
    y = big2.pow(y)
    x = x.add(y)
    return x
  }
  return x
}

/**
 * FUNCTION: getDiff(t)
 *   Gets the difficulty of a given blockchain without singularity calculation
 *
 * @param {Number|Epoch} blockTime
 * @param {Number|Epoch} parentTime
 * @param {Number} parentDiff
 * @param {Number} minimumDiff
 * @param {Number} handicap
 * @returns {BN|Difficulty}
 */
export function getDiff (blockTime, parentTime, parentDiff, minimumDiff, handicap) {
  // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2.md

  let bigMinDiff = new BN(minimumDiff, 16)

  const bigParentTime = new BN(parentTime, 16)
  const bigParentDiff = new BN(parentDiff, 16)
  const bigBlockTime = new BN(blockTime, 16)
  const bigMinus99 = new BN(-99, 16)
  // const big10 = new BN(10, 16)
  const big7 = new BN(7, 16)
  const big5 = new BN(5, 16)
  // const big4 = new BN(4, 16)
  const big3 = new BN(3, 16)
  // const big2 = new BN(2, 16)
  const big1 = new BN(1, 16)
  const big0 = new BN(0, 16)
  const elapsedTime = bigBlockTime.sub(bigParentTime)
  // const periodBounds = elapsedTime.div(big5)

  if (elapsedTime.eq(big0) === false) {
    bigMinDiff = bigMinDiff.div(elapsedTime)
  } else {
    bigMinDiff = big1
  }

  let x
  let y

  x = bigBlockTime.sub(bigParentTime) // Get the window of time between bigBlockTime - bigParentTime
  x = x.div(big5) // Divide this difference by the seconds (in BN)
  x = big1.sub(x) // Move X to a negative / 0 val integer

  if (handicap !== undefined && handicap !== false) {
    x = x.add(new BN(handicap, 16))
  }

  if (x.lt(bigMinus99) === true) {
    x = bigMinus99
  }

  if (x.eq(big0) === true && elapsedTime.gt(big7) === true) {
    x = x.sub(big1) // Move X to a negative factor
  } else if (x.gt(big0) === true) {
    x = x.mul(big5.sub(elapsedTime)).pow(big3) // Significantly decrease difficulty for slower blocks
  }

  y = bigParentDiff.div(bigMinDiff) // Divide the parent difficulty by the minimum difficulty
  x = x.mul(y) // Multiple the purposed difficulty by the mindiff bound
  x = x.add(bigParentDiff) // Add the previous parents difficulty to the purposed difficulty

  if (x.lt(bigMinDiff) === true) {
    x = bigMinDiff // Force minimum difficulty
  }

  return x
}

export function createMerkleRoot (list, prev) {
  if (list.length > 0) {
    if (prev !== undefined) {
      prev = blake2bl(prev + list.shift())
    } else {
      prev = blake2bl(list.shift())
    }
    return createMerkleRoot(list, prev)
  }
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
export function split (t) {
  return t.split('').map(function (an) {
    return an.charCodeAt(0)
  })
}

/**
 * Converts cosine similary to cos distance
 */
export function dist (x, y, clbk) {
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
export function distance (a, b) {
  const ac = _.chunk(split(a), 32)
  const bc = _.chunk(split(b), 32)

  const value = bc.reduce(function (all, bd, i) {
    return all + dist(bd, ac.pop())
  }, 0)

  return Math.floor(value * 1000000000000000) // TODO: Move to safe MATH
}

/**
 * Finds the mean of the distances from a provided set of hashed header proofs
 *
 * // @param {Array} work
 * @returns {Object} dist,nonce
 */
export function mine (work, miner, merkleRoot, threshold, rng = Math.random) {
  threshold = new BN(threshold, 16)
  let result

  console.log('mining for threshold: ' + threshold)

  // TODO: @pm check
  while (true) {
  // if (i < 2) {
    let nonce = String(rng()) // random string
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
  return previousBlockHashes.reduce((all, blockHash) => {
    return all.xor(new BN(Buffer.from(blockHash, 'hex')))
  }, new BN(0))
}

export function compareTimestamps (a: Block, b: Block) {
  return a.getTimestamp() === b.getTimestamp()
}

export function getParentShareDiff (parentDifficulty: number, childChainCount: number): BN {
  return (new BN(parentDifficulty, 16)).div(new BN(childChainCount + 1, 16))
}

export function getMinimumDifficulty (childChainCount: number): BN {
  // Standard deviation 100M cycles divided by the number of chains
  return MINIMUM_DIFFICULTY.div(new BN(childChainCount, 16))
}

// TODO rename arguments to better describe data
export function getNewPreExpDifficulty (previousBlock: BcBlock, parentShareDiff: BN, minimumDiffShare: BN, childrenPreviousBlocks: Block[], childrenCurrentBlocks: Block[]) {
  let handicap = 0
  // TODO reduce pairs with accum start = false
  const timestampEquality = [
    compareTimestamps(childrenPreviousBlocks[0], childrenCurrentBlocks[0]),
    compareTimestamps(childrenPreviousBlocks[1], childrenCurrentBlocks[1]),
    compareTimestamps(childrenPreviousBlocks[2], childrenCurrentBlocks[2]),
    compareTimestamps(childrenPreviousBlocks[3], childrenCurrentBlocks[3]),
    compareTimestamps(childrenPreviousBlocks[4], childrenCurrentBlocks[4])
  ]

  if (_.every(timestampEquality) === true) {
    // If none of the chains have increased in height
    handicap = 4
  }

  const blockColliderShareDiff = getDiff(
    (Date.now() / 1000) << 0, // TODO inject current date
    previousBlock.getTimestamp(),
    minimumDiffShare,
    parentShareDiff,
    handicap
  )

  const newDifficulty = childrenCurrentBlocks.reduce(function (sum, header, i) {
    return sum.add(
      getDiff(
        header.getTimestamp(),
        childrenPreviousBlocks[i].getTimestamp(),
        parentShareDiff,
        minimumDiffShare
      )
    )
  }, new BN(0))

  newDifficulty.add(blockColliderShareDiff) // Add the Block Collider's chain to the values

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

export function prepareNewBlock (previousBlock: BcBlock, childrenPreviousBlocks: Block[], childrenCurrentBlocks: Block[], newTransactions: BcTransaction[], minerAddress: string): BcBlock {
  const blockHashes = getChildrenBlocksHashes(childrenCurrentBlocks)
  const newChainRoot = getChildrenRootHash(blockHashes)

  const parentShareDiff = getParentShareDiff(previousBlock.getDifficulty(), blockHashes.length)
  const minimumDiffShare = getMinimumDifficulty(blockHashes.length)
  const preExpDiff = getNewPreExpDifficulty(
    previousBlock,
    parentShareDiff,
    minimumDiffShare,
    childrenPreviousBlocks,
    childrenCurrentBlocks
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
  newBlock.setChildBlockHeadersList(childrenCurrentBlocks)

  return newBlock
}
