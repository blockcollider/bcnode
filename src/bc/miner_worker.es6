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
const { mine } = require('./miner')

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

  process.on('message', ({currentTimestamp, work, minerKey, merkleRoot, difficulty}) => {
    try {
      const solution = mine(
        currentTimestamp,
        work,
        minerKey,
        merkleRoot,
        difficulty
      )

      // send solution and exit
      globalLog.debug(`Solution found: ${JSON.stringify(solution, null, 2)}`)
      process.send(solution)
      process.exit(0)
    } catch (e) {
      globalLog.warn(`Mining failed with reason: ${e.message}`)
      process.exit(1)
    }
  })
}

main()
