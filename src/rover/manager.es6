/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { fork } = require('child_process')
const { glob } = require('glob')
const fs = require('fs')
const path = require('path')

const debug = require('debug')('bcnode:rover:manager')
const logging = require('../logger')
const { errToString } = require('../helper/error')
const { Block } = require('../protos/core_pb')
const { RpcClient } = require('../rpc')

const ROVER_RESTART_TIMEOUT = 5000
const ROVED_DATA_PATH = path.resolve(__dirname, '..', '..', '_debug')

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
      delete this._rovers[roverName]
      // TODO ROVER_RESTART_TIMEOUT should not be static 5s but probably some exponential backoff series separate for each rover
      setTimeout(() => {
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

  replay () {
    debug('Replaying roved blocks')

    const pattern = path.join(ROVED_DATA_PATH, '**/unified/*.json')
    const files = glob.sync(pattern)
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

    files.slice(-100).forEach((f) => {
      const json = fs.readFileSync(f)
      const obj = JSON.parse(json)

      const block = new Block()
      block.setBlockchain(obj.blockchain)
      block.setHash(obj.hash)
      block.setPreviousHash(obj.previousHash)
      block.setTimestamp(obj.timestamp)
      block.setHeight(obj.height)
      block.setMerkleRoot(obj.merkleRoot)

      rpc.rover.collectBlock(block, (err) => {
        if (err) {
          debug(`Unable to collect block ${f}`, err)
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
    const { pid } = this._rovers[roverName]
    this._logger.info(`Killing rover '${roverName}', PID: ${pid}`)
    try {
      process.kill(pid, 'SIGHUP')
    } catch (err) {
      this._logger.warn(`Error while killing rover '${roverName}', PID: ${pid}, error: ${errToString(err)}`)
    }
  }
}
