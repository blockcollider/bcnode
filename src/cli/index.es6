// @flow

const program = require('commander')

const Engine = require('../engine').default

const pkg = require('../../package.json')

// eslint-disable-next-line import/prefer-default-export
export function main () {
  program
    .version(pkg.version)
    .option('--rover', 'Start Rover(s)')
    .option('--rpc', 'Start RPC Server')
    .option('--server', 'Start Server')
    .option('--ws', 'Start WebSocket Server')
    .parse(process.argv)

  // Print help if no arguments were given
  if (process.argv.length < 3) {
    return program.help()
  }

  // Create instance of engine
  const engine = new Engine()

  // Should the Rover be started?
  if (program.rover) {
    engine.startRovers()
  }

  // Should the RPC be started?
  if (program.rpc) {
    engine.startRpc()
  }

  // Should the Server be started?
  if (program.server) {
    engine.startServer()
  }

  // Should the WebSocket be started?
  if (program.ws) {
    engine.startWebSocket()
  }

  // TODO: Wait for engine finish
  // engine.wait()
}
