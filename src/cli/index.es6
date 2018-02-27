/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const process = require('process')
const program = require('commander')

const logging = require('../logger')
const Engine = require('../engine').default
const pkg = require('../../package.json')

const ROVERS = ['btc', 'eth', 'wav', 'lisk', 'neo']

// eslint-disable-next-line import/prefer-default-export
export function main (args: Object) {
  program
    .version(pkg.version)
    .option('--rovers [items]', 'Start Rover', 'all')
    .option('-R, --no-rovers', 'Do not start any rover')
    .option('--rpc', 'Enable RPC')
    .option('--ui', 'Enable Web UI')
    .option('--ws', 'Enable WebSocket')
    .parse(args)

  // Print help if no arguments were given
  if (process.argv.length < 3) {
    return program.help()
  }

  // Create instance of engine
  const engine = new Engine()
  const { rovers, rpc, ui, ws } = program

  process.on('SIGINT', () => {
    console.log('Gracefully shutting down from  SIGINT (Ctrl-C)')

    // TODO: Inform engine

    // wish this worked on Windows
    process.exit()
  })

  // Should the Rover be started?
  if (rovers) {
    const roversToStart =
      rovers === 'all'
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
