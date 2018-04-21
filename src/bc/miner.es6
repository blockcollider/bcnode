/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * TODO: Fix flow issues
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
const {
  all,
  call,
  compose,
  flip,
  fromPairs,
  invoker,
  join,
  map,
  partialRight,
  reduce,
  repeat,
  reverse,
  splitEvery,
  transpose,
  zip,
  zipWith
} = require('ramda')

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
 * @param calculatedDifficulty
 * @param parentBlockHeight
 * @returns a
 */
export function getExpFactorDiff (calculatedDifficulty: BN, parentBlockHeight: number): BN {
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
 * @param currentBlockTime
 * @param previousBlockTime
 * @param previousDifficulty
 * @param minimalDiffulty
 * @param handicap
 * @returns
 */
export function getDiff (currentBlockTime: number, previousBlockTime: number, previousDifficulty: number, minimalDiffulty: number, handicap: number = 0): BN {
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
export function dist (x: number[], y: number[], clbk: ?Function): number {
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
 * @param {string} a
 * @param {string} b
 * @returns {number} cosine distance between two strings
 */
export function distance (a: string, b: string): number {
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
 * @param {number} currentTimestamp current time reference
 * @param {string} work reference to find distance > `threshold`
 * @param {string} miner Public address to which NRG award for mining the block and transactions will be credited to
 * @param {string} merkleRoot Mekle root of the BC block being mined
 * @param {number} threshold threshold for the result to be valid
 * @returns {Object} result containing found `nonce` and `distance` where distance is > `threshold` provided as parameter
 */
export function mine (currentTimestamp: number, work: string, miner: string, merkleRoot: string, threshold: number) {
  threshold = new BN(threshold, 16)
  let result

  // TODO: @pm check
  while (true) {
    let nonce = String(Math.random()) // random string
    let nonceHash = blake2bl(nonce)
    result = distance(work, blake2bl(miner + merkleRoot + nonceHash + currentTimestamp))
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
const toHexBuffer: ((string) => Buffer) = partialRight(invoker(2, 'from'), ['hex', Buffer])
const hash: ((ChildBlockHeader|Block) => string) = invoker(0, 'getHash')
const timestamp: ((ChildBlockHeader|Block) => number) = invoker(0, 'getTimestamp')
const merkleRoot: ((ChildBlockHeader|Block) => string) = invoker(0, 'getMerkleRoot')

/**
 * Computes hash form a rovered block header as blake2bl(hash + mekleRoot)
 * @param {ChildBlockHeader|Block} block to hash
 * @return {string} hash of the block
 */
const blockHash: (ChildBlockHeader|Block => string) = compose(
  blake2bl,
  join(''),
  zipWith(call, [hash, merkleRoot]),
  flip(repeat)(2)
)

export const getChildrenBlocksHashes: ((ChildBlockHeader[]|Block[]) => string[]) = map(blockHash)

export const getChildrenRootHash = reduce((all: BN, blockHash: string) => {
  return all.xor(new BN(toHexBuffer(blockHash)))
}, new BN(0))

export function getParentShareDiff (parentDifficulty: number, childChainCount: number): BN {
  return (new BN(parentDifficulty, 16)).div(new BN(childChainCount, 16))
}

export function getMinimumDifficulty (childChainCount: number): BN {
  // Standard deviation 100M cycles divided by the number of chains
  return MINIMUM_DIFFICULTY.div(new BN(childChainCount, 16))
}

/**
 * Calculate handicap between headers of previous and latest BC block
 * If none of the chains have increased in height 4, else 0
 *
 * @param {ChildBlockHeader[]} childrenPreviousBlocks array of rovered block headers used in last-1 BC block
 * @param {ChildBlockHeader[]} childrenCurrentBlocks array of rovered block headers used in last known BC block
 * @return {number} handicap
 */
export function calculateHandicap (childrenPreviousBlocks: ChildBlockHeader[], childrenCurrentBlocks: ChildBlockHeader[]) {
  if (allChildBlocksHaveSameTimestamp(childrenPreviousBlocks, childrenCurrentBlocks)) {
    return 4
  }

  return 0
}

/**
 * Compares two arrays' of `ChildBlockHeader` timestamps and returns if some of the timestamps did change or all are the same
 *
 * @param {ChildBlockHeader[]} childrenPreviousBlocks array of rovered block headers used in last-1 BC block
 * @param {ChildBlockHeader[]} childrenCurrentBlocks array of rovered block headers used in last known BC block
 * @return {bool} `false` some of the timestamps did change or `true` all are the same
 */
function allChildBlocksHaveSameTimestamp (childrenPreviousBlocks: ChildBlockHeader[], childrenCurrentBlocks: ChildBlockHeader[]): bool {
  const tsPairs = zipWith(call, [map(timestamp), map(timestamp)], [childrenPreviousBlocks, childrenCurrentBlocks])
  return all(r => r, transpose(tsPairs).map(([previousTs, currentTs]) => previousTs === currentTs))
}

// TODO rename arguments to better describe data
export function getNewPreExpDifficulty (
  currentTimestamp: number,
  previousBlock: BcBlock,
  parentShareDiff: BN,
  minimumDiffShare: BN,
  childrenPreviousBlocks: ChildBlockHeader[],
  childrenCurrentBlocks: ChildBlockHeader[]
) {
  let handicap = calculateHandicap(childrenPreviousBlocks, childrenCurrentBlocks)

  const currentChildrenDifficulty = getDiff(
    currentTimestamp,
    previousBlock.getTimestamp(),
    minimumDiffShare,
    MINIMUM_DIFFICULTY,
    handicap
  )

  const newDifficulty: BN = zip(childrenPreviousBlocks, childrenCurrentBlocks).reduce((sum: BN, [previousHeader, currentHeader]) => {
    // TODO @pm - basic confirmation count is 0 - we can't divide by 0 here, should we start from 1 then?
    const confirmationCount = (currentHeader.getChildBlockConfirmationsInParentCount()) ? currentHeader.getChildBlockConfirmationsInParentCount() : 1
    // TODO now here is always used previousBlock but in most of childrenCurrentBlocks the previousBlock is not the one in which this rovered block appeared first
    // in such case we need to have a block (and get timestamp for it) at height = previousBlock.getHeight() - currentHeader.getChildBlockConfirmationsInParentCount() - 1
    const timeBonus = (currentHeader.getTimestamp() - previousBlock.getTimestamp()) / confirmationCount
    return sum.add(
      getDiff(
        previousBlock.getTimestamp() + timeBonus,
        previousBlock.getTimestamp(),
        parentShareDiff,
        minimumDiffShare
      )
    )
  }, new BN(0))

  newDifficulty.add(currentChildrenDifficulty)

  const preExpDiff = getDiff(
    currentTimestamp,
    previousBlock.getTimestamp(),
    MINIMUM_DIFFICULTY,
    newDifficulty
  ) // Calculate the final pre-singularity difficulty adjustment

  return preExpDiff
}

/**
 * Return the `work` - string to which the distance is being guessed while mining
 *
 * @param {BcBlock} previousBlock Last known previously mined BC block
 * @param {Block[]} childrenCurrentBlocks Last know rovered blocks from each chain (one of them is the one which triggered mining)
 * @return {string} a hash representing the work
 */
export function prepareWork (previousBlock: BcBlock, childrenCurrentBlocks: Block[]): string {
  const newChainRoot = getChildrenRootHash(getChildrenBlocksHashes(childrenCurrentBlocks))
  const work = blake2bl(
    newChainRoot.xor(
      new BN(
        toHexBuffer(blockHash(previousBlock))
      )
    ).toString()
  )

  return work
}

/**
 * Create a ChildBlockHeader[] for new BcBlock, before count new confirmation count for each child block.
 *
 * Assumption here is that confirmation count of all headers from previous block is taken and incrementend by one
 * except for the one which caused the new block being mine - for that case is is reset to 1
 *
 * We're starting from 1 here because it is used for dividing
 *
 * @param {BcBlock} previousBlock Last known previously mined BC block
 * @param {Block[]} currentBlocks Last know rovered blocks from each chain
 * @param {Block} newChildBlock The last rovered block - this one triggered the mining
 * @return {ChildBlockHeader[]} Headers of rovered chains with confirmations count calculated
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

/**
 * Used for preparing yet non existant BC block protobuf structure. Use before mining starts.
 *
 * - calculates block difficulty (from previous BC block difficulty and height, rovered chains count, and data in child chains headers) and stores it to structure
 * - stores headers of child chains (those being rovered)
 * - calculates new merkle root, hash and stores it to structure
 * - calculates new block height (previous + 1) and stores it to structure
 *
 * @param {number} currentTimestamp current timestamp reference
 * @param {BcBlock} previousBlock Last known previously mined BC block
 * @param {Block[]} childrenCurrentBlocks Last know rovered blocks from each chain
 * @param {Block} blockWhichTriggeredMining The last rovered block - this one triggered the mining
 * @param {BcTransaction[]} newTransactions Transactions which will be added to newly mined block
 * @param {string} minerAddress Public addres to which NRG award for mining the block and transactions will be credited to
 * @return {BcBlock} Prepared structure of the new BC block, does not contain `nonce` and `distance` which will be filled after successful mining of the block
 */
export function prepareNewBlock (currentTimestamp: number, previousBlock: BcBlock, childrenCurrentBlocks: Block[], blockWhichTriggeredMining: Block, newTransactions: BcTransaction[], minerAddress: string): BcBlock {
  const blockHashes = getChildrenBlocksHashes(childrenCurrentBlocks)
  const newChainRoot = getChildrenRootHash(blockHashes)

  const childBlockHeadersList = prepareChildBlockHeadersList(previousBlock, childrenCurrentBlocks, blockWhichTriggeredMining)

  const parentShareDiff = getParentShareDiff(previousBlock.getDifficulty(), blockHashes.length)
  const minimumDiffShare = getMinimumDifficulty(blockHashes.length)
  const preExpDiff = getNewPreExpDifficulty(
    currentTimestamp,
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
  newBlock.setMerkleRoot(newMerkleRoot)
  newBlock.setChainRoot(blake2bl(newChainRoot.toString()))
  newBlock.setDistance(0)
  newBlock.setTxCount(0)
  newBlock.setTransactionsList(newTransactions)
  newBlock.setChildBlockchainCount(childrenCurrentBlocks.length)
  newBlock.setChildBlockHeadersList(childBlockHeadersList)

  return newBlock
}
