/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type { Logger } from 'winston'
import type { DfConfig } from '../../bc/validation'
import type { RoverClient } from '../../protos/rover_grpc_pb'
import type { RoverMessage } from '../../protos/rover_pb'
const profiles = require('@cityofzion/neo-js/dist/common/profiles')
const { sites } = require('./mesh.json')
const NeoMesh = require('@cityofzion/neo-js/dist/node/mesh')
const NeoNode = require('@cityofzion/neo-js/dist/node/node')
const Neon = require('@cityofzion/neon-js')
const { inspect } = require('util')
const LRUCache = require('lru-cache')
const { isEmpty, partial, range, sort } = require('ramda')
const { shuffle } = require('lodash')
const pRetry = require('p-retry')

const { Block, MarkedTransaction } = require('../../protos/core_pb')
const { RoverMessageType, RoverIdent, RoverSyncStatus } = require('../../protos/rover_pb')
const logging = require('../../logger')
const { networks } = require('../../config/networks')
const { errToString } = require('../../helper/error')
const { RpcClient } = require('../../rpc')
const { createUnifiedBlock, isBeforeSettleHeight } = require('../helper')
const { randomInt } = require('../utils')
const { rangeStep, randRange } = require('../../utils/ramda')
const ts = require('../../utils/time').default // ES6 default export
const { ROVER_DF_VOID_EXIT_CODE } = require('../manager')
const { ROVER_RESYNC_PERIOD, ROVER_SECONDS_PER_BLOCK } = require('../utils')

const BC_NETWORK = process.env.BC_NETWORK || 'main'
const PING_PERIOD = 20000
const NEO_MAX_FETCH_BLOCKS = 10
const NEO_EMB_ASSET_ID = networks[BC_NETWORK].rovers.neo.embAssetId
const _TRANSFER_CALL_BUF = Buffer.from('transfer').toString('hex')
const ROVER_NAME = 'neo'

const localMesh = sites.reduce((all, site) => {
  if (site.type === 'RPC') {
    if (site.protocol === 'https' || site.protocol === 'http') {
      let port = 80
      let address = false
      if (site.port !== undefined) {
        port = Number(site.port)
      } else if (site.protocol === 'https') {
        port = 443
      } else if (site.url !== undefined && site.url.indexOf('https') > -1) {
        port = 443
      }
      // determine key availability. Accolade to @davidthamwf.
      if (site.address !== undefined) {
        address = site.address
      } else if (site.url !== undefined) {
        address = site.url
      }

      if (address && address.indexOf('http') < 0 && port !== 443) {
        address = 'http://' + address
      } else if (address && address.indexOf('https') < 0 && port === 443) {
        address = 'https://' + address
      }

      if (address !== false) {
        const obj = {
          domain: address,
          port: port
        }
        all.push(obj)
      }
    }
  }
  return all
}, [])

process.on('uncaughtError', (err) => {
  /* eslint-disable */
  console.trace(err)
  /* eslint-enable */
  process.exit()
})

type NeoTx = {
  txid: string,
  size: number,
  type: 'MinerTransaction'|'ContractTransaction'|'InvocationTransaction',
  version: number,
  attributes: any[],
  vin: any[],
  vout: any[],
  sys_fee: string,
  net_fee: string,
  scripts: any[],
  script?: string,
  gas?: string,
  nonce?: number
};

type NeoBlock = { // eslint-disable-line no-undef
  hash: string,
  size: number,
  version: number,
  previousblockhash: string,
  merkleroot: string,
  time: number,
  index: number,
  nonce: string,
  nextconsensus: string,
  script: {
    invocation: string,
    verification: string,
  },
  tx: NeoTx[],
  confirmations: number,
  nextblockhash: string
}

