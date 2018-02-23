/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const logger = require('../logger').logger

export default class RoverManager {
  _logger: Object; // eslint-disable-line no-undef

  constructor (rovers: string[]) {
    this._logger = logger
    this._logger.info('Instantiating RoverManager')
  }

  startRover (rover: string) {
    this._logger.info(`Starting rover '${rover}'`)
  }
}
