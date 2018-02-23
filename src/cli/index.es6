// @flow

const program = require('commander')

const Engine = require('../engine').default

const pkg = require('../../package.json')

// eslint-disable-next-line import/prefer-default-export
export function main () {
  program
    .version(pkg.version)
    .option('--rovers', 'Start Rover')
    .option('--rpc', 'Enable RPC')
    .option('--ui', 'Enable Web UI')
    .option('--ws', 'Enable WebSocket')
    .parse(process.argv)

  // Print help if no arguments were given
  if (process.argv.length < 3) {
    return program.help()
  }

  // Create instance of engine
  const engine = new Engine()

  // Should the Rover be started?
  if (program.rovers) {
    engine.startRovers()
  }

  // Should the RPC be started?
  if (program.rpc) {
    engine.startRpc()
  }

  // Should the Server be started?
  if (program.rpc || program.ui || program.ws) {
    engine.startServer({
      rpc: program.rpc, // Enable RPC - /rpc
      ui: program.ui,   // Enable UI - /
      ws: program.ws    // Enable WS - /ws
    })
  }

  // TODO: Wait for engine finish
  // engine.wait()
}
