// @flow

const program = require('commander')

const Engine = require('../engine').default

const pkg = require('../../package.json')

const ROVERS = ['btc', 'eth', 'wav', 'lisk', 'neo']

// eslint-disable-next-line import/prefer-default-export
export function main (args: Object) {
  program
    .version(pkg.version)
    .option('--rovers [items]', 'Start Rover', 'all')
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

  // Should the Rover be started?
  if (rovers) {
    const roversToStart = (rovers === 'all')
          ? ROVERS
          : rovers.split(',').map(roverName => roverName.trim().toLowerCase())
    engine.startRovers(roversToStart)
  }

  // Should the RPC be started?
  if (rpc) {
    engine.startRpc()
  }

  // Should the Server be started?
  if (rpc || ui || ws) {
    engine.startServer({
      rpc, // Enable RPC - /rpc
      ui,   // Enable UI - /
      ws    // Enable WS - /ws
    })
  }

  // TODO: Wait for engine finish
  // engine.wait()
}
