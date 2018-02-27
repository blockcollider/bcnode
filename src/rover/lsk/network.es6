/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type Logger from 'winston'
const { merge } = require('ramda')
const logging = require('../../logger')
const DEFAULT_STATE = {}

// XXX this is intentionally left almost blank - module exists just for
// keeping the structure same for all rovers - lisk asks api and does not need network module
export default class Network { // TODO extract btc/Network common functionality to super class
  _state: Object; // eslint-disable-line no-undef
  _logger: Logger; // eslint-disable-line no-undef

  constructor (config: Object = {}) {
    this._logger = logging.getLogger('rover.lsk.network')
    this._state = merge(DEFAULT_STATE, config)
  }
}
