/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* global $Values */

/*
 *
 *  !!! STOP DEV ACTIVE https://github.com/mmpmm/vclyspul-fix !!!
 *
 */
const { inspect } = require('util')
const BN = require('bn.js')
const debug = require('debug')('bcnode:fix:controller')
const inspectStream = require('inspect-stream')
const logging = require('../logger')
const PersistenceRocksDb = require('../persistence').RocksDb
const { BcBlock, Transaction } = require('../protos/core_pb')
const { isDebugEnabled } = require('../debug')

process.on('uncaughtError', (err) => {
  console.trace(err) // eslint-disable-line no-console
})

export class Controller {
  _logger: Object // eslint-disable-line no-undef

  constructor (persistence: PersistenceRocksDb) {
    this._logger = logging.getLogger(__filename)
  }
}

export default Controller
