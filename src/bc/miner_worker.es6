#! /usr/bin/env node
/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type { Logger } from 'winston'
const process = require('process')
const { fromPairs } = require('ramda')
const { getExpFactorDiff, getNewPreExpDifficulty, getMinimumDifficulty, mine } = require('./miner')
const { ChildBlockHeader, BcBlock } = require('../protos/core_pb')

const logging = require('../logger')

const globalLog: Logger = logging.getLogger(__filename)
// setup logging of unhandled rejections
process.on('unhandledRejection', (err) => {
  // $FlowFixMe
  globalLog.error(`Rejected promise, trace:\n${err.stack}`)
})

/**
 * Miner woker entrypoin
 */
const main = () => {
  process.title = 'bc-miner-worker'
  globalLog.debug('Starting miner worker')

  process.on('message', ({currentTimestamp, work, minerKey, merkleRoot, difficulty, difficultyData}) => {
    // Deserialize buffers from parent process, buffer will be serialized as object of this shape { <idx>: byte } - so use Object.values on it
    const deserialize = (buffer: { [string]: number }, clazz: BcBlock|ChildBlockHeader) => clazz.deserializeBinary(new Uint8Array(Object.values(buffer).map(n => parseInt(n, 10))))

    // function with all difficultyData closed in scope and
    // send it to mine with all arguments except of timestamp and use it
    // each 1s tick with new timestamp
    const difficultyCalculator = function () {
      // Proto buffers are serialized - let's deserialize them
      const { lastPreviousBlock, previousBcBlocks, currentBlocks, newBlockHeaders } = difficultyData
      const lastPreviousBlockProto = deserialize(lastPreviousBlock, BcBlock)
      const previousBcBlocksProto = fromPairs(previousBcBlocks.map(([chain, blockBuffer]) => ([chain, deserialize(blockBuffer, BcBlock)])))
      const newBlockHeadersProto = newBlockHeaders.map(header => deserialize(header, ChildBlockHeader))

      // return function with scope closing all deserialized difficulty data
      return function (timestamp: number) {
        const minimumDiffShare = getMinimumDifficulty(currentBlocks.length)
        const preExpDiff = getNewPreExpDifficulty(
          timestamp,
          lastPreviousBlockProto,
          previousBcBlocksProto,
          minimumDiffShare,
          lastPreviousBlockProto.getChildBlockHeadersList(),
          newBlockHeadersProto
        )
        return getExpFactorDiff(preExpDiff, lastPreviousBlockProto.getHeight()).toNumber()
      }
    }

    try {
      const solution = mine(
        currentTimestamp,
        work,
        minerKey,
        merkleRoot,
        difficulty,
        difficultyCalculator()
      )

      // send solution and exit
      globalLog.debug(`Solution found: ${JSON.stringify(solution, null, 2)}`)
      process.send(solution)
      process.exit(0)
    } catch (e) {
      globalLog.warn(`Mining failed with reason: ${e.message}, stack ${e.stack}`)
      process.exit(1)
    }
  })
}

main()