async function buildMarkedTransaction (tx: NeoTx, loggerFn: (string, string) => undefined = console.log.bind(console), roverRpc, txIdx: number, blockHeight: number): MarkedTransaction|undefined {
  if (NEO_EMB_ASSET_ID === null || tx.type !== 'InvocationTransaction' || !tx.script) {
    return
  }
  const stringStream = new Neon.u.StringStream(tx.script)
  let scripts = []
  let script
  let hasScript = true
  while (hasScript) {
    try {
      script = Neon.default.deserialize.script(stringStream)
      scripts.push(script)
    } catch (_) {
      // could not decode more
      hasScript = false
    }
  }

  if (scripts.length !== 2) {
    loggerFn('debug', `Not exactly 2 scripts`)
    return
  }
  loggerFn('debug', scripts)
  const { invocationScript: amountRaw, verificationScript: toAddrRaw } = scripts[0]
  const { invocationScript: fromAddrRaw, verificationScript: scriptAvm } = scripts[1]

  let amount
  let fromAddr
  let toAddr
  let scriptParams
  try {
    amount = Neon.u.Fixed8.fromReverseHex(amountRaw).toString()
    fromAddr = Neon.wallet.getAddressFromScriptHash(Neon.u.reverseHex(fromAddrRaw))
    toAddr = Neon.wallet.getAddressFromScriptHash(Neon.u.reverseHex(toAddrRaw))
    scriptParams = new Neon.sc.ScriptBuilder(scriptAvm).toScriptParams()
  } catch (e) {
    loggerFn('warning', `failed to decode tx scripts (txid: ${tx}), scripts: ${inspect(scripts)}`)
  }

  if (scriptParams.length !== 1 ||
    scriptParams[0].args.length !== 2 ||
    scriptParams[0].args[0] !== _TRANSFER_CALL_BUF) {
    return
  }

  const assetId = scriptParams[0].scriptHash
  loggerFn('debug', `f: ${fromAddr}, t: ${toAddr}, amt: ${amount}, asset: http://neotracker.io/asset/${assetId}`)

  let isEmbTx = (assetId === NEO_EMB_ASSET_ID)

  let isHeightBeforeSettlement
  if (!isEmbTx) {
    isHeightBeforeSettlement = await isBeforeSettleHeight(fromAddr, toAddr, ROVER_NAME, roverRpc)
  }

  if (isEmbTx || isHeightBeforeSettlement) {
    let tokenType = isEmbTx ? 'emb' : ROVER_NAME

    const tTx = new MarkedTransaction()
    tTx.setId(ROVER_NAME)
    tTx.setToken(tokenType)
    tTx.setAddrFrom(fromAddr)
    tTx.setAddrTo(toAddr)
    tTx.setValue(Buffer.from(amount, 'hex'))

    tTx.setBlockHeight(blockHeight)
    tTx.setIndex(txIdx)
    tTx.setHash(tx.txid)

    return tTx
  }
}

async function _createUnifiedBlock (loggerFn: (string, string) => typeof undefined, roverRpc: RoverClient, block: NeoBlock, isStandalone: boolean): Block {
  const obj = {}

  obj.blockNumber = block.index
  obj.prevHash = block.previousblockhash
  obj.blockHash = block.hash
  obj.root = block.merkleroot
  obj.size = block.size
  obj.nonce = block.nonce
  obj.nextConsensus = block.nextconsensus
  obj.timestamp = block.time * 1000
  obj.version = block.version
  obj.transactions = block.tx.reduce(function (all, t) {
    const tx = {
      txHash: t.txid,
      // inputs: t.inputs,
      // outputs: t.outputs,
      marked: false
    }
    all.push(tx)
    return all
  }, [])

  const msg = new Block()
  msg.setBlockchain(ROVER_NAME)
  msg.setHash(obj.blockHash)
  msg.setPreviousHash(obj.prevHash)
  msg.setTimestamp(obj.timestamp)
  msg.setHeight(obj.blockNumber)
  msg.setMerkleRoot(obj.root)

  const tokenTransactions = []
  for (let tx in block.tx) {
    let markedTx = await buildMarkedTransaction(tx, loggerFn, roverRpc, tokenTransactions.length, msg.getHeight())
    if (markedTx) {
      tokenTransactions.push(markedTx)
    }
  }

  msg.setMarkedTxsList(tokenTransactions)

  return msg
}

type PendingRequestPair = [number, number]
type PendingFiberPair = [number, Block]

/**
 * NEO Controller
 */
export default class Controller {
  _blockCache: LRUCache<string, bool>
  _rpc: RpcClient
  _logger: Logger
  _config: { isStandalone: bool, dfConfig: DfConfig }
  _neoMesh: Object
  _timeoutDescriptor: TimeoutID
  _networkRefreshIntervalDescriptor: IntervalID
  _checkFibersIntervalID: IntervalID
  _pendingRequests: Array<PendingRequestPair>
  _pendingFibers: Array<PendingFiberPair>
  _timeoutResync: ?TimeoutID

  constructor (config: { isStandalone: bool, dfConfig: DfConfig }) {
    this._config = config
    this._logger = logging.getLogger(__filename)
    this._blockCache = new LRUCache({
      max: 500,
      maxAge: 1000 * 60 * 60
    })
    const networkConfig = BC_NETWORK === 'main' ? profiles.rpc.mainnet : profiles.rpc.testnet
    this._neoMesh = new NeoMesh(shuffle(networkConfig.endpoints.concat(localMesh)).map(endpoint => {
      return new NeoNode({
        domain: endpoint.domain,
        port: endpoint.port,
        timeout: 2e3 // 2s, down from default 30s
      })
    }))
    this._rpc = new RpcClient()
    this._pendingRequests = []
    this._pendingFibers = []
    ts.start()
  }

