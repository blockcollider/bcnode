#! /usr/bin/env node

/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {
  Logger
} from 'winston'
const process = require('process')
const {
  getExpFactorDiff,
  getNewPreExpDifficulty,
  getNewBlockCount,
  mine
} = require('./primitives')
const {
  BlockchainHeaders,
  BlockchainHeader,
  BcBlock
} = require('../protos/core_pb')
const ts = require('../utils/time').default // ES6 default export
const cluster = require('cluster')
const logging = require('../logger')
const { mean } = require('ramda')
const BN = require('bn.js')
const fkill = require('fkill')
const MINER_RECYCLE_INTERVAL = 660000 + Math.floor(Math.random() * 10) * 10000
const KRAD_LOGGING_INTERVAL = 11500
const globalLog: Logger = logging.getLogger(__filename)

// setup logging of unhandled rejections
process.on('uncaughtError', (err) => {
  // $FlowFixMe
  globalLog.error(`error, trace:\n${err.stack}`)
})
process.on('unhandledRejection', (err) => {
  // $FlowFixMe
  globalLog.error(`rejected promise, trace:\n${err.stack}`)
})

const settings = {
  maxWorkers: 2
}

const sendWorker = (worker, msg) => {
  return new Promise((resolve, reject) => {
    try {
      return worker.send(msg, resolve)
    } catch (err) {
      return reject(err)
    }
  })
}

