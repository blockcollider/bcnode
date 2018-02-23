/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const logger = require('../logger').logger
const child = require('child_process')
const path = require('path')
const rovers = {
  btc: path.resolve(__dirname, 'btc', 'rover.js')
}

export default class RoverManager {
  _logger: Object // eslint-disable-line no-undef
  _rovers: Object // eslint-disable-line no-undef

  constructor (rovers: string[]) {
    this._logger = logger
    this._rovers = {}
  }

  startRover (roverName: string) {
    const roverPath = rovers[roverName]

    if (!roverPath) {
      this._logger.error(`Rover not implemented ${roverName}`)
      return false
    }

    this._logger.info(`Starting rover '${roverName}'`)

    const rover = child.fork(roverPath)
    this._rovers[roverName] = rover

    return true
  }
}
