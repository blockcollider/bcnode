/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type { RoverSyncStatus } from '../persistence/rocksdb'

const { fork } = require('child_process')
const { glob } = require('glob')
const fs = require('fs')
const path = require('path')
const { all, flatten, groupBy, values } = require('ramda')

const debug = require('debug')('bcnode:rover:manager')
const logging = require('../logger')
const { errToString } = require('../helper/error')
const { Block } = require('../protos/core_pb')
const { RoverMessage, RoverMessageType } = require('../protos/rover_pb')
const { RpcClient } = require('../rpc')

const BC_NETWORK: 'main'|'test' = process.env.BC_NETWORK || 'main'
const ROVER_RESTART_TIMEOUT = 15000
const ROVED_DATA_PATH = path.resolve(__dirname, '..', '..', '_debug')
export const ROVER_DF_VOID_EXIT_CODE = 16

/**
 * Rover lookup table
 *
 * Gets the rover path by name of it
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
export class RoverManager {
  _logger: Object
  _rovers: Object
  _roverConnections: { [roverName: string]: Object }
  _roverBootstrap: { [roverName: string]: boolean }
  _roverSyncStatus: { [roverName: string]: boolean }
  _timeouts: Object

  constructor () {
    this._logger = logging.getLogger(__filename)
    this._rovers = {}
    this._roverConnections = {}
    this._roverBootstrap = {}
    this._roverSyncStatus = {}
    this._timeouts = {}
  }

  get rovers (): Object {
    return this._rovers
  }

  roverRpcJoined (call: Object) {
    const roverName = call.request.getRoverName()
    this._logger.debug(`Rover ${roverName} joined using gRPC`)
    // TODO check if connection not already present
    this._roverConnections[roverName] = call
  }

  setRoverSyncStatus (call: Object) {
    const roverName = call.request.getRoverName()
    const isSynced = call.request.getStatus()
    this._logger.debug(`Rover ${roverName} reporting sync status: ${isSynced}`)
    this._roverSyncStatus[roverName] = isSynced
  }

  areRoversSynced () {
    return all(t => t, values(this._roverSyncStatus))
  }

  /**
   * Start rover
   * @param roverName Name of rover to start
   * @returns {boolean} result
   */
  startRover (roverName: string) {
    const roverPath = rovers[roverName]

    if (!roverPath) {
      this._logger.error(`rover is not implemented '${roverName}'`)
      return false
    }

    this._logger.info(`starting rover '${roverName}' on '${BC_NETWORK}net' using '${roverPath}'`)
    // const cycleInterval = Math.floor(Math.random() * 50000)
    // const roverRefreshTimeout = (1000 * 10) + cycleInterval
    // NOTE: no need to specify env here, default is "inherit all"
    const rover = fork(
      roverPath,
      [],
      {
        execArgv: []
      }
    )
    this._logger.info(`rover started '${roverName}'`)
    this._rovers[roverName] = rover
    this._roverSyncStatus[roverName] = true
    // this._timeouts[roverName] = setTimeout(() => {
    //  this._logger.info('cycling rover ' + roverName)
    //  return this._killRover(roverName)
    // }, roverRefreshTimeout)
    rover.on('exit', (code, signal) => {
      this._logger.warn(`rover ${roverName} exited (code: ${code}, signal: ${signal}) - restarting in ${ROVER_RESTART_TIMEOUT / 1000}s`)
      delete this._rovers[roverName]
      this._roverConnections[roverName] && this._roverConnections[roverName].end()
      delete this._roverConnections[roverName]
      delete this._roverBootstrap[roverName]
      this._roverSyncStatus[roverName] = true
      // TODO ROVER_RESTART_TIMEOUT should not be static 5s but probably some exponential backoff series separate for each rover
      if (code !== ROVER_DF_VOID_EXIT_CODE) {
        setTimeout(() => {
          this.startRover(roverName)
        }, ROVER_RESTART_TIMEOUT)
      }
    })

    return true
  }

  messageRover (roverName: string, message: string, payload: RoverSyncStatus|{ previousLatest: Block, currentLatest: Block }): ?Error {
    const roverRpc = this._roverConnections[roverName]
    if (!roverRpc) {
      // This is necessary to prevent fail while rovers are starting - once we
      // try to resend message after 10s, if it fails for the second time, bail
      // with error as usual
      if (!this._roverBootstrap[roverName]) {
        this._logger.debug(`Retrying messageRover() after 10s - rover not booted yet`)
        this._roverBootstrap[roverName] = true
        setTimeout(() => {
          this.messageRover(roverName, message, payload)
        }, 10000)
        return
      }
      throw new Error(`${roverName} rover's gRPC not running`)
    }

    const msg = new RoverMessage()
    switch (message) {
      case 'needs_resync':
        const resyncPayload = new RoverMessage.Resync()
        msg.setType(RoverMessageType.REQUESTRESYNC)
        resyncPayload.setLatestBlock(payload.latestBlock)
        const intervalsFetchBlocks = payload.intervals.map(([from, to]) => new RoverMessage.Resync.Interval([from, to]))
        resyncPayload.setIntervalsList(intervalsFetchBlocks)
        msg.setResync(resyncPayload)
        roverRpc.write(msg)
        this._roverSyncStatus[roverName] = false
        break

      case 'fetch_block':
        if (!payload) {
          throw new Error(`For fetch_block payload has to be provided, ${payload} given`)
        }
        const fetchBlockPayload = new RoverMessage.FetchBlock()
        fetchBlockPayload.setFromBlock(payload.previousLatest)
        fetchBlockPayload.setToBlock(payload.currentLatest)
        msg.setType(RoverMessageType.FETCHBLOCK)
        msg.setResync(fetchBlockPayload)
        roverRpc.write(msg)
        break

      default:
        throw new Error(`Unknown message ${message}`)
    }
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

  replay () {
    debug('Replaying roved blocks')

    const pattern = path.join(ROVED_DATA_PATH, '**/unified/*.json')
    let files: Array<string> = glob.sync(pattern)

    const groups = groupBy((p) => {
      const parts = p.split(path.sep)
      return parts[parts.length - 4]
    })(files)

    const tmp: Array<any> = Object.keys(groups)
      .map((k: string) => {
        return groups[k].slice(-1)
      }) || []

    // $FlowFixMe
    files = flatten(tmp)
      .sort((a, b) => {
        const fnameA = path.posix.basename(a)
        const fnameB = path.posix.basename(b)

        if (fnameA < fnameB) {
          return -1
        } else if (fnameA > fnameB) {
          return 1
        }

        return 0
      })

    const rpc = new RpcClient()

    files.forEach((f) => {
      const json = fs.readFileSync(f).toString()
      const obj = JSON.parse(json)
      const block = new Block()
      block.setBlockchain(obj.blockchain)
      block.setHash(obj.hash)
      block.setPreviousHash(obj.previousHash)
      block.setTimestamp(obj.timestamp)
      block.setHeight(obj.height)
      block.setMerkleRoot(obj.merkleRoot)

      debug(`Replaying roved block`, f, obj)

      rpc.rover.collectBlock(block, (err) => {
        if (err) {
          debug(`Unable to collect block ${f}`, err)
        } else {
          debug('recieved block from ' + obj.blockchain)
        }
      })
    })
  }

  /**
   * Kill rover managed by this manager by its name
   * @param roverName
   * @private
   */
  _killRover (roverName: string) {
    this._roverConnections[roverName] && this._roverConnections[roverName].end()
    delete this._roverConnections[roverName]
    delete this._roverBootstrap[roverName]
    this._roverSyncStatus[roverName] = true
    const { pid } = this._rovers[roverName]
    this._logger.info(`Killing rover '${roverName}', PID: ${pid}`)
    try {
      process.kill(pid, 'SIGHUP')
    } catch (err) {
      this._logger.warn(`Error while killing rover '${roverName}', PID: ${pid}, error: ${errToString(err)}`)
    }
  }
}

export default RoverManager