  init () {
    this._logger.debug('initialized')

    process.on('disconnect', () => {
      this._logger.info('parent exited')
      process.exit()
    })

    process.on('uncaughtException', (e) => {
      this._logger.error(`Uncaught exception: ${errToString(e)}`)
      process.exit(3)
    })

    const rpcStream = this._rpc.rover.join(new RoverIdent(['neo']))
    rpcStream.on('data', (message: RoverMessage) => {
      this._logger.debug(`rpcStream: Received ${JSON.stringify(message.toObject(), null, 2)}`)
      switch (message.getType()) { // Also could be message.getPayloadCase()
        case RoverMessageType.REQUESTRESYNC:
          this.startResync(message.getResync())
          break

        case RoverMessageType.FETCHBLOCK:
          const payload = message.getFetchBlock()
          this.fetchBlock(payload.getFromBlock(), payload.getToBlock())
          break

        default:
          this._logger.warn(`Got unknown message type ${message.getType()}`)
      }
    })
    rpcStream.on('close', () => this._logger.info(`gRPC stream from server closed`))

    const { dfBound, dfVoid } = this._config.dfConfig.neo
    const loggerFn = this._logger.log.bind(this._logger)

    const cycle = () => {
      this._timeoutDescriptor = setTimeout(async () => {
        const node = this._neoMesh.getHighestNode()
        this._logger.debug(`Pending requests: ${inspect(this._pendingRequests)}, pending fibers: ${inspect(this._pendingFibers.map(([ts, b]) => { return [ts, b.toObject()] }))}`)

        if (isEmpty(this._pendingRequests)) {
          node.rpc.getBlockCount().then(height => node.rpc.getBlock(height - 1)).then(block => {
            const ts = block.time
            const requestTime = randRange(ts, ts + dfBound)
            this._pendingRequests.push([requestTime, block.index])
            // push second further to future
            this._pendingRequests.push([requestTime + 5, block.index + 1])
            setTimeout(cycle, 2000)
          }).catch(err => {
            this._logger.debug(`unable to start roving, could not get block count, err: ${err.message}`)
            setTimeout(cycle, 5000)
          })
          return
        }

        const [requestTimestamp, requestBlockHeight] = this._pendingRequests.shift()
        if (requestTimestamp <= ts.nowSeconds()) {
          node.rpc.getBlock(requestBlockHeight).then(async (block) => {
            this._logger.debug(`neo height set to ${requestBlockHeight}`)
            if (!this._blockCache.has(requestBlockHeight)) {
              this._blockCache.set(requestBlockHeight, true)
              this._logger.debug(`Unseen block with hash: ${block.hash} => using for BC chain`)

              // TODO: PING, not sure whether this await will work or not
              const unifiedBlock = await createUnifiedBlock(this._config.isStandalone, block, this._rpc.rover, partial(_createUnifiedBlock, [loggerFn]))
              const formatTimestamp = unifiedBlock.getTimestamp() / 1000 << 0
              const currentTime = ts.nowSeconds()
              this._pendingFibers.push([formatTimestamp, unifiedBlock])

              const maxPendingHeight = this._pendingRequests[this._pendingRequests.length - 1][1]
              if (currentTime + 5 < formatTimestamp + dfBound) {
                this._pendingRequests.push([randRange(currentTime, formatTimestamp + dfBound), maxPendingHeight + 1])
              } else {
                this._pendingRequests.push([randRange(currentTime, currentTime + 5), maxPendingHeight + 1])
              }
            }
            cycle()
          }, reason => {
            this._logger.error(reason)
            throw new Error(reason)
          }).catch(err => {
            this._logger.debug(`error while getting new block height: ${requestBlockHeight}, err: ${errToString(err)}`)
            // postpone remaining requests
            this._pendingRequests = this._pendingRequests.map(([ts, height]) => [ts + 10, height])
            // prepend currentrequest back but schedule to try it in [now, now + 10s]
            this._pendingRequests.unshift([randRange(ts.nowSeconds(), ts.nowSeconds() + 10), requestBlockHeight])
            setTimeout(cycle, 5000)
          })
        } else {
          // prepend request back to queue - we have to wait until time it is scheduled
          this._pendingRequests.unshift([requestTimestamp, requestBlockHeight])
          setTimeout(cycle, 5000)
        }
      }, 4000)
    }

    const pingNode = (node: NeoNode) => {
      this._logger.debug('pingNode triggered.', `node: [${node.domain}:${node.port}]`)
      const t0 = Date.now()
      node.pendingRequests += 1
      node.rpc.getBlockCount()
        .then((res) => {
          this._logger.debug('getBlockCount success:', res)
          const blockCount = res
          node.blockHeight = blockCount
          node.index = blockCount - 1
          node.active = true
          node.age = Date.now()
          node.latency = node.age - t0
          node.pendingRequests -= 1
          this._logger.debug('node.latency:', node.latency)
        })
        .catch((err) => {
          this._logger.debug(`getBlockCount failed, ${err.reason}`)
          node.active = false
          node.age = Date.now()
          node.pendingRequests -= 1
        })
    }

    const checkFibers = () => {
      if (isEmpty(this._pendingFibers)) {
        this._logger.debug(`No fiber ready, waiting: ${inspect(
          this._pendingFibers.map(([ts, b]) => ([ts, b.getHash()]))
        )}`)
        return
      }
      this._logger.debug(`Fibers count ${this._pendingFibers.length}`)
      const fiberTs = this._pendingFibers[0][0]
      if (fiberTs + dfBound < ts.nowSeconds()) {
        const [, fiberBlock] = this._pendingFibers.shift()
        this._logger.debug('NEO Fiber is ready, going to call this._rpc.rover.collectBlock()')

        if (this._config.isStandalone) {
          this._logger.debug(`Would publish block: ${inspect(fiberBlock.toObject())}`)
          return
        }

        if (fiberTs + dfVoid < ts.nowSeconds()) {
          this._logger.debug(`Would publish block: ${inspect(fiberBlock.toObject())}`)
          process.exit(ROVER_DF_VOID_EXIT_CODE)
        }

        if (!this._config.isStandalone) {
          this._rpc.rover.collectBlock(fiberBlock, (err, response) => {
            if (err) {
              this._logger.error(`Error while collecting block ${inspect(err)}`)
              return
            }
            this._logger.debug(`Collector Response: ${JSON.stringify(response.toObject(), null, 4)}`)
          })
        } else {
          this._logger.info(`Rovered NEO block: ${inspect(fiberBlock.toObject())}`)
        }
      }
    }

    cycle()

    this._checkFibersIntervalID = setInterval(checkFibers, 1000)

    // Ping all nodes in order to setup their height and latency
    this._neoMesh.nodes.forEach((node) => {
      pingNode(node)
    })

    setInterval(() => {
      // this._logger.info(`peer count pool: ${pool.numberConnected()} dp: ${network.discoveredPeers}, sp: ${network.satoshiPeers}, q: ${network.hasQuorum()}, bh: ${network.bestHeight}`)
      const pendingUpdate = Math.floor(this._neoMesh.nodes.reduce((all, node) => {
        all = all + node.pendingRequests
        return all
      }, 0) / this._neoMesh.nodes.length)
      const active = this._neoMesh.nodes.reduce((all, node) => {
        if (node.active !== undefined && node.active === true) {
          all++
        }
        return all
      }, 0)
      this._logger.info('mesh count pool: ' + active + '/' + this._neoMesh.nodes.length + ' pending state changes: ' + pendingUpdate)
    }, 9 * 1000)

    // Ping a random node periodically
    // TODO: apply some sort of priority to ping inactive node less frequent
    this._networkRefreshIntervalDescriptor = setInterval(() => {
      pingNode(this._neoMesh.getRandomNode())
    }, PING_PERIOD)
  }

