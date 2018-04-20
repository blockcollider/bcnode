/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Logger } from 'winston'

const { getLogger } = require('../../logger')

const RpcServer = require('../server').default

const {
  getLatestBlocks,
  help,
  stats
} = require('./bc/index')

export default class BcServiceImpl {
  _logger: Logger; // eslint-disable-line no-undef
  _server: RpcServer; // eslint-disable-line no-undef

  constructor (server: RpcServer) {
    this._server = server
    this._logger = getLogger(__filename)
  }

  get server () : RpcServer {
    return this._server
  }

  /**
   * GetLatestBlocks
   */
  getLatestBlocks (call: Object, callback: Function) {
    getLatestBlocks(this._getContext(), call, callback)
  }

  /**
   * Help
   */
  help (call: Object, callback: Function) {
    help(this._getContext(), call, callback)
  }

  /**
   * Statistics
   */
  stats (call: Object, callback: Function) {
    stats(this._getContext(), call, callback)
  }

  _getContext () : Object {
    return {
      logger: this._logger,
      server: this._server
    }
  }
}
