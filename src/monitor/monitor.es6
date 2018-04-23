/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const os = require('os')

const Engine = require('../engine').default
const logging = require('../logger')

// const BC_MONITOR_INTERVAL = process.env.BC_MONITOR_INTERVAL
// const MONITOR_INTERVAL = (BC_MONITOR_INTERVAL && parseInt(BC_MONITOR_INTERVAL, 10)) || (10 * 60 * 1000)

// Print monitor info once per five minutes
const MONITOR_INTERVAL = (5 * 60 * 1000)

export default class Monitor {
  _logger: Object; // eslint-disable-line no-undef
  _engine: Engine; // eslint-disable-line no-undef
  _opts: Object; // eslint-disable-line no-undef
  _interval: ?IntervalID; // eslint-disable-line no-undef

  constructor (engine: Engine, opts: Object) {
    this._logger = logging.getLogger(__filename)
    this._engine = engine
    this._opts = opts
  }

  start () {
    this._logger.debug('Starting monitor')

    if (this._interval) {
      this.stop()
    }

    this._interval = setInterval(() => {
      this._printStats()
    }, MONITOR_INTERVAL)
  }

  stop () {
    if (!this._interval) {
      return
    }

    this._logger.debug('Stopping monitor')
    if (this._interval) {
      clearInterval(this._interval)
      this._interval = null
    }
  }

  _printStats () {
    const stats = {
      mem: os.freemem(),
      load: os.loadavg()
    }

    this._logger.info(`Stats: ${JSON.stringify(stats, null, 2)}`)
  }
}
