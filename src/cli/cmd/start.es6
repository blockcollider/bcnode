/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Logger } from 'winston'

const { Command } = require('commander')

const { MINER_KEY_REGEX } = require('../minerKey')
const logging = require('../../logger')
const Engine = require('../../engine').default

const ROVERS = Object.keys(require('../../rover/manager').rovers)

export const cmd = async (program: typeof Command) => {
  const {
    node,
    rovers,
    rpc,
    ui,
    ws
  } = program.opts()

  // Initialize JS logger
  const logger = logging.getLogger(__filename)

  // Create instance of engine
  let minerKey = process.env.BC_MINER_KEY || program.opts().minerKey
  // If starting rovers we need to check miner key at first
  if (rovers) {
    if (!minerKey) {
      logger.error('--miner-key required')
      process.exit(-1)
    }

    if (!MINER_KEY_REGEX.test(minerKey)) {
      logger.error('Malformed miner key')
      process.exit(-2)
    }

    minerKey = minerKey.toLowerCase()
  }

  const opts = {
    rovers: ROVERS,
    minerKey
  }

  // Create engine instance
  const engine = new Engine(logger, opts)

  // Initialize SIGING handler
  initSigintHandler(logger, engine)

  // Initialize engine
  try {
    await engine.init()
  } catch (e) {
    logger.error(`Engine initialization failed, reason: ${e.message}`)
    return -1
  }

  if (node) {
    engine.startNode()
  }

  // Should the Rover be started?
  if (rovers) {
    const roversToStart =
      rovers === true
        ? ROVERS
        : rovers.split(',').map(roverName => roverName.trim().toLowerCase())

    engine.startRovers(roversToStart)
  }

  // Should the Server be started?
  if (rpc || ui || ws) {
    engine.startServer({
      rpc, // Enable RPC - /rpc
      ui, // Enable UI - /
      ws // Enable WS - /ws
    })
  }

  // TODO: Wait for engine finish
  // engine.wait()
}

const initSigintHandler = (logger: Logger, engine: Engine) => {
  process.on('SIGINT', () => {
    logger.info('Gracefully shutting down from  SIGINT (Ctrl-C)')

    // TODO: Inform engine
    engine.requestExit()
      .then(() => {
        process.exit()
      })
      .catch((e) => {
        logger.error(`Error in Engine.requestExit(), reason: ${e.message}`)
        process.exit(-1)
      })
  })
}
