/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const logging = require('../logger')
const { fork } = require('child_process')
const path = require('path')

const ROVER_RESTART_TIMEOUT = 5000

/**
 * Rover lookup table
 *
 * Gets the rover path by name of it
 *
 * @type {{btc: *, eth: *, lsk: *}}
 */
export const rovers = {
  btc: path.resolve(__dirname, 'btc', 'rover.js'),
  eth: path.resolve(__dirname, 'eth', 'rover.js'),
  lsk: path.resolve(__dirname, 'lsk', 'rover.js'),
  neo: path.resolve(__dirname, 'neo', 'rover.js'),
  wav: path.resolve(__dirname, 'wav', 'rover.js')
}

/**
 * Rover manager
 */
export default class RoverManager {
  _logger: Object // eslint-disable-line no-undef
  _rovers: Object // eslint-disable-line no-undef

  constructor () {
    this._logger = logging.getLogger(__filename)
    this._rovers = {}
  }

  get rovers (): Object {
    return this._rovers
  }

  /**
   * Start rover
   * @param roverName Name of rover to start
   * @returns {boolean} result
   */
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
        execArgv: []
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

  /**
   * Kill all rovers managed by this manager
   * @return {*} Promise
   */
  killRovers (): Promise<bool> {
    const roverNames = Object.keys(this._rovers)
    roverNames.map((roverName) => {
      this._killRover(roverName)
    })

    return Promise.resolve(true)
  }

  /**
   * Kill rover managed by this manager by its name
   * @param roverName
   * @private
   */
  _killRover (roverName: string) {
    const rover = this._rovers[roverName]
    const pid = rover.pid
    this._logger.info(`Killing rover '${roverName}', PID: ${pid}`)
    process.kill(pid, 'SIGHUP')
  }
}