  startResync (resyncMsg: RoverMessage.Resync) {
    this._logger.debug(`needs_resync starting`)
    if (!this._timeoutResync) {
      this._timeoutResync = setTimeout(() => {
        pRetry(() => {
          this._logger.debug('retrying getBlockCount()')
          return this._neoMesh.getRandomNode().rpc.getBlockCount()
        }, { retries: 5, maxRetryTime: 5e3 }).then(height => {
          let whichBlocks: number[] = []
          if (!isEmpty(resyncMsg.getIntervalsList())) {
            for (const interval of resyncMsg.getIntervalsList()) {
              whichBlocks = range(interval.getFromBlock(), interval.getToBlock() + 1).concat(whichBlocks)
            }
            const knownLatestBlock = resyncMsg.getLatestBlock()
            if (knownLatestBlock && knownLatestBlock.getHeight() < height) {
              whichBlocks = range(knownLatestBlock.getHeight(), height).concat(whichBlocks)
            }

            // sort blocks in reverse order
            whichBlocks = sort((a, b) => b - a, whichBlocks)
          } else {
            const from = height - ROVER_RESYNC_PERIOD / ROVER_SECONDS_PER_BLOCK['neo'] | 0
            const to = height
            const step = ((to - from) / 500) | 0
            whichBlocks = rangeStep(from, step, to) // TODO do not intersperse these
          }
          let successCount = 0
          for (let height of whichBlocks) {
            pRetry(() => this._neoMesh.getRandomNode().rpc.getBlock(height), {
              onFailedAttempt: error => {
                this._logger.debug(`Block ${height} attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`)
              },
              retries: 50,
              factor: 1.1,
              randomize: true,
              maxTimeout: 2e3
            }).then((block) => {
              successCount++
              if (successCount === whichBlocks.length) {
                this._logger.info('Initial sync finished')
                this._timeoutResync = undefined
                this._rpc.rover.reportSyncStatus(new RoverSyncStatus(['neo', true]))
              } else {
                this._logger.debug(`${successCount} done, ${whichBlocks.length - successCount} to go`)
              }

              if (!this._blockCache.has(block.index)) {
                this._blockCache.set(block.index, true)
                this._logger.debug(`Fetched block with hash: ${block.hash}`)
                const loggerFn = this._logger.log.bind(this._logger)

                createUnifiedBlock(this._config.isStandalone, block, this._rpc.rover, partial(_createUnifiedBlock, [loggerFn])).then((unifiedBlock) => {
                  if (!this._config.isStandalone) {
                    this._rpc.rover.collectBlock(unifiedBlock, (err, response) => {
                      if (err) {
                        this._logger.debug(`Error while collecting block ${inspect(err)}`)
                        return
                      }
                      this._logger.debug(`Collector Response: ${JSON.stringify(response.toObject(), null, 4)}`)
                    })
                  } else {
                    this._logger.info(`Rovered NEO block ${unifiedBlock.getHeight()}, h: ${unifiedBlock.getHash()}`)
                  }
                })
              }
            }).catch(err => {
              this._logger.debug(`error while getting new block height: ${height}, err: ${errToString(err)}`)
            })
          }
        })
      }, randomInt(2000, 5000))
    }
  }