if (cluster.isMaster) {
  const stats = []
  const active = []

  process.once('SIGTERM', () => {
    process.exit(0)
  })
  process.once('SIGINT', () => {
    process.exit(0)
  })
  process.once('exit', () => {
    globalLog.info('worker exited')
  })

  process.on('message', (data) => {
    const createThread = function () {
      const worker = cluster.fork()
      active.unshift(worker.id)
      return worker
    }

    const applyEvents = (worker) => {
      worker.once('message', (data) => {
        stats.unshift(new BN(data.data.iterations).div(new BN(data.data.timeDiff)).toNumber())
        if (stats.length > 5) { stats.pop() }
        process.send({
          type: 'solution',
          data: data.data,
          workId: data.workId
        }, () => {
          (async () => {
            try {
              await fkill('bcworker', { force: true })
            } catch (err) {
              globalLog.debug(err)
            }
            active.length = 0
            if (cluster.workers !== undefined && Object.keys(cluster.workers).length > 0) {
              Object.keys(cluster.workers).map((id) => {
                if (cluster.workers[id].isConnected() === true) {
                  cluster.workers[id].disconnect()
                }
                if (cluster.workers[id] !== undefined) {
                  cluster.workers[id].kill()
                }
              })
            }
          })()
            .catch((err) => {
              globalLog.error(err.message + ' ' + err.stack)
            })
        })
      })
      return worker
    }
    if (data.type === 'config') {
      settings.maxWorkers = data.maxWorkers || settings.maxWorkers
    } else if (data.type === 'work') {
      // expressed in Radians (cycles/second) / 2 * PI
      (async () => {
        const workerA = applyEvents(createThread())
        await sendWorker(workerA, data.data)
        // const workerB = applyEvents(createThread())
        // await sendWorker(workerB, data.data)
        // const workerC = applyEvents(createThread())
        // await sendWorker(workerC, data.data)
        // const workerB = applyEvents(createThread())
        // await sendWorker(workerB, data.data)
        // if (Object.keys(cluster.workers).length < settings.maxWorkers) {
        // const deploy = settings.maxWorkers - Object.keys(cluster.workers).length
        // const worker = applyEvents(createThread())
        // await sendWorker(worker, data.data)
        // const deploy = settings.maxWorkers
        // for (let i = 0; i < deploy; i++) {
        //  const worker = applyEvents(createThread())
        //  await sendWorker(worker, data.data)
        // }
      })()
        .catch((err) => {
          globalLog.error(err.message + ' ' + err.stack)
        })
    }
  })

  setInterval(() => {
    if (Object.keys(cluster.workers).length > 0) {
      fkill('bcworker', { force: true })
        .then(() => {
          globalLog.info('global pool rebase success')
        })
        .catch((err) => {
          globalLog.debug(err.message)
        })
    }
  }, MINER_RECYCLE_INTERVAL)

  setInterval(() => {
    if (stats.length >= 5) {
      let workerLimit = 1
      if (cluster.workers !== undefined && Object.keys(cluster.workers).length > 1) {
        workerLimit = Object.keys(cluster.workers).length
      }
      const distancePerSecond = mean(stats) * 1000
      const distancePerRadianSecond = new BN(distancePerSecond).div(new BN(6.283)).toNumber() // TODO: does not support remainder
      const coreCountAdjustment = new BN(distancePerRadianSecond).mul(new BN(workerLimit)).toNumber()
      const formattedMetric = Math.round(coreCountAdjustment * 100) / 100000

      if (formattedMetric !== undefined && formattedMetric > 0) {
        globalLog.info('\r\n  ' + formattedMetric + ' kRAD/s -> radian distance collisions performance metric -> proof of distance miner\n\r')
      }
    } else if (stats.length > 0) {
      globalLog.info('\r\n  ' + 'sampling radian distance performance <- ' + stats.length + '/5\n\r')
    }
  }, KRAD_LOGGING_INTERVAL)

  globalLog.info('pool controller ready ' + process.pid)
} else {
  /**
   * Miner woker entrypoint
   */
  process.title = 'bcworker'
  const variableTimeout = 12000 + Math.floor(Math.random() * 10000)
  setTimeout(() => {
    globalLog.info('worker ' + process.pid + ' dismissed after ' + Math.floor(variableTimeout / 1000) + 's')
    process.exit()
  }, variableTimeout)

  const main = () => {
    process.on('message', ({
      workId,
      currentTimestamp,
      offset,
      work,
      minerKey,
      merkleRoot,
      newestChildBlock,
      difficulty,
      difficultyData
    }) => {
      ts.offsetOverride(offset)
      // Deserialize buffers from parent process, buffer will be serialized as object of this shape { <idx>: byte } - so use Object.values on it
      const deserialize = (buffer: {
                [string]: number
            }, clazz: BcBlock | BlockchainHeader | BlockchainHeaders) => clazz.deserializeBinary(new Uint8Array(Object.values(buffer).map(n => parseInt(n, 10))))

      // function with all difficultyData closed in scope and
      // send it to mine with all arguments except of timestamp and use it
      // each 1s tick with new timestamp
      const difficultyCalculator = function () {
        // Proto buffers are serialized - let's deserialize them
        const {
          lastPreviousBlock,
          newBlockHeaders
        } = difficultyData
        const lastPreviousBlockProto = deserialize(lastPreviousBlock, BcBlock)
        const newBlockHeadersProto = deserialize(newBlockHeaders, BlockchainHeaders)

        // return function with scope closing all deserialized difficulty data
        return function (timestamp: number) {
          const newBlockCount = getNewBlockCount(lastPreviousBlockProto.getBlockchainHeaders(), newBlockHeadersProto)

          const preExpDiff = getNewPreExpDifficulty(
            timestamp,
            lastPreviousBlockProto,
            newestChildBlock,
            newBlockCount
          )
          return getExpFactorDiff(preExpDiff, lastPreviousBlockProto.getHeight()).toString()
        }
      }

      try {
        const solution = mine(
          currentTimestamp,
          work,
          minerKey,
          merkleRoot,
          difficulty,
          difficultyCalculator()
        )

        process.send({
          data: solution,
          workId: workId
        }, () => {
          globalLog.info(`purposed candidate found: ${JSON.stringify(solution, null, 0)}`)
          fkill('bcworker', { force: true })
            .then(() => {
              globalLog.info('global pool rebase success')
            })
            .catch((err) => {
              globalLog.debug(err.message)
            })
        })
      } catch (e) {
        globalLog.warn(`mining failed -> reason: ${e.message}, stack ${e.stack}`)
        process.exit(3)
      }
    })
  }

  main()
}
