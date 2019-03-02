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
 *      PART 1: Difficulty of the next block [COMPLETE]
 *
 *      PART 2: Mining a block hash [COMPLETE]
 *
 *      PART 3: Blockchain header proofs [IN PROGRESS]
 *
 *      PART 4: Create Block Collider Block Hash  [COMPLETE]
 *
 */

import type { Logger } from 'winston'
import type { BlockLikeObject } from '../types'

const { inspect } = require('util')
const similarity = require('compute-cosine-similarity')
const BN = require('bn.js')
const Random = require('random-js')
const {
  difference,
  groupBy,
  invoker,
  isEmpty,
  last,
  map,
  // $FlowFixMe - missing in ramda flow-typed annotation
  partialRight,
  reduce,
  reverse,
  splitEvery,
  toPairs,
  zip
} = require('ramda')
const debug = require('debug')('bcnode:primitives')

const { blake2bl } = require('../utils/crypto')
const { concatAll } = require('../utils/ramda')
const { Block, BcBlock, MarkedTransaction, Transaction, BlockchainHeader, BlockchainHeaders } = require('../protos/core_pb')
const ts = require('../utils/time').default // ES6 default export
const GENESIS_DATA = require('../bc/genesis.raw')

// testnet: 11801972029393
export const MINIMUM_DIFFICULTY = new BN(291112262029012)
const MAX_TIMEOUT_SECONDS = 45
const BC_BT_VALIDATION = process.env.BC_BT_VALIDATION === 'true'

const logging = require('../logger')
const logger: Logger = logging.getLogger(__filename)

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
  const big1 = new BN(1)
  const big2 = new BN(2)
  const expDiffPeriod = new BN(66000000)

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
 * @param minimalDifficulty
 * @param newBlockCount
 * @returns
 */