  fetchBlock (previousLatest: Block, currentLatest: Block) {
    let from = previousLatest.getHeight() + 1
    let to = currentLatest.getHeight()

    // if more than NEO_MAX_FETCH_BLOCKS would be fetch, limit this to save centralized chains
    if (to - from > NEO_MAX_FETCH_BLOCKS) {
      this._logger.warn(`Would fetch ${to - from} blocks but NEO can't handle such load, fetching only ${NEO_MAX_FETCH_BLOCKS}`)
      from = to - NEO_MAX_FETCH_BLOCKS
    }
    const whichBlocks = range(from, to)

    if (from - to > 0) {
      this._logger.info(`Fetching missing blocks ${whichBlocks}`)
      const node = this._neoMesh.getHighestNode()
      const loggerFn = this._logger.log.bind(this._logger)
      whichBlocks.forEach(height => {
        node.rpc.getBlock(height).then(block => {
          if (!this._blockCache.has(height)) {
            this._blockCache.set(height, true)
            this._logger.debug(`Fetched block with hash: ${block.hash}`)

            createUnifiedBlock(this._config.isStandalone, block, this._rpc.rover, partial(_createUnifiedBlock, [loggerFn])).then((unifiedBlock) => {
              if (!this._config.isStandalone) {
                this._rpc.rover.collectBlock(unifiedBlock, (err, response) => {
                  if (err) {
                    this._logger.debug(`Error while collecting block ${inspect(err)}`)
                    return
                  }
                  this._logger.debug(`Collector Response: ${JSON.stringify(response.toObject(), null, 4)}`)
                })
              } else {
                this._logger.info(`Rovered NEO block ${inspect(unifiedBlock)}`)
              }
            })
          }
        }, reason => {
          this._logger.error(reason)
          throw new Error(reason)
        }).catch(err => {
          this._logger.debug(`error while getting new block height: ${height}, err: ${errToString(err)}`)
        })
      })
    }
  }

  close () {
    ts.stop()
    this._timeoutDescriptor && clearTimeout(this._timeoutDescriptor)
    this._networkRefreshIntervalDescriptor && clearInterval(this._networkRefreshIntervalDescriptor)
    this._checkFibersIntervalID && clearInterval(this._checkFibersIntervalID)
  }
}
