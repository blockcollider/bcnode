/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type { Logger } from 'winston'
const Sntp = require('sntp')

const { getLogger } = require('../logger/index')

const REFRESH_INTERVAL = 60000 // 60s

export class TimeService { // export for tests
  _offset: number;
  intervalHandler: ?IntervalID; // eslint-disable-line no-undef
  inFlight: ?bool;
  lastSyncedAt: ?number;
  _logger: Logger;

  constructor () {
    this._offset = 0
    this.inFlight = false
    this.lastSyncedAt = undefined
    this._logger = getLogger(__filename)
  }

  ntpGetOffset () {
    this.inFlight = true
    Sntp.offset((err, offset) => {
      this.inFlight = false
      if (err) {
        this._logger.warn(`Could not get offset from NTP servers, reason ${err.message}`)
        return
      }
      this._offset = offset
      this.inFlight = false
      this.lastSyncedAt = Date.now()
      this._logger.debug(`NTP sync successful, got offset: ${offset}`)
    })
  }

  start () {
    if (this.intervalHandler === undefined) {
      this._logger.info('Starting NTP time sync')
      this.ntpGetOffset()
      this.intervalHandler = setInterval(this.ntpGetOffset.bind(this), REFRESH_INTERVAL)
    }
  }

  stop () {
    this._logger.info('Stopping NTP time sync')
    this.intervalHandler && clearInterval(this.intervalHandler)
    this.intervalHandler = undefined
  }

  offsetOverride (offset: number) {
    this._logger.info('Offset overriden')
    this._offset = offset
    this.lastSyncedAt = Date.now()
  }

  get isStarted (): bool {
    return this.intervalHandler !== undefined
  }

  get offset (): number {
    return this._offset
  }

  now (): number {
    if (this.lastSyncedAt === undefined) {
      this._logger.warn('TimeService did not sync at least once, either there is error while syncing or you have to start() it')
    } else if (Date.now() - (this.lastSyncedAt || 0) > REFRESH_INTERVAL * 5) {
      this._logger.warn('TimeService did not sync in last five minutes, there is an error in NTP sync')
    }
    return Date.now() + this._offset
  }

  /**
   * @return unix timestamp in seconds
   */
  nowSeconds (): number {
    return (this.now() / 1000) << 0
  }

  getDate (): Date {
    return new Date(this.now())
  }

  /**
   * Simulates moment().utc().format()
   */
  iso (): string {
    return (new Date(this.now())).toISOString().split('.')[0] + 'Z'
  }
}

export default new TimeService()
