/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const logger = require('../logger').logger
const { fork } = require('child_process')
const path = require('path')

const ROVER_RESTART_TIMEOUT = 5000

export const rovers = {
  btc: path.resolve(__dirname, 'btc', 'rover.js'),
  lsk: path.resolve(__dirname, 'lsk', 'rover.js')
}

export default class RoverManager {
  _logger: Object // eslint-disable-line no-undef
  _rovers: Object // eslint-disable-line no-undef

  constructor () {
    this._logger = logger
    this._rovers = {}
  }

  startRover (roverName: string) {
    const roverPath = rovers[roverName]

    if (!roverPath) {
      this._logger.error(`Rover is not implemented '${roverName}'`)
      return false
    }

    this._logger.info(`Starting rover '${roverName}'`)

    const rover = fork(
      roverPath,
      [],
      {
        execArgv: process.env.DEBUGGER ? ['--inspect-brk'] : []
      }
    )

    this._rovers[roverName] = rover

    rover.on('exit', (code, signal) => {
      this._logger.warn(`Rover ${roverName} exited (code: ${code}, signal: ${signal}) - restarting in ${ROVER_RESTART_TIMEOUT / 1000}s`)
      // TODO ROVER_RESTART_TIMEOUT should not be static 5s but probably some exponential backoff series separate for each rover
      setTimeout(() => {
        delete this._rovers[roverName]
        this.startRover(roverName)
      }, ROVER_RESTART_TIMEOUT)
    })

    return true
  }
}
