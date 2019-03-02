/*
 * Copyright (c) 2017-present, Block Collider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Logger } from 'winston'
import type { RocksDb } from '../persistence'

const os = require('os')
const { fork, ChildProcess } = require('child_process')
const { writeFileSync } = require('fs')
const { resolve } = require('path')
const { config } = require('../config')
const { EventEmitter } = require('events')

const debug = require('debug')('bcnode:mining:pool')
const crypto = require('crypto')
const { max } = require('ramda')

const { getLogger } = require('../logger')

const MINER_POOL_WORKER_PATH = resolve(__filename, '..', '..', 'mining', 'thread.js')
const BC_MAX_WORKERS = process.env.BC_MAX_WORKERS

export class WorkerPool {
  _logger: Logger
  _session: string
  _minerKey: string
  _persistence: RocksDb
  _timers: Object
  _timerResults: Object
  _emitter: EventEmitter
  _workers: Object
  _maxWorkers: number
  _startupCheck: boolean
  _pool: ChildProcess
  _poolGuardPath: string
  _collectedBlocks: { [blockchain: string]: number }

  constructor (persistence: RocksDb, opts: { minerKey: string, maxWorkers?: number, poolguard?: string }) {
    let maxWorkers = os.cpus().length
    if (opts !== undefined && opts.maxWorkers !== undefined) {
      maxWorkers = opts.maxWorkers
    }

    if (maxWorkers > 10) {
      maxWorkers = 10
    }

    if (BC_MAX_WORKERS !== undefined) {
      maxWorkers = parseInt(BC_MAX_WORKERS, 10)
    }
    this._logger = getLogger(__filename)
    this._session = crypto.randomBytes(32).toString('hex')
    this._minerKey = opts.minerKey
    this._persistence = persistence
    this._poolGuardPath = opts.poolguard || config.persistence.path + '/worker_pool_guard.json'
    this._maxWorkers = max(1, maxWorkers - 1)
    this._emitter = new EventEmitter()
    this._startupCheck = false
    this._workers = {}
    writeFileSync('.workermutex', '0')
  }

  get emitter (): EventEmitter {
    return this._emitter
  }

  get persistence (): RocksDb {
    return this._persistence
  }

  get pool (): ChildProcess {
    return this._pool
  }

  /*
   * Boot workers
   */
  async allRise (): Promise<*> {
    debug('allRise()')
    const pool: ChildProcess = fork(MINER_POOL_WORKER_PATH)
    pool.on('message', this._handlePoolMessage.bind(this))
    pool.on('error', this._handlePoolError.bind(this))
    pool.on('exit', this._handlePoolExit.bind(this))
    pool.send({ type: 'config', maxWorkers: this._maxWorkers })
    this._pool = pool

    this.emitter.emit('ready')
    debug('allRise()')
    return Promise.resolve(true)
  }

  _sendMessage (msg: Object): boolean {
    try {
      // if(this._workers[pid] !== undefined && this._workers[pid].connected){
      this._pool.send(msg)
      // }
    } catch (err) {
      this._logger.error(err)
      this._pool = this._scheduleNewPool()
      this._pool.once('online', () => {
        this._pool.send(msg)
      })
    }
    return true
  }

  updateWorkers (msg: Object): void {
    this._sendMessage(msg)
  }

  async dismissWorker (worker?: Object): Promise<bool> {
    if (worker === undefined) {
      return Promise.resolve(true)
    }
    worker = this._workers[worker.pid]

    if (!worker) {
      return true
    }

    if (worker.connected) {
      try {
        worker.disconnect()
      } catch (err) {
        this._logger.info(`unable to disconnect workerProcess, reason: ${err.message}`)
      }
    }

    try {
      worker.removeAllListeners()
    } catch (err) {
      this._logger.info(`unable to remove workerProcess listeners, reason: ${err.message}`)
    }

    // $FlowFixMe
    if (worker !== undefined && worker.killed !== true) {
      try {
        worker.kill()
      } catch (err) {
        this._logger.info(`Unable to kill workerProcess, reason: ${err.message}`)
      }
    }

    if (this._workers[worker.pid]) {
      delete this._workers[worker.pid]
    }

    return true
  }

  _scheduleNewPool () {
    const pool: ChildProcess = fork(MINER_POOL_WORKER_PATH)
    pool.on('message', this._handlePoolMessage.bind(this))
    pool.on('error', this._handlePoolError.bind(this))
    pool.on('exit', this._handlePoolExit.bind(this))
    this._pool = pool
    return pool
  }

  _handlePoolMessage (msg: Object) {
    /*
     * { type: 'solution',
     *   data: {
     *    distance: '',
     *    nonce: '',
     *    timestamp: ''
     *   },
     *   workId: '000000'
     * }
     *
     */
    if (msg === undefined) {
      // strange unrequested feedback from worker
      // definately throw and likely exit
      this._logger.warn('unable to parse message from worker pool')
    } else if (msg.type === 'solution') {
      // handle block
      if (msg.data !== undefined && msg.workId !== undefined) {
        msg.data.workId = msg.workId
        this.emitter.emit('mined', msg.data)
      }
    }
  }

  _handlePoolError (msg: Object) {
    this._logger.error(msg)
    return true
  }

  _handlePoolExit (exitCode: Object) {
    // worker ahs exited
    const pool: ChildProcess = fork(MINER_POOL_WORKER_PATH)
    pool.on('message', this._handlePoolMessage.bind(this))
    pool.on('error', this._handlePoolError.bind(this))
    pool.on('exit', this._handlePoolExit.bind(this))
    this._pool = pool
    return true
  }
}