export function getDiff (
  currentBlockTime: number,
  previousBlockTime: number,
  previousDifficulty: string,
  minimalDifficulty: number,
  newBlockCount: number,
  newestChildHeader: Block
): BN {
  // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2.md

  let bigMinimalDifficulty = new BN(minimalDifficulty)
  let newestChildBlock = newestChildHeader
  if (newBlockCount === undefined) {
    throw new Error('new block count is not defined')
    // return false
  }

  /* eslint-disable */

  //logger.info('\n\n\n\n------- CHILD HEADER --------\n')
  debug(newestChildHeader)

  const bigPreviousBlockTime = new BN(previousBlockTime)
  const bigPreviousDifficulty = new BN(previousDifficulty)
  const bigCurrentBlockTime = new BN(currentBlockTime)
  const bigMinus99 = new BN(-99)
  const big1 = new BN(1)
  const big0 = new BN(0)
  const bigTargetTimeWindow = new BN(8)
  if(newestChildBlock.timestamp === undefined){
    newestChildBlock = newestChildHeader.toObject()
  }
  const bigChildHeaderTime = new BN(newestChildBlock.timestamp).div(new BN(1000))
  debug('----------------------------- currentBlockTime: ' + currentBlockTime)
  debug('----------------------------- previousBlockTime: ' + previousBlockTime)
  debug('----------------------------- newBlockCount: ' + newBlockCount)
  debug('----------------------------- bigChildHeaderTime: ' + bigChildHeaderTime)

  const bigChildHeaderTimeBound = new BN(bigChildHeaderTime).add(new BN(bigTargetTimeWindow).mul(new BN(2)))
  let elapsedTime = bigCurrentBlockTime.sub(bigPreviousBlockTime)

  let staleCost = new BN(new BN(bigCurrentBlockTime.sub(bigChildHeaderTimeBound)).div(new BN(bigTargetTimeWindow)))
  elapsedTime = elapsedTime.sub(staleCost)

  //debug('staleCost: ' + staleCost.toNumber())
  //debug('(after) elapsedTime: ' + elapsedTime.toNumber())

  // elapsedTime + ((elapsedTime - 5) * newBlocks)
  const elapsedTimeBonus = elapsedTime.add(elapsedTime.sub(new BN(6)).mul(new BN(newBlockCount)))
  debug('time bonus  ' + elapsedTimeBonus.toNumber())

  if (elapsedTimeBonus.gt(big0)) {
    elapsedTime = elapsedTimeBonus
  }

  // x = 1 - floor(x / handicap)
  let x = big1.sub(new BN(new BN(elapsedTime).div(bigTargetTimeWindow))) // div floors by default
  let y

  // x < -99 ? -99 : x
  if (x.lt(bigMinus99)) {
    x = bigMinus99
  }

  // y = bigPreviousDifficulty -> SPECTRUM: 10062600 // AT: 1615520 // BT: ((32 * 16) / 2PI ) * 10 = 815 chain count + hidden chain = 508
  y = bigPreviousDifficulty.div(new BN(815))
  // x = x * y
  x = x.mul(y)
  // x = x + previousDifficulty
  x = x.add(bigPreviousDifficulty)

  // x < minimalDifficulty
  if (x.lt(bigMinimalDifficulty)) {
    return bigMinimalDifficulty
  }

  //if(new BN(bigPreviousDifficulty).lt(new BN(x)) === true){
  //  debug('difficulty is increasing ' + new BN(x).sub(new BN(bigPreviousDifficulty)))
  //} else if(new BN(bigPreviousDifficulty).gt(new BN(x)) === true){
  //  debug('difficulty is decreasing ' + new BN(x).sub(new BN(bigPreviousDifficulty)))
  //} else {
  //  debug('difficulty is constant ' + new BN(x).sub(new BN(bigPreviousDifficulty)))
  //}

  //debug("\n\n")

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
 * [DEPRICATED] Returns summed distances between two strings broken into of 8 bits
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
 * Returns distances between string chunks and a string proposed by @lgray
 * @returns {number} cosine distance between two strings
 */
export function distanceFromCache (aChunks: string[], b: string): number {
  //const aChunks = reverse(splitEvery(32, split(a)))
  const bChunks = split(b)

  const bchunkslength = Math.ceil(bChunks.length/32)
  let value = 0
  const len = Math.min(aChunks.length,bchunkslength)
  for(var i = 0; i < len;i++) {
    const tail = Math.min(32*(i+1),bChunks.length)
    value += dist(bChunks.slice(32*i, tail), aChunks[i])
  }

  // TODO this is the previous implementation - because of
  // ac.pop() we need to reverse(aChunks) to produce same number
  // is that correct or just side-effect?
  // const value = bc.reduce(function (all, bd, i) {
  //   return all + dist(bd, ac.pop())
  // }, 0)
  return Math.floor(value * 1000000000000000)
}

export function overlineDistance (a: string, b: string): number {
  let value = dist(split(a).sort(), split(b).sort())
  return Math.floor(value * 1000000000000000)
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
export function mine (currentTimestamp: number, work: string, miner: string, merkleRoot: string, threshold: number, difficultyCalculator: ?Function, reportType: ?number): { distance: string, nonce: string, timestamp: number, difficulty: string } {
  let difficulty = threshold
  let difficultyBN = new BN(difficulty)
  let result
  const tsStart = ts.now()
  const maxCalculationEnd = tsStart + (MAX_TIMEOUT_SECONDS * 1000)
  const workChunks = reverse(splitEvery(32, split(work)))
  let currentLoopTimestamp = currentTimestamp
  let iterations = 0
  let res = null
  let nowms = 0
  let now = 0
  let nonce = String(Math.abs(Random.engines.nativeMath()))
  while (true) {
    iterations += 1

    nowms = ts.now()
    now = (nowms/1000)<<0

    if (maxCalculationEnd < nowms) {
      break
    }

    if (new BN(result).gt(difficultyBN) === true) {
      res = {
        distance: (result).toString(),
        nonce,
        timestamp: currentLoopTimestamp,
        difficulty,
        // NOTE: Following fields are for analyses only
        iterations,
        timeDiff: nowms - tsStart
      }
      break
    }
    // recalculate difficulty each second
    if (difficultyCalculator && currentLoopTimestamp < now) {
      currentLoopTimestamp = now
      difficulty = difficultyCalculator(now)
      difficultyBN = new BN(difficulty)
    }
    nonce = String(Math.abs(Random.engines.nativeMath()))
    const nonceHash = blake2bl(nonce)
    result = distanceFromCache(workChunks, blake2bl(miner + merkleRoot + nonceHash + currentLoopTimestamp))
  }

  // const tsEnd = ts.now()
  // const tsDiff = tsEnd - tsStart
  // if (res === null) {
  //  throw Error(`Mining took more than ${MAX_TIMEOUT_SECONDS}s, iterations: ${iterations}, tsDiff: ${tsDiff} ending...`)
  // }

  return res
}

export function getNewestHeader (newBlock: BcBlock): false|BlockLikeObject {
  logger.info('getting block height ' + newBlock.getHeight())
  if (newBlock === undefined || newBlock.getBlockchainHeaders === undefined) {
    logger.warn('failed: isValidChildAge new block could not be found')
    return false
  }

  const headers = newBlock.getBlockchainHeaders().toObject()
  const newestHeader = Object.keys(headers).reduce((newest, key) => {
    const sorted = headers[key].sort((a, b) => {
      /* eslint-disable */
      if (new BN(a.timestamp).gt(new BN(b.timestamp)) === true) {
        return 1
      }
      if (new BN(a.timestamp).lt(new BN(b.timestamp)) === true) {
        return -1
      }
      return 0
    })

    const header = sorted.pop()

    if (newest === false) {
      newest = header
    } else {
      if (new BN(newest.timestamp).lt(new BN(header.timestamp))) {
        newest = header
      }
    }
    return newest
  }, false)

  if (newestHeader === false) {
    return false
  }

  return newestHeader
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
const hash: ((BlockchainHeader|Block) => string) = invoker(0, 'getHash')
const merkleRoot: ((BlockchainHeader|Block) => string) = invoker(0, 'getMerkleRoot')

export const markedTransactionHash = (tTx: MarkedTransaction): string => {
  const payload = `${tTx.getId()}${tTx.getToken()}${tTx.getAddrFrom()}${tTx.getAddrTo()}${tTx.getAmount()}`
  return blake2bl(payload)
}

/**
 * Computes hash form a rovered block header as blake2bl(hash + mekleRoot)
 * @param {BlockchainHeader|Block} block to hash
 * @return {string} hash of the block
 */
export const blockHash = (roveredBlockLike: BlockchainHeader|Block): string => {
  let payload = roveredBlockLike.getHash() + roveredBlockLike.getMerkleRoot()
  if (!isEmpty(roveredBlockLike.getMarkedTxsList())) {
    for (const tTx of roveredBlockLike.getMarkedTxsList()) {
      payload += `${markedTransactionHash(tTx)}`
    }
  }
  return blake2bl(payload)
}

export const getChildrenBlocksHashes: ((BlockchainHeader[]|Block[]) => string[]) = map(blockHash)

export const blockchainMapToList = (headersMap: BlockchainHeaders): BlockchainHeader[] => {
  return Object.keys(headersMap.toObject()).sort().map(listName => {
    const getMethodName = `get${listName[0].toUpperCase()}${listName.slice(1)}`
    return headersMap[getMethodName]()
  }).reduce((acc, curr) => {
    return acc.concat(curr)
  }, [])
}

export const getChildrenRootHash: (string[] => string) = reduce((all: BN, blockHash: string) => {
  return all.xor(new BN(toHexBuffer(blockHash)))
}, new BN(0))

export function getParentShareDiff (parentDifficulty: number, childChainCount: number): BN {
  return (new BN(parentDifficulty)).div(new BN(childChainCount))
}

export function getMinimumDifficulty (childChainCount: number): BN {
  // Standard deviation 100M cycles divided by the number of chains
  return MINIMUM_DIFFICULTY.div(new BN(childChainCount))
}

// TODO rename arguments to better describe data
export function getNewPreExpDifficulty (
  currentTimestamp: number,
  lastPreviousBlock: BcBlock,
  blockWhichTriggeredMining: Block,
  newBlockCount: number
) {
  const preExpDiff = getDiff(
    currentTimestamp,
    lastPreviousBlock.getTimestamp(),
    lastPreviousBlock.getDifficulty(),
    MINIMUM_DIFFICULTY,
    newBlockCount,
    blockWhichTriggeredMining // aka getNewestHeader(newBlock)
  ) // Calculate the final pre-singularity difficulty adjustment

  return preExpDiff
}

/**
 * Return the `work` - string to which the distance is being guessed while mining
 *
 * @param {string} previousBlockHash Hash of last known previously mined BC block
 * @param {BlockchainHeaders} childrenCurrentBlocks Last know rovered blocks from each chain (one of them is the one which triggered mining)
 * @return {string} a hash representing the work
 */
export function prepareWork (previousBlockHash: string, childrenCurrentBlocks: BlockchainHeaders): string {
  const newChainRoot = getChildrenRootHash(getChildrenBlocksHashes(blockchainMapToList(childrenCurrentBlocks)))
  const work = blake2bl(
    newChainRoot.xor(
      new BN(
        toHexBuffer(previousBlockHash)
      )
    ).toString()
  )

  return work
}

const copyHeader = (block: BlockchainHeader|Block, confirmations: number): BlockchainHeader => {
  const header = new BlockchainHeader()
  header.setBlockchain(block.getBlockchain())
  header.setHash(block.getHash())
  header.setPreviousHash(block.getPreviousHash())
  header.setTimestamp(block.getTimestamp())
  header.setHeight(block.getHeight())
  header.setMerkleRoot(block.getMerkleRoot())
  header.setBlockchainConfirmationsInParentCount(confirmations)
  header.setMarkedTxsList(block.getMarkedTxsList())
  return header
}

function prepareChildBlockHeadersMapForGenesis (currentBlockchainHeaders: Block[]): BlockchainHeaders {
  const newMap = new BlockchainHeaders()
  currentBlockchainHeaders.forEach(header => {
    const blockchainHeader = copyHeader(header, 1)
    const methodNameSet = `set${header.getBlockchain()[0].toUpperCase() + header.getBlockchain().slice(1)}List` // e.g. setBtcList
    newMap[methodNameSet]([blockchainHeader])
  })
  return newMap
}

/**
 * Create a BlockchainHeader{} for new BcBlock, before count new confirmation count for each child block.
 *
 * Assumption here is that confirmation count of all headers from previous block is taken and incrementend by one
 * except for the one which caused the new block being mine - for that case is is reset to 1
 *
 * We're starting from 1 here because it is used for dividing
 *
 * @param {BcBlock} previousBlock Last known previously mined BC block
 * @param {Block} newChildBlock The last rovereed block - this one triggered the mining
 * @param {Block[]} newChildHeaders child headers which were rovered since the previousBlock
 * @return {BlockchainHeader[]} Headers of rovered chains with confirmations count calculated
 */
function prepareChildBlockHeadersMap (previousBlock: BcBlock, newChildBlock: Block, newChildHeaders: Block[]): BlockchainHeaders {
  const newChildHeadersMap = groupBy(block => block.getBlockchain(), newChildHeaders)

  const keyOrMethodToChain = (keyOrMethod: string) => keyOrMethod.replace(/^get|set/, '').replace(/List$/, '').toLowerCase()
  const chainToSet = (chain: string) => `set${chain[0].toUpperCase() + chain.slice(1)}List`
  const chainToGet = (chain: string) => `get${chain[0].toUpperCase() + chain.slice(1)}List`

  logger.debug(`newChildHeadersMap: ${inspect(toPairs(newChildHeadersMap).map(([chain, blocks]) => {
    return 'chain: ' + chain + ' headers ' + inspect(blocks.map(block => copyHeader(block, 1).toObject()))
  }), {depth: 3})}`)

  const newBlockchainHeaders = new BlockchainHeaders()
  // construct new BlockchainHeaders from newChildHeaders
  toPairs(newChildHeadersMap).forEach(([chain, blocks]) => {
    newBlockchainHeaders[chainToSet(chain)](blocks.map(block => copyHeader(block, 1)))
  })

  // if any list in header is empty take last header from previous block and raise confirmations by 1
  Object.keys(newBlockchainHeaders.toObject()).forEach(listKey => {
    const chain = keyOrMethodToChain(listKey)
    const newlyAssignedBlocks = newBlockchainHeaders[chainToGet(chain)]()
    logger.debug(`headers empty check, with method ${chainToGet(chain)}: ${newlyAssignedBlocks.map(b => b.toObject())}`)
    if (newlyAssignedBlocks.length === 0) {
      const lastHeaderFromPreviousBlock = last(previousBlock.getBlockchainHeaders()[chainToGet(chain)]())
      if (!lastHeaderFromPreviousBlock) {
        throw new Error(`Previous BC block ${previousBlock.getHeight()} does not have any "${chain}" headers`)
      }
      const headerFromPreviousBlock = copyHeader(lastHeaderFromPreviousBlock, lastHeaderFromPreviousBlock.getBlockchainConfirmationsInParentCount() + 1)
      newBlockchainHeaders[chainToSet(chain)]([headerFromPreviousBlock])
    }
  })

  logger.debug(`prepareChildBlockHeadersMap: previous BC block: ${previousBlock.getHeight()} final headers: ${inspect(Object.values(newBlockchainHeaders.toObject()), {depth: 3})}`)

  return newBlockchainHeaders
}

/**
 * How many new child blocks are between previousBlockHeaders and currentBlockHeaders
 */
export function getNewBlockCount (previousBlockHeaders: BlockchainHeaders, currentBlockHeaders: BlockchainHeaders) {
  // $FlowFixMe - protbuf toObject is not typed
  return getChildBlockDiff(previousBlockHeaders, currentBlockHeaders)
  // const headersToHashes = (headers: BlockchainHeaders) => Object.values(currentBlockHeaders.toObject()).reduce((acc, curr) => acc.concat(curr), []).map(headerObj => headerObj.hash)
  // const previousHashes = headersToHashes(previousBlockHeaders)
  // const currentHashes = headersToHashes(currentBlockHeaders)

  // return difference(currentHashes, previousHashes).length
}

/**
 * How many new child blocks are between previousBlockHeaders and currentBlockHeaders
 */
export function getChildBlockDiff (previousBlockHeaders: BlockchainHeaders, currentBlockHeaders: BlockchainHeaders) {
  // $FlowFixMe - protbuf toObject is not typed
  const a = previousBlockHeaders.toObject()
  const b = currentBlockHeaders.toObject()

  return Object.keys(b).reduce((total, key) => {
    const sa = a[key].map((header) => { return header.hash })
    const sb = b[key].map((header) => { return header.hash })
    total = total + difference(sa, sb).length
    return total
  }, 0)
}

/**
 * How many new child HASHES are between previousBlockHeaders and currentBlockHeaders
 */
export function getUniqueHashes (previousBlockHeaders: BlockchainHeaders, currentBlockHeaders: BlockchainHeaders) {
  // $FlowFixMe - protbuf toObject is not typed
  const headersToHashes = (headers: BlockchainHeaders) => Object.values(previousBlockHeaders.toObject()).reduce((acc, curr) => acc.concat(curr), []).map(headerObj => headerObj.hash)
  const previousHashes = headersToHashes(previousBlockHeaders)
  logger.info('previousHashes: ' + previousHashes)
  const currentHashes = headersToHashes(currentBlockHeaders)
  logger.info('currentHashes: ' + currentHashes)

  return difference(currentHashes, previousHashes)
  // return currentBlockHeaders.filter((b) => {
  //  if (diff.indexOf(b.getHash()) > -1) {
  //    return b
  //  }
  // })
}

/**
 * How many new child blocks are between previousBlockHeaders and currentBlockHeaders
 */
export function getUniqueBlocks (previousBlockHeaders: BlockchainHeaders, currentBlockHeaders: BlockchainHeaders) {
  // $FlowFixMe - protbuf toObject is not typed
  const headersToHashes = (headers: BlockchainHeaders) => Object.values(previousBlockHeaders.toObject()).reduce((acc, curr) => acc.concat(curr), []).map(headerObj => headerObj.hash)
  const previousHashes = headersToHashes(previousBlockHeaders)
  const currentHashes = headersToHashes(currentBlockHeaders)
  const diff = difference(currentHashes, previousHashes)

  const filterToDiff = currentBlockHeaders.filter((b) => {
    if (diff.indexOf(b.getHash()) > -1) {
      return b
    }
  })
  return filterToDiff
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
 * @param {Block[]} newChildHeaders Child headers which were rovered since headers in lastPreviousBlock
 * @param {Block} blockWhichTriggeredMining The last rovered block - this one triggered the mining
 * @param {Transaction[]} newTransactions Transactions which will be added to newly mined block
 * @param {string} minerAddress Public addres to which NRG award for mining the block and transactions will be credited to
 * @param {BcBlock} unfinishedBlock If miner was running this is the block currently mined
 * @return {BcBlock} Prepared structure of the new BC block, does not contain `nonce` and `distance` which will be filled after successful mining of the block
 */
export function prepareNewBlock (currentTimestamp: number, lastPreviousBlock: BcBlock, newChildHeaders: Block[], blockWhichTriggeredMining: Block, newTransactions: Transaction[], minerAddress: string, unfinishedBlock: ?BcBlock): [BcBlock, number] {


  let childBlockHeaders
  if (lastPreviousBlock !== undefined && lastPreviousBlock.getHeight() === GENESIS_DATA.height) {
    childBlockHeaders = prepareChildBlockHeadersMapForGenesis(newChildHeaders)
  } else {
    childBlockHeaders = prepareChildBlockHeadersMap(
      unfinishedBlock || lastPreviousBlock,
      blockWhichTriggeredMining,
      newChildHeaders
    )
  }

  /* eslint-disable */
  //debug(' BLOCK WHICH TRIGGERED MINING ')
  //debug(blockWhichTriggeredMining)
  //debug(' CHILD BLOCK HEADERS ' )
  //debug(childBlockHeaders)
  //debug(' LAST PREVIOUS BLOCK HEADERS' )
  //debug(lastPreviousBlock.getBlockchainHeaders())

  const blockHashes = getChildrenBlocksHashes(blockchainMapToList(childBlockHeaders))
  const newChainRoot = getChildrenRootHash(blockHashes)
  const newBlockCount = getNewBlockCount(lastPreviousBlock.getBlockchainHeaders(), childBlockHeaders)
  //const newBlockCount = getUniqueBlocks(lastPreviousBlock.getBlockchainHeaders(), childBlockHeaders).length

  debug('currentTimestamp: ' + currentTimestamp)
  debug('newBlockCount: ' + newBlockCount)

  const preExpDiff = getNewPreExpDifficulty(
    currentTimestamp,
    lastPreviousBlock,
    blockWhichTriggeredMining,
    newBlockCount
  )

  //debug('preExpDiff: ' + preExpDiff)
  const finalDifficulty = getExpFactorDiff(preExpDiff, lastPreviousBlock.getHeight()).toString()

  let heightIncrement = 1
  if(BC_BT_VALIDATION === true && new BN(lastPreviousBlock.getHeight()).lt(new BN(2)) === true) {
    heightIncrement = 496657
  }

  const newHeight = lastPreviousBlock.getHeight() + heightIncrement
  // blockchains, transactions, miner address, height
  const newMerkleRoot = createMerkleRoot(concatAll([
    blockHashes,
    newTransactions.map(tx => tx.getHash()),
    [
      finalDifficulty,
      minerAddress,
      newHeight,
      GENESIS_DATA.version,
      GENESIS_DATA.schemaVersion,
      GENESIS_DATA.nrgGrant,
      GENESIS_DATA.blockchainFingerprintsRoot
    ]
  ]))

  let chainWeight = 0
  if (new BN(lastPreviousBlock.getHeight()).gt(2) === true) {
    chainWeight = new BN(lastPreviousBlock.getDistance()).sub(new BN(lastPreviousBlock.getDifficulty())).divRound(new BN(8)).toString()
  }

  const newBlock = new BcBlock()
  newBlock.setHash(blake2bl(lastPreviousBlock.getHash() + newMerkleRoot))
  newBlock.setPreviousHash(lastPreviousBlock.getHash())
  newBlock.setVersion(1)
  newBlock.setSchemaVersion(1)
  newBlock.setHeight(newHeight)
  newBlock.setMiner(minerAddress)
  newBlock.setDifficulty(finalDifficulty)
  newBlock.setMerkleRoot(newMerkleRoot)
  newBlock.setChainRoot(blake2bl(newChainRoot.toString()))
  newBlock.setDistance(chainWeight) // is set to proper value after successful mining
  newBlock.setTotalDistance(lastPreviousBlock.getTotalDistance()) // distance from mining solution will be added to this after mining
  newBlock.setNrgGrant(GENESIS_DATA.nrgGrant)
  newBlock.setTargetHash(GENESIS_DATA.targetHash)
  newBlock.setTargetHeight(GENESIS_DATA.targetHeight)
  newBlock.setTargetMiner(GENESIS_DATA.targetMiner)
  newBlock.setTargetSignature(GENESIS_DATA.targetSignature)
  newBlock.setTwn(GENESIS_DATA.twn) 
  newBlock.setTwsList(GENESIS_DATA.twsList) 
  newBlock.setEmblemWeight(GENESIS_DATA.emblemWeight)
  newBlock.setEmblemChainBlockHash(GENESIS_DATA.emblemChainBlockHash)
  newBlock.setEmblemChainFingerprintRoot(GENESIS_DATA.emblemChainFingerprintRoot)
  newBlock.setEmblemChainAddress(GENESIS_DATA.emblemChainAddress)
  // TODO: pendingTxs coinbase TX should be added
  newBlock.setTxCount(newTransactions.length)
  newBlock.setTxsList(newTransactions)
  newBlock.setBlockchainHeadersCount(newChildHeaders.length)
  newBlock.setBlockchainFingerprintsRoot(GENESIS_DATA.blockchainFingerprintsRoot)
  newBlock.setTxFeeBase(GENESIS_DATA.txFeeBase)
  newBlock.setTxDistanceSumLimit(GENESIS_DATA.txDistanceSumLimit)
  newBlock.setBlockchainHeaders(childBlockHeaders)

  logger.info('distance <- minimum difficulty threshold ' + newBlock.getDifficulty())

  return [newBlock, currentTimestamp]
}
