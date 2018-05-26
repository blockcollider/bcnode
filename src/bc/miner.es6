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
  call,
  compose,
  difference,
  flip,
  invoker,
  join,
  map,
  // $FlowFixMe - missing in ramda flow-typed annotation
  partialRight,
  reduce,
  repeat,
  reverse,
  splitEvery,
  zip,
  zipWith
} = require('ramda')

const { blake2bl } = require('../utils/crypto')
const { Block, BcBlock, BcTransaction, ChildBlockHeader, ChildBlockHeaders } = require('../protos/core_pb')
const ts = require('../utils/time').default // ES6 default export

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
 * @param newBlockCount
 * @returns
 */
export function getDiff (currentBlockTime: number, previousBlockTime: number, previousDifficulty: number, minimalDiffulty: number, newBlockCount: number): BN {
  // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2.md

  let bigMinimalDifficulty = new BN(minimalDiffulty, 16)

  const bigPreviousBlockTime = new BN(previousBlockTime, 16)
  const bigPreviousDifficulty = new BN(previousDifficulty, 16)
  const bigCurentBlockTime = new BN(currentBlockTime, 16)
  const bigMinus99 = new BN(-99, 16)
  const big1 = new BN(1, 16)
  const big0 = new BN(0, 16)
  const bigTargetTimeWindow = new BN(6, 16)
  let elapsedTime = bigCurentBlockTime.sub(bigPreviousBlockTime)

  // elapsedTime + ((elapsedTime - 4) * newBlocks)
  const elapsedTimeBonus = elapsedTime.add(elapsedTime.sub(new BN(4, 16)).mul(new BN(newBlockCount, 16)))

  if (elapsedTimeBonus.gt(big0)) {
    elapsedTime = elapsedTimeBonus
  }

  // x = 1 - floor(x / handicap)
  let x = big1.sub(elapsedTime.div(bigTargetTimeWindow)) // div floors by default
  let y

  // x < -99 ? -99 : x
  if (x.lt(bigMinus99)) {
    x = bigMinus99
  }

  // y = previousDifficulty / 148 // 148 = 74 * 2 or the maximum absolute distance of two characters converted from ASCII code.
  y = bigPreviousDifficulty.div(new BN(148))
  // x = x * y
  x = x.mul(y)
  // x = x + previousDifficulty
  x = x.add(bigPreviousDifficulty)

  // x < minimalDiffulty
  if (x.lt(bigMinimalDifficulty)) {
    return bigMinimalDifficulty
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
 * @param {function} difficultyCalculator function for recalculating difficulty at given timestamp
 * @returns {Object} result containing found `nonce` and `distance` where distance is > `threshold` provided as parameter
 */
// $FlowFixMe will never return anything else then a mining result
export function mine (currentTimestamp: number, work: string, miner: string, merkleRoot: string, threshold: number, difficultyCalculator: ?Function): { distance: number, nonce: string, timestamp: number, difficulty: number } {
  let difficulty = threshold
  let result
  const tsStart = ts.now()
  const maxCalculationEnd = tsStart + (10 * 1000)
  let currentLoopTimestamp = currentTimestamp

  let iterations = 0
  let res = null
  while (true) {
    iterations += 1

    if (maxCalculationEnd < ts.now()) {
      break
    }
    // TODO optimize not to count each single loop
    let now = ts.nowSeconds()
    // recalculate difficulty each second
    if (difficultyCalculator && currentLoopTimestamp < now) {
      currentLoopTimestamp = now
      difficulty = difficultyCalculator(now)
      console.log(`In timestamp: ${currentLoopTimestamp} recalculated difficulty is: ${difficulty}`)
    }

    let nonce = String(Math.random()) // random string
    let nonceHash = blake2bl(nonce)
    result = distance(work, blake2bl(miner + merkleRoot + nonceHash + currentLoopTimestamp))
    if (new BN(result, 16).gt(new BN(difficulty, 16)) === true) {
      res = {
        distance: result,
        nonce,
        timestamp: currentLoopTimestamp,
        difficulty,
        // NOTE: Following fields are for debug purposes only
        iterations,
        timeDiff: ts.now() - tsStart
      }
      break
    }
  }

  const tsEnd = ts.now()
  const tsDiff = tsEnd - tsStart
  if (res === null) {
    throw Error(`Mining took more than 10s, iterations: ${iterations}, tsDiff: ${tsDiff} ending...`)
  }

  return res
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

// TODO rename arguments to better describe data
export function getNewPreExpDifficulty (
  currentTimestamp: number,
  lastPreviousBlock: BcBlock,
  newBlockCount: number
) {
  const preExpDiff = getDiff(
    currentTimestamp,
    lastPreviousBlock.getTimestamp(),
    lastPreviousBlock.getDifficulty(),
    MINIMUM_DIFFICULTY,
    newBlockCount
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
 * Create a ChildBlockHeader{} for new BcBlock, before count new confirmation count for each child block.
 *
 * Assumption here is that confirmation count of all headers from previous block is taken and incrementend by one
 * except for the one which caused the new block being mine - for that case is is reset to 1
 *
 * We're starting from 1 here because it is used for dividing
 *
 * @param {BcBlock} previousBlock Last known previously mined BC block
 * @param {Block} newChildBlock The last rovered block - this one triggered the mining
 * @param {bool} shouldAppend flags if the newChildBlock should be appended to a child block sublist or replace
 * @return {ChildBlockHeader[]} Headers of rovered chains with confirmations count calculated
 */
function prepareChildBlockHeadersMap (previousBlock: BcBlock, newChildBlock: Block, shouldAppend: bool): ChildBlockHeaders {
  const copyHeader = (block: ChildBlockHeader|Block, confirmations: number): ChildBlockHeader => {
    const header = new ChildBlockHeader()
    header.setBlockchain(block.getBlockchain())
    header.setHash(block.getHash())
    header.setPreviousHash(block.getPreviousHash())
    header.setTimestamp(block.getTimestamp())
    header.setHeight(block.getHeight())
    header.setMerkleRoot(block.getMerkleRoot())
    header.setChildBlockConfirmationsInParentCount(confirmations)
    return header
  }

  if (newChildBlock.toObject().hash === '0xb9835f19d0abbc7142850df04d4e878f49c556bbcbc92eab9f07d8fb448b3f68') {
  }
  const chainWhichTriggeredMining = newChildBlock.getBlockchain()
  const newMap = new ChildBlockHeaders()
  Object.keys(previousBlock.getChildBlockHeaders().toObject())
    .forEach((chainKeyName) => {
      const chain = chainKeyName.replace(/List$/, '')
      const methodNameGet = `get${chain[0].toUpperCase() + chain.slice(1)}List` // e.g. getBtcList
      const methodNameSet = `set${chain[0].toUpperCase() + chain.slice(1)}List` // e.g. setBtcList

      const updatedHeaders = previousBlock.getChildBlockHeaders()[methodNameGet]()
        .map(header => {
          if (chainWhichTriggeredMining === chain) {
            return copyHeader(newChildBlock, 1)
          }

          return copyHeader(header, header.getChildBlockConfirmationsInParentCount() + 1)
        })

      if (shouldAppend) {
        updatedHeaders.push(copyHeader(newChildBlock, 1))
      }

      newMap[methodNameSet](updatedHeaders)
    })

  return newMap
}

/**
 * How many new child blocks are between previousBlockHeaders and currentBlockHeaders
 */
export function getNewBlockCount (previousBlockHeaders: ChildBlockHeaders, currentBlockHeaders: ChildBlockHeaders) {
  // $FlowFixMe - protbuf toObject is not typed
  const headersToHashes = (headers: ChildBlockHeaders) => Object.values(headers.toObject()).reduce((acc, curr) => acc.concat(curr), []).map(headerObj => headerObj.hash)
  const previousHashes = headersToHashes(previousBlockHeaders)
  const currentHashes = headersToHashes(currentBlockHeaders)

  return difference(currentHashes, previousHashes).length
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
 * @param {BcBlock} lastPreviousBlock Last known previously mined BC block
 * @param {Block[]} childrenCurrentBlocks Last know rovered blocks from each chain
 * @param {Block} blockWhichTriggeredMining The last rovered block - this one triggered the mining
 * @param {BcTransaction[]} newTransactions Transactions which will be added to newly mined block
 * @param {string} minerAddress Public addres to which NRG award for mining the block and transactions will be credited to
 * @param {BcBlock} unfinishedBlock If miner was running this is the block currently mined
 * @return {BcBlock} Prepared structure of the new BC block, does not contain `nonce` and `distance` which will be filled after successful mining of the block
 */
export function prepareNewBlock (currentTimestamp: number, lastPreviousBlock: BcBlock, childrenCurrentBlocks: Block[], blockWhichTriggeredMining: Block, newTransactions: BcTransaction[], minerAddress: string, unfinishedBlock: ?BcBlock): [BcBlock, number] {
  const blockHashes = getChildrenBlocksHashes(childrenCurrentBlocks)
  const newChainRoot = getChildrenRootHash(blockHashes)

  const shouldAppend = !!unfinishedBlock
  const childBlockHeaders = prepareChildBlockHeadersMap(
    unfinishedBlock || lastPreviousBlock,
    blockWhichTriggeredMining,
    shouldAppend
  )

  const newBlockCount = getNewBlockCount(lastPreviousBlock.getChildBlockHeaders(), childBlockHeaders)

  let finalDifficulty
  let finalTimestamp = currentTimestamp

  // recalculate difficulty to be < 2^53-1
  while (true) {
    try {
      const preExpDiff = getNewPreExpDifficulty(
        finalTimestamp,
        lastPreviousBlock,
        newBlockCount
      )
      finalDifficulty = getExpFactorDiff(preExpDiff, lastPreviousBlock.getHeight()).toNumber()
      break
    } catch (e) {
      finalTimestamp += 1
      console.log(`Recalculating difficulty in prepareNewBlock with new finalTimestamp: ${finalTimestamp}`)
      continue
    }
  }

  const oldTransactions = lastPreviousBlock.getTransactionsList()
  const newMerkleRoot = createMerkleRoot(
    blockHashes.concat(oldTransactions.concat([minerAddress, 1]))
  ) // blockchains, transactions, miner address, height

  const newBlock = new BcBlock()
  newBlock.setHash(blake2bl(lastPreviousBlock.getHash() + newMerkleRoot))
  newBlock.setHeight(lastPreviousBlock.getHeight() + 1)
  newBlock.setMiner(minerAddress)
  newBlock.setDifficulty(finalDifficulty)
  newBlock.setMerkleRoot(newMerkleRoot)
  newBlock.setChainRoot(blake2bl(newChainRoot.toString()))
  newBlock.setDistance(0)
  newBlock.setTxCount(0)
  newBlock.setTransactionsList(newTransactions)
  newBlock.setChildBlockchainCount(childrenCurrentBlocks.length)
  newBlock.setChildBlockHeaders(childBlockHeaders)

  return [newBlock, finalTimestamp]
}
