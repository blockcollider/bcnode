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

const colors = require('colors')
const fs = require('fs')
const path = require('path')
const process = require('process')
const program = require('commander')
const Raven = require('raven')

const config = require('../../config/config')
const logging = require('../logger')
const { ensureDebugDir } = require('../debug')
const { getVersion } = require('../helper/version')
const { cmd: cmdConfig } = require('./cmd/config')
const { cmd: cmdInfo } = require('./cmd/info')
const { cmd: cmdStart } = require('./cmd/start')

// $FlowFixMe
const native = require('../../native/index.node')

const LOG_DIR = path.resolve(__dirname, '..', '..', '_logs')
const ROVERS = Object.keys(require('../rover/manager').rovers)

export const main = async (args: string[] = process.argv) => {
  process.title = 'bcnode'

  const version = getVersion()
  const versionString = `${version.npm}#${version.git.short}`

  program
    // $FlowFixMe
    .version(versionString)
    .usage('<cmd>')
    .action((cmd) => {
      console.log(colors.red(`Invalid command '${cmd}'`))
      return program.help()
    })

  // COMMAND - config
  program
    .command('config')
    .description('Configuration file(s)')
    .usage('<options>')
    .option('--show', 'Show config file used')
    .action((cmd) => {
      return cmdConfig(cmd)
    })

  // COMMAND - info
  program
    .command('info')
    .description('Various informations')
    .usage('<options>')
    .option('--all', 'Show all', false)
    .option('--dirs', 'Path of directories used', false)
    .option('--machine', 'Machine info', false)
    .action((cmd) => {
      return cmdInfo(cmd)
    })

  // COMMAND - start
  program
    .command('start')
    .description('Start Block Collider')
    .usage('[opts]')
    // .arguments('')
    .option('--miner-key [key]', 'Miner key')
    .option('-n, --node', 'Start P2P node')
    .option('--rovers [items]', 'start rover', ROVERS.join(', '))
    .option('-R, --no-rovers', 'do not start any rover')
    .option('--rpc', 'enable RPC')
    .option('--ui', 'enable Web UI')
    .option('--ws', 'enable WebSocket')
    .action((cmd) => {
      return cmdStart(cmd)
    })

  if (args.length < 3) {
    console.log(colors.red('No command specified'))
    return program.help()
  }

  // Initialize required directories
  initDirs()

  // Initialize JS logger
  const logger = logging.getLogger(__filename)

  // Initialize Rust logger
  native.initLogger()

  // Initialize error handlers
  initErrorHandlers(logger, versionString)

  // Parse command line
  return program.parse(args)
}

const initDirs = () => {
  // Debug directory
  ensureDebugDir(true)

  // Log directory
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR)
  }
}

const initErrorHandlers = (logger: Logger, versionString: string) => {
  if (config.sentry.enabled) {
    Raven.config(config.sentry.url, {
      release: versionString
    }).install()
  }

  // setup logging of unhandled rejections
  process.on('unhandledRejection', (err) => {
    // $FlowFixMe
    logger.error(`Rejected promise, trace:\n${err.stack}`)
  })

  process.on('uncaughtException', (uncaughtError) => {
    console.log('UNCAUGHT EXCEPTION, saving in exception.log', uncaughtError)

    if (config.sentry.enabled) {
      Raven.captureException(uncaughtError)
    }
  })
}

if (require.main === module) {
  main(process.argv)
}
