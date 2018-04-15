/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const process = require('process')
const program = require('commander')
const { spawn } = require('child_process')

const {
  isDebugEnabled,
  ensureDebugDir
} = require('../debug')

const { errToObj } = require('../helper/error')
const logging = require('../logger')
const Engine = require('../engine').default
const pkg = require('../../package.json')

// $FlowFixMe
const native = require('../../native/index.node')

const EXCEPTION_PATH = path.resolve(__dirname, '..', '..', 'exception.log')
const LOG_DIR = path.resolve(__dirname, '..', '..', 'logs')
const ROVERS = Object.keys(require('../rover/manager').rovers)

const globalLog = logging.getLogger(__filename)

// setup logging of unhandled rejections
process.on('unhandledRejection', (err) => {
  // $FlowFixMe
  globalLog.error(`Rejected promise, trace:\n${err.stack}`)
})

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION, saving in exception.log', err)

  fs.writeFile(EXCEPTION_PATH, JSON.stringify(errToObj(err), null, 2), (err) => {
    if (err) {
      console.log(`Unable to save ${EXCEPTION_PATH}`, err)
      return process.exit(-1)
    }

    console.log(`Exception was saved in ${EXCEPTION_PATH}`)
    console.log('Exiting...')
    return process.exit(-1)
  })
})

/**
 * Application entry point
 *
 * @param args Command line arguments
 */
// eslint-disable-next-line import/prefer-default-export
export async function main (args: string[]) {
  program
    .version(pkg.version)
    .option('--miner-key [key]', 'Miner key')
    .option('-n, --node', 'Start P2P node')
    .option('-r, --randezvous-server', 'Start randezvous server')
    .option('--randezvous-server-bind [ip]', 'Randezvous server bind IP', '0.0.0.0')
    .option('--randezvous-server-port [port]', 'Randezvous server port', '9090')
    .option('--rovers [items]', 'start rover', ROVERS.join(', '))
    .option('-R, --no-rovers', 'do not start any rover')
    .option('--rpc', 'enable RPC')
    .option('--ui', 'enable Web UI')
    .option('--ws', 'enable WebSocket')
    .parse(args)

  // Print help if no arguments were given
  if (process.argv.length < 3) {
    return program.help()
  }

  const {
    minerKey,
    node,
    randezvousServer,
    randezvousServerBind,
    randezvousServerPort,
    rovers,
    rpc,
    ui,
    ws
  } = program.opts()

  if (isDebugEnabled) {
    ensureDebugDir()
  }

  // Make sure log folder exists
  ensureLogDir()

  // Initialize rust logger
  native.initLogger()

  const logger: Object = logging.getLogger(__filename)

  logger.info(`OS Info: ${JSON.stringify(getOsInfo(), null, 2)}`)

  // Create instance of engine
  const opts = {
    rovers: ROVERS,
    minerKey: minerKey
  }
  const engine = new Engine(logger, opts)

  try {
    await engine.init()
  } catch (e) {
    logger.error(`Engine initialization failed, reason: ${e.message}`)
    return -1
  }

  if (randezvousServer) {
    const args = [
      `--port=${randezvousServerPort}`,
      `--host=${randezvousServerBind}`
    ]
    const child = spawn('./node_modules/.bin/star-signal', args)

    // use child.stdout.setEncoding('utf8'); if you want text chunks
    child.stdout.on('data', (chunk) => {
      console.log(chunk.toString())
    })

    // since these are streams, you can pipe them elsewhere
    child.stderr.on('data', (chunk) => {
      console.log(chunk.toString())
    })

    child.on('close', (code) => {
      console.log(`Randezvous server process exited with code ${code}`)
    })
  }

  process.on('SIGINT', () => {
    logger.info('Gracefully shutting down from  SIGINT (Ctrl-C)')

    // TODO: Inform engine
    engine.requestExit()
      .then(() => {
        process.exit()
      })
      .catch((e) => {
        this._logger.error(`Error in Engine.requestExit(), reason: ${e.message}`)
        process.exit(-1)
      })
  })

  if (node) {
    engine.startNode()
  }

  // Should the Rover be started?
  if (rovers) {
    const roversToStart =
      rovers === true
        ? ROVERS
        : rovers.split(',').map(roverName => roverName.trim().toLowerCase())

    if (!minerKey) {
      logger.error('--miner-key required')
      return -1
    }

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

function getOsInfo () {
  return {
    arch: os.arch(),
    cpus: os.cpus(),
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    mem: os.totalmem(),
    network: os.networkInterfaces(),
    type: os.type()
  }
}

function ensureLogDir () {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR)
  }
}
