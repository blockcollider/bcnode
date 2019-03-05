/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* global $Values */
import type { Engine } from '../engine'
type Socket = {
  resume: () => {},
  write: (msg: Buffer) => bool,
  remoteAddress: string,
  remotePort: number
}

const { inspect } = require('util')

const Url = require('url')
const queue = require('async/queue')
const bufferSplit = require('buffer-split')

const LRUCache = require('lru-cache')
const BN = require('bn.js')
const debug = require('debug')('bcnode:p2p:node')
const framer = require('frame-stream')
const backpressureWriteStream = require('stream-write')
const logging = require('../logger')
const { BcBlock, Transaction } = require('../protos/core_pb')
const { parseBoolean } = require('../utils/config')
const { InitialPeer } = require('../protos/p2p_pb')
const Discovery = require('./discovery')
const { Multiverse } = require('../bc/multiverse')
const { BlockPool } = require('../bc/blockpool')
// const { validateBlockSequence } = require('../bc/validation')
const { networks } = require('../config/networks')

export const MAX_HEADER_RANGE = Number(process.env.MAX_HEADER_RANGE) || 1000
export const MAX_DATA_RANGE = Number(process.env.MAX_DATA_RANGE) || 200
const BC_NETWORK: 'main'|'test'|'carter'|'mckinley'|'garfield'|'lincoln'|'kennedy'|'coolidge' = process.env.BC_NETWORK || 'main'
const { quorum, maximumWaypoints } = networks[BC_NETWORK]
const MIN_HEALTH_NET = process.env.MIN_HEALTH_NET === 'true'
const USER_QUORUM = parseInt(process.env.USER_QUORUM, 10) || quorum
const BC_MAX_CONNECTIONS = process.env.BC_MAX_CONNECTIONS || maximumWaypoints
const STRICT_SEND_BC = process.env.STRICT_SEND_BC || true
const DISABLE_IPH_TEST = parseBoolean(process.env.DISABLE_IPH_TEST)
const PEER_HEADER_SYNC_EXPIRE = 13660
const PEER_DATA_SYNC_EXPIRE = 15661
const _MAX_FRAME_SIZE = 16 * 1024 * 1024 // 16MB
const FRAMING_OPTS = {
  lengthSize: 4,
  getLength: function (buffer) {
    return buffer.readUInt32BE(0)
  },
  maxSize: _MAX_FRAME_SIZE
}

const { contains, find, isEmpty, max, min, merge, range, values } = require('ramda')
const { MESSAGES, MSG_SEPARATOR } = require('./protocol')
const { encodeTypeAndData, encodeMessageToWire } = require('./codec')

// const FULL_NODE_MSGS = [
//  MESSAGES.GET_BLOCK,
//  MESSAGES.GET_BLOCKS,
//  MESSAGES.BLOCKS,
//  MESSAGES.BLOCK,
//  MESSAGES.TX,
//  MESSAGES.GET_TXS
// ]

process.on('uncaughtError', (err) => {
  console.trace(err) // eslint-disable-line no-console
})

export class PeerNode {
  _logger: Object // eslint-disable-line no-undef
  _engine: Engine // eslint-disable-line no-undef
  _interval: IntervalID // eslint-disable-line no-undef
  _seededPeers: Object // eslint-disable-line no-undef
  _multiverse: Multiverse // eslint-disable-line no-undef
  _noDoubleSend: Object // eslint-disable-line no-undef
  _blockPool: BlockPool // eslint-disable-line no-undef
  _identity: string // eslint-disable-line no-undef
  _scanner: Object // eslint-disable-line no-undef
  _externalIP: string // eslint-disable-line no-undef
  _knownBlocks: Object // eslint-disable-line no-undef
  _discovery: Discovery // eslint-disable-line no-undef
  _queue: Object // eslint-disable-line no-undef
  _greetingRegister: Object // eslint-disable-line no-undef

  constructor (engine: Engine) {
    debug('--- NETWORK CONFIG ---\n' + JSON.stringify(networks[BC_NETWORK], null, 2))
    this._engine = engine
    this._multiverse = new Multiverse(engine.persistence) /// !important this is a (nonselective) multiverse
    this._blockPool = new BlockPool(engine.persistence, engine._pubsub)
    this._logger = logging.getLogger(__filename)
    this._discovery = {
      givenHostName: false
    }
    this._greetingRegister = {}
    this._knownBlocks = LRUCache({
      max: 1000
    })
    this._seededPeers = LRUCache({
      max: 1000
    })
    this._noDoubleSent = LRUCache({
      max: 500
    })
    this._queue = queue((task, cb) => {
      if (task.keys) {
        this._engine.persistence.getBulk(task.keys).then((res) => {
          cb(null, res)
        })
          .catch((err) => {
            cb(err)
          })
      } else {
        this._engine.persistence.get(task).then((res) => {
          cb(null, res)
        })
          .catch((err) => {
            cb(err)
          })
      }
    })

    async function statusInterval () {
      this._logger.info('active waypoints:  ' + this._discovery.connected)
      this._engine._emitter.emit('peerCount', this._discovery.connected)
      if (this._discovery.connected < USER_QUORUM && MIN_HEALTH_NET !== true) {
        try {
          debug('local client restarting IPH and IPD tests')
          await engine.persistence.put('bc.sync.initialpeerdata', 'pending')
          await engine.persistence.put('bc.sync.initialpeerheader', 'pending')
          await engine.persistence.put('bc.sync.initialpeernum', 0)
          await engine.persistence.put('bc.sync.initialpeerevents', [])
          await engine.persistence.put('bc.sync.initialpeer', new InitialPeer())
          await engine.persistence.put('bc.dht.quorum', 0)
        } catch (err) {
          this._logger.error(err)
        }
      }
    }
    // monitor peer connection status and resync peer evauations if quorum is lost
    setInterval(statusInterval.bind(this), 30900)
  }

  get blockpool (): BlockPool {
    return this._blockPool
  }

  get multiverse (): Multiverse {
    return this._multiverse
  }

  set multiverse (multiverse: Multiverse) {
    this._multiverse = multiverse
  }

  async getLiteMultiverse (latest: Object): Promise<*> {
    if (latest.getHeight() < 4) {
      return Promise.resolve([
        latest
      ])
    }
    const query = [
      'bc.block.' + (latest.getHeight() - 1),
      'bc.block.' + (latest.getHeight() - 2)
    ]

    try {
      const set = await this._engine.persistence.getBulk(query)
      // if it is a valid set of multiple options send it otherwise resolve with the latest
      if (set !== undefined && set !== false && set.length > 0) {
        set.unshift(latest)
        return Promise.resolve(set.sort((a, b) => {
          if (new BN(a.getHeight()).gt(new BN(b.getHeight())) === true) {
            return -1
          }
          if (new BN(a.getHeight()).lt(new BN(b.getHeight())) === true) {
            return 1
          }
          return 0
        }))
      }
      return Promise.resolve([latest])
    } catch (err) {
      this._logger.error(err)
      this._logger.warn('multiverse not set on disk')
      return Promise.resolve([latest])
    }
  }

  qsend (conn: Socket, msg: Buffer): Promise<{address: string, success: bool, message: string, allSent?: bool}> {
    return new Promise((resolve, reject) => {
      const wireData = encodeMessageToWire(msg)
      const address = `${conn.remoteAddress}:${conn.remotePort}`
      try {
        debug(`qsend(): about to write ${wireData.length}b`)
        backpressureWriteStream(conn, wireData, function (err, open) {
          if (err) {
            debug(`qsend(): error while writing data ${err.message}`)
            return resolve({
              address,
              success: false,
              message: err.message
            })
          }
          debug(`qsend(): wrote ${wireData.length}b`)
          return resolve({
            address,
            success: true,
            message: 'success'
          })
        })
      } catch (err) {
        if (err) {
          return resolve({
            address,
            success: false,
            message: err.message
          })
        }
        return resolve({
          address,
          success: false,
          message: 'connection lost'
        })
      }
    })
  }

  /*
   * resetPeerEvaluations
   */
  async resetPeerEvaluations () {
    debug('reseting peer evaluations')
    await this._engine.persistence.put('bc.sync.initialpeerheader', 'pending')
    await this._engine.persistence.put('bc.sync.initialpeerdata', 'pending')
    await this._engine.persistence.put('bc.sync.initialpeernum', 0)
    await this._engine.persistence.put('bc.sync.initialpeerevents', [])
    await this._engine.persistence.put('bc.sync.initialpeer', new InitialPeer())
    return Promise.resolve(true)
  }
  /*
   * reset block (including transaction indexes) from block height height
   */
  async resetBlocksFrom (height: number): Promise<boolean> {
    if (height > 2) {
      for (let i = 2; i < height; i++) {
        const block = await this._engine.persistence.getBlockByHeight(i)
        if (block !== null) {
          await this._engine.persistence.delBlock(block.getHash())
        }
      }
    }
    return true
  }

  /*
   * processPeerEvaluations
   * From peristence determines if matches exist and begins the header sync loop if so this happens
   */
  async processPeerEvaluations () {
    try {
      // loads events from disk, prevents multiple instantiations
      debug('running processPeerEvaluations')
      let events = await this._engine.persistence.get('bc.sync.initialpeerevents')
      if (events === null) {
        events = []
      }
      // if a peer has just been rejected this peer will be removed from events
      const needsResyncData = await this._engine.persistence.getDecisivePeriodOfCrossChainBlocksStatus()
      let roverSyncComplete = Object.values(needsResyncData).every(i => !i)
      roverSyncComplete = true // TODO: Remove override after P2P sync complete
      if (!roverSyncComplete) {
        debug('process peer evaluation requested, rover sync not complete')
        return false
      }
      // get the current synchronization peer context for headers and data
      let initialPeer = await this._engine.persistence.get('bc.sync.initialpeer')
      if (events === null || events.length === 0) {
        debug(`events not available`)
        return false
      }
      if (initialPeer === null) {
        initialPeer = new InitialPeer()
      }
      // get the status of the data evaluation
      const ipd = await this._engine.persistence.get('bc.sync.initialpeerdata')
      const iph = await this._engine.persistence.get('bc.sync.initialpeerheader')
      debug(`processPeerEvaluation running ipd: ${ipd} `)
      // if the initial peer is present, remove the peer from the events log
      if (!isEmpty(initialPeer.getAddress()) && ipd !== 'running' && iph !== 'running') {
        debug(`removing peer ${initialPeer.getAddress()}`)
        events = events.reduce((all, e) => {
          if (e.address !== initialPeer.getAddress()) {
            all.push(e)
          }
          return all
        }, [])
        await this._engine.persistence.put('bc.sync.initialpeerevents', events)
        // delete all headers range
        const latestBlock = await this._engine.persistence.get('bc.block.latest')
        if (!latestBlock) {
          this._logger.warn(`Couldn't get 'bc.block.latest' in processPeerEvaluations`)
          return
        }
        const latestHeight = latestBlock.getHeight()
        debug(`deleting header blocks from initial peer resetting initial peer evaluations`)
        if (latestHeight > 2) {
          for (let i = 2; i < latestHeight; i++) {
            debug(`purging block bc.block.${i}`)
            await this._engine.persistence.del(`bc.block.${i}`)
          }
        }
        // reset IPH back to pending
        await this._engine.persistence.put('bc.sync.initialpeerdata', 'pending')
        // switch IPH from complete to running
        await this._engine.persistence.put('bc.sync.initialpeerheader', 'running')
      // ipd stage is running, check if the peer has not responded in time
      } else if (ipd === 'running' && Number(new Date()) > Number(initialPeer.getExpires())) {
        // this means the given peer has expired
        debug(`peer has expired and events are being reset ${initialPeer.getExpires()}`)
        events = events.reduce((all, e) => {
          if (e.address !== initialPeer.getAddress()) {
            all.push(e)
          }
          return all
        }, [])

        let latestHeightRaw = await this._engine.persistence.get('bc.data.latest')
        debug(`after peer has expired resetting latest header height ${latestHeightRaw}`)
        if (latestHeightRaw === null) {
          await this._engine.persistence.put('bc.data.latest', 2)
          latestHeightRaw = 2
        }
        const latestHeight = parseInt(latestHeightRaw, 10)
        // remove the initial peer
        await this._engine.persistence.del('bc.sync.initialpeer')
        await this.resetBlocksFrom(latestHeight)
        // if there are not enough peers left reset headers and try again
      } else if (ipd === 'running') {
        //
        // let latestHeightRaw = await this._engine.persistence.get('bc.data.latest')
        // if (latestHeightRaw === null) {
        //  await this._engine.persistence.put('bc.data.latest', 2)
        //  latestHeightRaw = 2
        // }
        // const latestHeight = parseInt(latestHeightRaw, 10)
        // const latestBlock = await this._engine.persistence.get('bc.block.latest')
        // if (!latestBlock) {
        //  this._logger.warn(`Couldn't get 'bc.block.latest' in processPeerEvaluations`)
        //  return
        // }
        // const from = latestHeight
        // const to = min(latestHeight + 500, latestHeight + parseInt(latestBlock.getHeight(), 10))
        // debug(`ipd: ${ipd} with latest height from: ${from} to: ${to}`)
        // const fromBlock = await this._engine.persistence.get(`bc.block.${from}`)
        // const toBlock = await this._engine.persistence.get(`bc.block.${to}`)
        // const payload = encodeTypeAndData(MESSAGES.GET_DATA, [fromBlock.getHash(), toBlock.getHash()])
        // const conn = find(
        //  ({ remoteAddress, remotePort }) => `${remoteAddress}:${remotePort}` === initialPeer.getAddress(),
        //  this._discovery.connections
        // )
        // if (!conn) {
        //  // unable to locate active connection
        //  this._logger.warn(`unable to find given connection ${initialPeer.getAddress()}`)
        //  // expire the peer and rerun processPeerEvaluations
        //  initialPeer.setExpires(1)
        //  await this._engine.persistence.put('bc.sync.initialpeer', initialPeer)
        //  debug('unable to find connection -> requesting peer evaluations')
        //  return this.processPeerEvaluations()
        // } else {
        //  // connection exists
        //  debug('sending GET_DATA request to peer')
        //  const result = await this.qsend(conn, payload)
        //  if (result.success) {
        //    this._logger.info('successful update sent to peer')
        //  }
        // }
        // do not continue and evaluate the peer events -> return
        // this assumes ipd is 'running'
        // this assumes iph is 'complete'
        return Promise.resolve(true)
      }
      // if there are less than 2 event pairs trigger resync
      if (events.length < 2) {
        this._logger.warn('peer sync evaluations incomplete\n  > do not use a shared ip address\n  > clear local chain storage\n  > stop and start the local node\n')
        await this._engine.persistence.put('bc.sync.initialpeerevents', events)
        return Promise.resolve(true)
      }
      // only extract IPH events
      debug(`events to be matched ${events.length}`)
      const unmatched = events.reduce((table, e) => {
        if (e !== undefined && e.address && e.address !== initialPeer.getAddress()) {
          // only process the events of the initial Peer Eval type
          if (e.type === 'initialpeerheaderStart') {
            if (table[e.address] === undefined) {
              table[e.address] = {
                address: e.address,
                startTime: false,
                endTime: false,
                block: false
              }
            }
            table[e.address].startTime = e.timestamp
          } else if (e.type === 'initialpeerheaderEnd') {
            if (table[e.address] === undefined) {
              table[e.address] = {
                address: e.address,
                startTime: false,
                endTime: false,
                block: false
              }
            }
            table[e.address].endTime = e.timestamp
            table[e.address].block = e.block
          }
        }
        return table
      }, {})
      /* const matched =
       *   [{
       *      startTime: Number
       *      endTime: Number
       *      block: BcBlock
       *   }...]
       */
      debug('unmatched events')
      const matched = Object.keys(unmatched).reduce((pairs, addr) => {
        if (unmatched[addr].startTime !== false &&
          unmatched[addr].endTime !== false &&
          unmatched[addr].block !== false) {
          unmatched[addr].elapsed = unmatched[addr].endTime - unmatched[addr].startTime
          pairs.push(unmatched[addr])
        }
        return pairs
      }, [])
      debug(`matched events: ${matched.length}`)
      if (matched.length >= USER_QUORUM) {
        // sort the matched pairs into a high to low array
        // 1. use block height
        // 2. use difficulty
        debug(`${matched.length} matched events pass USER_QUORUM threshold hold ${USER_QUORUM}`)
        const matchedSorted = matched.sort((a, b) => {
          // TODO: Setup--validate both blocks (not txs)
          // Blocks are the same A === B
          if (a.block.getHash() === b.block.getHash()) {
            // if a was faster than b push ok
            if (a.elapsed < b.elapsed) {
              return 1
            }
            if (a.elapsed > b.elapsed) {
              return -1
            }
            return 0
          }
          // Block are not the same A !== B
          if (new BN(a.block.getTotalDistance()).gte(new BN(b.block.getTotalDistance()))) {
            if (new BN(a.block.getHeight()).gte(new BN(b.block.getHeight()))) {
              // if a is faster at providing headers opt for a
              if (a.elapsed < b.elapsed) {
                return 1
              }
              // if the start time is earlier the peer connected earlier to the local node
              if (new BN(a.startTime).lt(new BN(b.startTime))) {
                return 1
              }
              return 0
            }
            return -1
          // second option has greater total distance than the first
          } else {
            if (new BN(a.block.getHeight()).gt(new BN(b.block.getHeight()))) {
              if (a.elapsed < b.elapsed) {
                return -1
              }
              // if a has a greater block height push it forward
              return 1
            }
            // if second option is also higher block height put forward
            return -1
          }
        })
        debug(`number of matches sorted: ${matchedSorted.length}`)
        // asign initial sync peer
        const initialSyncPeerRaw = matchedSorted[0] // Not a protobuf
        const initialPeer = new InitialPeer()
        initialPeer.setExpires(Number(new Date()) + PEER_HEADER_SYNC_EXPIRE)
        debug(`assigning initial peer address as ${initialSyncPeerRaw.address}`)
        initialPeer.setAddress(initialSyncPeerRaw.address)
        await this._engine.persistence.put('bc.sync.initialpeer', initialPeer)
        const latestBlock = await this._engine.persistence.get('bc.block.latest')
        const payload = encodeTypeAndData(MESSAGES.HEADER, latestBlock)
        // locate the connection
        const conn = find(
          ({ remoteAddress, remotePort }) => `${remoteAddress}:${remotePort}` === initialPeer.getAddress(),
          this._discovery.connections
        )
        if (conn) {
          const result = await this.qsend(conn, payload)
          if (result.success) {
            this._logger.info('successful update sent to peer')
          } else {
            this._logger.warn('failed to send peer query')
          }
        } else {
          this._logger.error('failed to assign connection')
        }
      } else {
        this._logger.warn(`peer evaluation requested while below given quorum ${USER_QUORUM}`)
        return Promise.resolve(true)
      }
    } catch (err) {
      this._logger.error(err)
      return Promise.reject(new Error(err))
    }
  }

  /* sendPeerEvaluations
   * tests each peer with the highest latest block
   */
  async sendPeerEvaluations (): Promise<boolean> {
    // get the local highest block
    debug('sendPeerEvaluations(): running')
    const latestBlock = await this._engine.persistence.get('bc.block.latest')
    if (!latestBlock) {
      this._logger.error('latest block does not exist unable to join peering network')
      return false
    }
    const payload = encodeTypeAndData(MESSAGES.GET_BLOCK, [])
    if (this._discovery !== undefined && this._discovery.connections.length > 0) {
      debug(`IPH evaluations queued for ${this._discovery.connections.length} connection(s)`)
      try {
        for (const remoteConnection of this._discovery.connections) {
          const address = `${remoteConnection.remoteAddress}:${remoteConnection.remotePort}`
          debug(`sending eval to address ${address}, local latest block height ${latestBlock.getHeight()}`)
          await this._engine.persistence.updateList('bc.sync.initialpeerevents', { address: address, timestamp: Number(new Date()), type: 'initialpeerheaderStart' })
          await this.qsend(remoteConnection, payload)
        }
        return true
      } catch (err) {
        this._logger.error(err)
        return false
      }
    } else {
      throw new Error('unable to initialize header sync without peers')
    }
  }

  /*  checkInitialPeerHeaderStatus
   *  Determines if the performance testing blocks should be sent to peers
   */
  async checkInitialPeerHeaderStatus (iph: string|null = null): Promise<boolean|Error> {
    // get the iph state
    // !!! this should not be run unless quorum has been achieved !!!
    // 'pending' = iph evaluation evaluations are waiting for first candidate
    // 'complete' = iph evaluation process has been completed
    // 'error' = iph evaluation process has started
    if (iph === null) {
      iph = await this._engine.persistence.get('bc.sync.initialpeerheader')
      // if it still is undefined fail the request
      if (!iph) {
        throw new Error('unable to determine status of initial peer evaluation')
      }
    }
    debug(`current initialpeerheader state: ${iph}`)
    // create list
    if (iph === null || iph === undefined) {
      return false
    } else if (iph === 'pending') {
      // switch rom pending to running and emit block challenges to peers
      await this._engine.persistence.put('bc.sync.initialpeerheader', 'running')
      // send the initial block calls to available peers in quorum
      const evaluationsSent = await this.sendPeerEvaluations()
      if (evaluationsSent !== true) {
        debug('initial peer evaluations canceled')
        return false
      }
      return true
    } else if (iph === 'running') {
      this._logger.info('yielding peer evaluation')
      return false
    } else if (iph === 'error') {
      this._logger.error('critical error in initial block sync. Check log files.')
      return false
    }
    return true
  }
  // async checkFailedSync () {
  // const latestBlock = await this._engine.persistence.get('bc.block.latest')

  // }
  async start (nodeId: string) {
    const discovery = new Discovery(nodeId)
    this._discovery = discovery.start()
    // set the sync state to pending, the initial peer number to 0,
    await this._engine.persistence.put('bc.sync.initialpeerheader', 'pending') // set the iph status
    await this._engine.persistence.put('bc.sync.initialpeerdata', 'pending') // set the ipd status
    await this._engine.persistence.put('bc.sync.initialpeernum', 0) // reset the counter for peers
    await this._engine.persistence.put('bc.sync.initialpeerevents', []) // empty the reports for block timing
    await this._engine.persistence.del('bc.sync.initialpeer') // erase the peer
    this._discovery.join(this._discovery.hash, this._discovery.port, (data) => {
      this._engine._emitter.on('sendblockcontext', (msg) => {
        if (msg.data.constructor === Array.constructor) return
        const payload = encodeTypeAndData(MESSAGES.BLOCK, msg.data)
        return this.qsend(msg.connection, payload)
      })
      this._engine._emitter.on('sendblock', (msg) => {
        let type = MESSAGES.BLOCK
        if (msg.type !== undefined) {
          type = msg.type
        }
        const payload = encodeTypeAndData(type, msg.data)
        this.qsend(msg.connection, payload)
          .then(() => {
            this._logger.info('block sent!')
          })
          .catch((err) => {
            this._logger.warn('critical block rewards feature is failing with this error')
            this._logger.error(err)
          })
      })
      this._engine._emitter.on('announceblock', (msg: { data: BcBlock, filters: string[]|Array<{remoteAddr: string, remotePort: string}> }) => {
        this._logger.info('announceblock <- event')
        // this._engine.persistence.get('bc.block.' + msg.data.getHeight() - 1
        // this.getLiteMultiverse(msg.data).then((list) => {
        const payload = encodeTypeAndData(MESSAGES.BLOCK, msg.data)
        const tasks = this._discovery.connections.map((conn) => {
          const addr = conn.remoteAddress + ':' + conn.remotePort
          if (msg.data.getHash !== undefined) {
            if (this._noDoubleSent.get(addr + msg.data.getHash())) {
              debug(`peer ${addr} has already sent block ${msg.data.getHash()}`)
              return
            }
          }
          return this.qsend(conn, payload)
        })
        return Promise.all(tasks).then(() => {
          this._logger.info('block announced!')
        })
          .catch((err) => {
            this._logger.warn('connection failure when announcing to network')
            this._logger.error(err)
          })
      })
      // event fired in engine when a new TX is accepted via RPC or as resend of such received pending TX
      this._engine._emitter.on('announceTx', (msg: { data: Transaction, conn?: Object }) => {
        const payload = encodeTypeAndData(MESSAGES.TX, msg.data)
        const tasks = this._discovery.connections.map((conn) => { // TODO should filter out myself
          if (msg.conn && conn.remoteAddress === msg.conn.remoteAddress && conn.remotePort === msg.conn.remotePort) {
            return
          }
          return this.qsend(conn, payload)
        })
        return Promise.all(tasks).then(() => {
          this._logger.info('Transactions announced!')
        })
          .catch((err) => {
            this._logger.warn('connection failure when announcing to network')
            this._logger.error(err)
          })
      })
      this._logger.info('initialize far reaching discovery module')

      /* Start multiverse sync */
      this._discovery.on('connection', async (conn, info) => {
        // pass connection to connection pool
        // create peer sync group <- sort peers by best block
        // sync backwards from top to bottom if a peer fails switch
        // begin syncing after pool size
        const needsResyncData = await this._engine.persistence.getDecisivePeriodOfCrossChainBlocksStatus()
        let roverSyncComplete = Object.values(needsResyncData).every(i => !i)
        roverSyncComplete = true

        // greeting reponse to connection with provided host information and connection ID
        const address = conn.remoteAddress + ':' + conn.remotePort
        const iph = await this._engine._persistence.get('bc.sync.initialpeerheader')
        // if the initial peer num has not been set we need to set it
        // this could have happened if the local node crashed on startup
        if (iph === null) {
          await this._engine.persistence.put('bc.sync.initialpeerdata', 'pending')
          await this._engine.persistence.put('bc.sync.initialpeerheader', 'pending')
          await this._engine.persistence.put('bc.sync.initialpeernum', 0)
          await this._engine.persistence.put('bc.sync.initialpeerevents', [])
        }
        // get heighest block
        const quorumState = await this._engine.persistence.get('bc.dht.quorum')
        let quorum = parseInt(quorumState, 10) // coerce for Flow
        if (this._discovery.connected < USER_QUORUM && quorum === 1 && MIN_HEALTH_NET === false) {
          // await this.persistence.put('bc.sync.initialpeerheader', 'pending') // peer min has fell below threshold reset flag
          // await this.persistence.put('bc.sync.initialpeernum', 0) // peer min has fell below threshold reset counter
          // await this.persistence.put('bc.sync.initialpeerevets', []) // peer min has fell below threshold reset counter
          quorum = 0
          await this._engine.persistence.put('bc.dht.quorum', 0)
        } else if (this._discovery.connected >= USER_QUORUM && quorum === 0) {
          quorum = 1
          await this._engine.persistence.put('bc.dht.quorum', 1)
        } else if (quorum === 0 && MIN_HEALTH_NET === true) {
          quorum = 1
          await this._engine.persistence.put('bc.dht.quorum', 1)
        }
        debug(`received connection from ${address}`, info)
        debug(`-- peer metrics --\n  roverSyncComplete: ${roverSyncComplete}\n  iph: ${iph}\n  quorum: ${quorum}`)
        /// if IPH is complete add the peer's connection and pipe the data into peerDataHandler otherwise ignore it
        if (iph === 'complete' && roverSyncComplete && quorum === 1) {
          debug('iph: complete, roverSyncCompelte: true, quorum: 1, -> send latest block')
          const latestBlock = await this._engine.persistence.get('bc.block.latest')
          if (!latestBlock) {
            this._logger.error(`latest block does not exist unable to join peering network at: ${address}`)
            return
          }
          const payload = encodeTypeAndData(MESSAGES.BLOCK, latestBlock)
          try {
            // TODO send Handshake first
            await this.qsend(conn, payload)
          } catch (err) {
            this._logger.debug(err)
          }
        // if rovers have completed a sync begin evaluating peers
        } else if (iph !== 'complete' && DISABLE_IPH_TEST === false && roverSyncComplete && quorum === 1) {
          debug('roverSyncComplete: true + quorum = 1, -> checkInitialPeerHeaderStatus')
          try {
            const iphStatus = await this.checkInitialPeerHeaderStatus(iph)
            if (iphStatus !== true) {
              debug(`warning initial Peer Evaluation Status = ${String(iphStatus)}`)
            }
          } catch (err) {
            debug('critical error get initialpeerheaderStatus')
            this._logger.error(err)
            return
          }
        // if either rover sync is not complete or quorum has not been achieved
        } else {
          if (!roverSyncComplete) {
            if (quorum === 0) {
              this._logger.info('peer added to connection pool -> waiting for rovers "all clear" and quorum to be reached')
            } else {
              this._logger.info('peer added to connection pool -> waiting for rovers "all clear"')
            }
          } else {
            // rovers sync is true so quorum = 0
            this._logger.info('peer added to connection pool -> waiting for quorum to be achieved')
          }
        }
        // always pipe the connection stream into the framer
        // if (isDebugEnabled()) {
        //  conn.pipe(inspectStream((chunk) => debug(`received len: ${chunk.length}, beg: `, chunk)))
        // }
        conn.pipe(framer.decode(FRAMING_OPTS)).on('data', (data) => {
          debug('piped data handler', data.slice(0, 7).toString('ascii'), data.length)
          this.peerDataHandler(conn, info, data)
        })
      })

      this._engine._emitter.on('getmultiverse', (obj) => {
        const { data: { low, high } } = obj
        const payload = encodeTypeAndData(MESSAGES.GET_MULTIVERSE, [low, high])
        this.qsend(obj.connection, payload)
          .then((res) => {
            if (res.success && res.allSent) {
              this._logger.info(`${payload.length} delivered in getmultiverse msg`)
            }
          })
          .catch((err) => {
            this._logger.error('critical write to peer socket failed')
            this._logger.error(err)
          })
      })

      // local <---- peer sent multiverse
      this._engine._emitter.on('putmultiverse', (msg) => {
        this._engine.getMultiverseHandler(msg.connection, msg.data)
          .then((res) => {
            this._logger.info(res)
          })
          .catch((err) => {
            this._logger.error(err)
          })
      })

      // local ----> get block list from peer
      this._engine._emitter.on('getblocklist', (request) => {
        const { low, high } = request.data
        const payload = encodeTypeAndData(MESSAGES.GET_BLOCKS, [low, high])
        this.qsend(request.connection, payload)
      })

      // local <---- peer sent blocks
      this._engine._emitter.on('putblocklist', (msg) => {
        this._engine.stepSyncHandler(msg)
          .then(() => {
            this._logger.debug('stepSync complete sent')
          })
          .catch((err) => {
            this._logger.error(err)
          })
      })

      // local <---- peer sent block
      this._engine._emitter.on('putblock', (msg) => {
        this._logger.debug('candidate block ' + msg.data.getHeight() + ' received')
        let options = { fullBlock: false, sendOnFail: false }
        if (msg.options) { options = merge(options, msg.options) }
        debug('event->putblock tracing ipd and iph')
        debug(msg.options)
        this._engine.blockFromPeer(msg.connection, msg.data, options)
      })

      // local <---- peer sent tx
      this._engine._emitter.on('puttx', (msg) => {
        const { connection, data } = msg
        this._logger.debug('Received new TX from peer')
        this._engine.txFromPeer(connection, data)
      })

      // local <---- peer sent full block
      this._engine._emitter.on('putfullblock', (msg) => {
        const { connection, data } = msg
        let options = { fullBlock: true, sendOnFail: false }
        if (msg.options) { options = merge(options, msg.options) }
        this._logger.debug('Received full block with TXs from peer')
        debug('event->putblock tracing ipd and iph')
        debug(msg.options)
        data.map(block => this._engine.blockFromPeer(connection, block, options))
      })

      // local ----> get txs list from peer
      this._engine._emitter.on('getTxs', (request) => {
        const { dimension, id } = request
        const payload = encodeTypeAndData(MESSAGES.GET_TXS, [dimension, id])
        this._logger.debug(`Requesting full block(s) (${dimension}: ${id}) from peer`)
        this.qsend(request.connection, payload)
      })

      // local ----> get header list from peer
      this._engine._emitter.on('getheaders', (request) => {
        const { low, high } = request.data
        const payload = encodeTypeAndData(MESSAGES.GET_HEADERS, [low, high])
        this.qsend(request.connection, payload)
      })
      // local ----> get header list from peer
      this._engine._emitter.on('getdata', (request) => {
        const [ low, high ] = request.data
        const payload = encodeTypeAndData(MESSAGES.GET_DATA, [low, high])
        this.qsend(request.connection, payload)
      })

      /*
         * PEER SEEDER
         */
      this._discovery._seeder = discovery.seeder()
      this._discovery._seeder.on('peer', (peer) => {
        if (this._discovery.connected > BC_MAX_CONNECTIONS) {
          this._logger.info('passed on peer handle <- ' + this._discovery.connected + ' connections')
          return
        }

        const channel = this._discovery.hash
        const url = Url.parse(peer)
        const h = url.href.split(':')
        const obj: {
          id?: string,
          host: string,
          port: number,
          retries: number,
          channel: Buffer,
          remoteHost?: string,
          remotePort?: number
        } = {
          // id: crypto.createHash('sha1').update(peer).digest('hex'),
          host: h[0],
          port: Number(h[1]) + 1, // seeder broadcasts listen on one port below the peers address
          retries: 0,
          channel: Buffer.from(channel)
        }
        obj.id = obj.host + ':' + obj.port
        obj.remotePort = obj.port
        obj.remoteHost = obj.host

        try {
          const name = obj.host + ':' + obj.port + this._discovery.hash
          this._discovery._discovery.emit('peer', name, obj, 'utp')
        } catch (err) {
          this._logger.warn(`Error while constructing peer from discovered peer: ${inspect(peer)}`)
        }
      })

      this._discovery._seeder.start()
      this._engine._discovery = this._discovery
      this._logger.info('joined waypoint table')
    })
    return Promise.resolve(true)
  }

  peerDataHandler (conn: Object, info: Object, str: Buffer) {
    (async () => {
      debug(`peerDataHandler() dsize: ${str.length} bufstart: ${str.slice(0, 7).toString('ascii')}`)
      if (!str) {
        debug(`peerDataHandler(): function called without payload`)
        return
      }
      if (str.length < 7) {
        debug(`peerDataHandler(): payload smaller than expected size ${str.length} < 7`)
        return
      }
      if (str.length > _MAX_FRAME_SIZE) {
        debug(`peerDataHandler(): payload larger than max frame size ${str.length} > ${_MAX_FRAME_SIZE}`)
        return
      }

      debug(`received data start parse`)
      // TODO: add lz4 compression for things larger than 1000 characters
      const type: $Values<typeof MESSAGES> = str.slice(0, 7).toString('ascii')
      if (!contains(type, values(MESSAGES))) {
        debug(`unknown type received from peer`)
        return
      }

      // if (type !== MESSAGES.BLOCK && BC_BT_VALIDATION !== true) {
      //  return
      // }

      let currentPeer = false
      const iph = await this._engine.persistence.get('bc.sync.initialpeerheader')
      // if the iph status is running and the message type is not a block or an announced tx ignore the message
      if (DISABLE_IPH_TEST === false) {
        if (iph === 'running' &&
            // type !== MESSAGES.GET_BLOCK &&
            // type !== MESSAGES.GET_HEADERS &&
            // type !== MESSAGES.GET_HEADER &&
            // type !== MESSAGES.TX &&
            // type !== MESSAGES.TXS &&
            // type !== MESSAGES.DATA &&
            type !== MESSAGES.BLOCK &&
            // type !== MESSAGES.BLOCKS &&
            type !== MESSAGES.HEADER &&
            type !== MESSAGES.HEADERS) {
          debug(`ignoring type: ${type} message from peer`)
          // check if current peer has expired
          return
        }
      }
      // check if the submission of the current peer was late
      if (iph === 'running' && DISABLE_IPH_TEST === false) {
        const ipd = await this._engine.persistence.get('bc.sync.initialpeerdata')
        currentPeer = await this._engine.persistence.get('bc.sync.initialpeer')
        // end the transaction if any of these events are true
        // if no object represents current peer the node has not fully started up or has crashed during startup
        // if expires is not defined the peer challenge was stored corruptly
        // if the initial peer data variable is not pending then a new peer evaluation should not be run in parallel
        if (ipd !== null && ipd !== 'pending') {
          if (!currentPeer) {
            // FIXME iph === 'running' implies ipd !== 'pending' <-- @Adam this is to prevent race condition event loop evaluates 2
            debug(`current ipd: ${ipd}`)
            this._logger.warn('prevented initial peer headers from performing concurrent requests')
            return
          }
        // reprocess peer evaluations if the peer response below minimum
        } else if (currentPeer !== null && Number(currentPeer.getExpires()) < Number(new Date())) {
          this._logger.info('peer headers above timestamp threshold')
          await this.processPeerEvaluations()
          return
        }
      }
      // Peer Sent Highest Block
      if (type === MESSAGES.BLOCK) {
        const ipd = await this._engine.persistence.get('bc.sync.initialpeerdata')
        const address = conn.remoteAddress + ':' + conn.remotePort
        debug(`peer BLOCK message received from address: ${address}`)
        // determine if we are evaluating peer performance, if true do not put block and increment peer timer
        const parts = bufferSplit(str, Buffer.from(MSG_SEPARATOR[type]))
        const rawBlock = parts[1]
        const block = BcBlock.deserializeBinary(rawBlock)
        if (this._noDoubleSent.get(address + block.getHash())) {
          this._noDoubleSent.set(address + block.getHash(), 1)
        }
        if (iph === 'running' && ipd === 'pending') {
          const inc = await this._engine.persistence.inc('bc.sync.initialpeernum')
          const updateData = {
            address: address,
            timestamp: Number(new Date()),
            type: 'initialpeerheaderEnd',
            block: block
          }
          await this._engine.persistence.updateList('bc.sync.initialpeerevents', updateData)
          // if the increment is above quorum check results
          debug(`evaluating increment for block speed ${inc} with USER_QUORUM ${USER_QUORUM}`)
          if (inc >= USER_QUORUM) {
            debug('connection pool is above quorum and ready to initiate peer evaluations -> setting iph to complete')
            await this._engine.persistence.put('bc.sync.initialpeerheader', 'complete')
            const peersEvaluated = await this.processPeerEvaluations()
            if (peersEvaluated === true) {
              debug(`peers have been evaluated`)
            }
          }
        } else {
          debug('iph is not running -> emit BC putBlock')
          this._engine._emitter.emit('putblock', {
            data: block,
            connection: conn,
            options: {
              iph: iph,
              ipd: ipd
            }
          })
        }

      // Peer Requests Highest Block
      } else if (type === MESSAGES.GET_BLOCK) {
        const address = conn.remoteAddress + ':' + conn.remotePort
        debug(`received GET_BLOCK request from peer ${address}`)
        const latestBlock = await this._engine.persistence.get('bc.block.latest')
        const payload = encodeTypeAndData(MESSAGES.BLOCK, latestBlock)
        const result = await this.qsend(conn, payload)
        if (result.success) {
          this._logger.info('successful update sent to peer')
        } else {
          this._logger.warn(result)
        }
      // Peer Requests Block Range
      } else if (type === MESSAGES.GET_BLOCKS || type === MESSAGES.GET_MULTIVERSE) {
        const address = conn.remoteAddress + ':' + conn.remotePort
        debug(`received GET_BLOCKS request from peer ${address}`)
        const parts = bufferSplit(str, Buffer.from(MSG_SEPARATOR[type]))
        const low = parseInt(parts[1])
        const high = parseInt(parts[2])
        let outboundType = MESSAGES.BLOCKS
        if (type === MESSAGES.GET_MULTIVERSE) {
          outboundType = MESSAGES.MULTIVERSE
        }
        this._logger.info(`getblocklist handler: ${outboundType}, ${max(2, low)}, ${(high + 1)}`)
        try {
          const query = range(max(2, low), (high + 1)).map((n) => {
            return 'bc.block.' + n
          })
          this._logger.info(query.length + ' blocks requested by peer: ' + conn.remoteAddress)
          this._queue.push({ keys: query }, (err, blocks) => {
            if (err) {
              this._logger.warn(err)
            } else {
              const payload = encodeTypeAndData(outboundType, blocks)
              this.qsend(conn, payload).then((res) => {
                if (res.success && res.allSent) {
                  this._logger.info('sent message of length: ' + payload.length)
                }
              })
                .catch((err) => {
                  this._logger.error(err)
                })
            }
          })
        } catch (err) {
          this._logger.error(err)
        }
      // Peer Sends Challenge Block
      } else if (type === '0011W01') { // TODO is this used / sent anywhere? if so add MESSAGES key
        const parts = bufferSplit(str, Buffer.from(MSG_SEPARATOR[type]))
        const rawBlock = parts[1]
        const block = BcBlock.deserializeBinary(rawBlock)
        this._engine._emitter.emit('putblock', {
          data: block,
          connection: conn
        })
      } else if (type === '0012W01') { // TODO is this used / sent anywhere? if so add MESSAGES key
        const parts = bufferSplit(str, Buffer.from(MSG_SEPARATOR[type]))
        const rawBlock = parts[1]
        const block = BcBlock.deserializeBinary(rawBlock)
        const ipd = await this._engine.persistence.get('bc.sync.initialpeerdata')
        this._engine._emitter.emit('putblock', {
          data: block,
          options: {
            sendOnFail: false,
            ipd: ipd,
            iph: iph
          },
          connection: conn
        })
      // Peer requests a specific header
      } else if (type === MESSAGES.GET_HEADER) {
        const address = conn.remoteAddress + ':' + conn.remotePort
        debug(`received GET_HEADER request from peer ${address}`)
        const latestBlock = await this._engine.persistence.get('bc.block.latest')
        if (!latestBlock) {
          this._logger.warn(`Could find 'bc.block.latest' while handling GET_HEADER message`)
          return Promise.resolve(false)
        }
        latestBlock.clearTxsList()
        const payload = encodeTypeAndData(MESSAGES.HEADER, latestBlock)
        const result = await this.qsend(conn, payload)
        if (result.success && result.allSent) {
          this._logger.info('successful update sent to peer')
        } else {
          this._logger.warn('header delivery confirmation not available')
        }
      // Peer sends header to be evaluated and stored
      } else if (type === MESSAGES.HEADER) {
        const address = conn.remoteAddress + ':' + conn.remotePort
        debug(`received HEADER from peer ${address}`)
        // peer sending a header
        const parts = bufferSplit(str, Buffer.from(MSG_SEPARATOR[type]))
        const rawBlock = parts[1]
        const receivedHeader = BcBlock.deserializeBinary(rawBlock)
        // TODO: set up child blockchain headers
        const latestBlock = await this._engine.persistence.get('bc.block.latest')
        if (!latestBlock) {
          this._logger.warn(`Could find 'bc.block.latest' while handling HEADER message`)
          return Promise.resolve(false)
        }
        // if latest block is higher than header send missing blocks
        if (latestBlock.getHeight() > receivedHeader.getHeight()) {
          const range = Math.abs(latestBlock.getHeight() - receivedHeader.getHeight())
          let from = parseInt(receivedHeader.getHeight(), 10)
          if (from === 1) {
            from = from + 1
          }
          // send only up to 1500 blocks (MAX_HEADER_RANGE)
          const to = min(from + MAX_HEADER_RANGE, from + range)
          debug(`from: ${from} to: ${to} range: ${range}`)
          const headers = await this._engine.persistence.getBlocksByRange(from, to, 'bc', { asBuffer: true, asHeader: true })
          debug(`sending ${headers.length} headers`)
          const payload = encodeTypeAndData(MESSAGES.HEADERS, headers)
          const result = await this.qsend(conn, payload)
          if (result.success) {
            this._logger.info('successful update sent to peer')
          } else {
            this._logger.info(result)
          }
        }
      // Peer requests a range of headers
      } else if (type === MESSAGES.GET_HEADERS) {
        const address = conn.remoteAddress + ':' + conn.remotePort
        debug(`received GET_HEADERS request from peer ${address}`)
        // message shape 'GET_HEADERS[*]<blockchain>[*]<from>[*]<to>
        const parts = bufferSplit(str, Buffer.from(MSG_SEPARATOR[type]))
        let [, blockchain, _from, _to] = parts
        let from = Number(_from)
        if (from > 2) {
          // padd from the from address with an additional block
          from = from - 1
        }
        let to = Number(_to)
        if (to <= 0) {
          const latest = await this._engine.persistence.get('bc.block.latest')
          if (!latest) {
            this._logger.warn(`Could find 'bc.block.latest' while handling GET_HEADERS message to <= 0 branch`)
            return Promise.resolve(false)
          }
          to = latest.getHeight()
        }
        const diff = to - from
        const sendable = blockchain === 'bc'
        // check if the header range requested is below limit and assert the send blockchain type is approved
        if (diff > 0 && diff < (MAX_HEADER_RANGE + 1) && STRICT_SEND_BC === sendable) {
          const headers = await this._engine.persistence.getBlocksByRange(from, to, blockchain, { asBuffer: true, asHeader: true })
          // send block headers
          const payload = encodeTypeAndData(MESSAGES.HEADERS, headers)
          const result = await this.qsend(conn, payload)
          if (result.success && result.allSent) {
            this._logger.info('successful update sent to peer')
          }
        }
        // Peer sends headers to be evaluated
      } else if (type === MESSAGES.HEADERS) {
        const address = conn.remoteAddress + ':' + conn.remotePort
        const currentPeer = await this._engine.persistence.get('bc.sync.initialpeer')
        debug(`received HEADERS from peer ${address}`)
        // message shape 'HEADERS[*]<headers>
        // if headers < 2000 || last header === current latest we know we have reached the edge of the peer's chain
        const [, ...rawHeaders] = bufferSplit(str, Buffer.from(MSG_SEPARATOR[type]))
        const unsortedHeaders = rawHeaders.map(h => BcBlock.deserializeBinary(h))
        debug(`headers received ${unsortedHeaders.length}`)
        const headers = unsortedHeaders.sort((a, b) => {
          if (a.getHeight() > b.getHeight()) {
            return 1
          }
          if (a.getHeight() < b.getHeight()) {
            return -1
          }
          return 0
        })
        debug(`headers received from peer ${headers.length}`)
        // const validSequence = validateBlockSequence(headers)
        // Validate sequence of block headers
        if (!currentPeer) {
          debug('currentPeer is not defined')
        }
        // FIX: TODO: reanable valid sequence
        // if (!validSequence) {
        //  debug('headers do not form a valid sequence')
        // }
        let passthrough = 1
        debug(`connection address ${address} current peer address: ${currentPeer.getAddress()}`)
        if (passthrough === 1 && currentPeer.getAddress() === address) {
          const ipd = await this._engine.persistence.get('bc.sync.initialpeerdata')
          const iph = await this._engine.persistence.get('bc.sync.initialpeerheader')
          const latestBlock = await this._engine.persistence.get('bc.block.latest')
          if (!latestBlock) {
            this._logger.warn(`couldnt find 'bc.block.latest' while handling HEADERS message`)
            return Promise.resolve(false)
          }

          const highestHeader = headers[headers.length - 1]
          debug(`highest peer header (${currentPeer.getAddress()}) ${highestHeader.getHeight()} vs local ${latestBlock.getHeight()}`)
          // if the received highest header block is above the latest block request a new set
          for (let i = 0; i < headers.length; i++) {
            await this._engine.persistence.put(`bc.block.${headers[i].getHeight()}`, headers[i])
          }
          if (latestBlock.getHeight() < highestHeader.getHeight() && headers.length > 1999) {
            await this._engine.persistence.put('bc.block.latest', highestHeader)
            // send back the current highest header
            debug(`current peer ${currentPeer.getAddress()} successfully submitted headers`)
            currentPeer.setExpires(Number(new Date()) + PEER_HEADER_SYNC_EXPIRE)
            await this._engine.persistence.put('bc.sync.initialpeer', currentPeer)
            await this._engine.persistence.put('bc.block.latest', highestHeader)
            // send back the current highest header
            const msg = encodeTypeAndData(MESSAGES.HEADER, highestHeader)
            debug(`current peer ${currentPeer.getAddress()} successfully submitted headers`)
            currentPeer.setExpires(Number(new Date()) + PEER_HEADER_SYNC_EXPIRE)
            await this._engine.persistence.put('bc.sync.initialpeer', currentPeer)
            await this.qsend(conn, msg)
          /*
           * Peer has recieved all headers
           *   - IPH test is considered complete
           *   - Now going to reset full body TXs
           *   - Could go to any peer, asking for hash range that match the hash range it has on disk
           */
          } else if (ipd === 'pending' && iph !== 'complete') {
            // if the header height is equal or greater then the header sync is complete
            // set the current peer sync to the new data boundary
            await this._engine.persistence.put('bc.block.latest', highestHeader)
            debug(`current peer ${currentPeer.getAddress()} successfully completed header sync -> beginning tx ipd test`)
            await this._engine.persistence.put('bc.sync.initialpeerdata', 'running')
            currentPeer.setExpires(Number(new Date()) + PEER_DATA_SYNC_EXPIRE)
            await this._engine.persistence.put('bc.sync.initialpeer', currentPeer)
            // update the ipd status to running
            await this._engine.persistence.put('bc.sync.initialpeerheader', 'complete')
            // update the ipd status to running
            await this._engine.persistence.put('bc.sync.initialpeernum', 0)
            // reprocess peer evaluations with peer data sync equal to 'running'
            debug('IPH test complete requesting peer evaluations for beginning of IPD tests')
            let latestHeightRaw = await this._engine.persistence.get('bc.data.latest')
            if (latestHeightRaw === null) {
              await this._engine.persistence.put('bc.data.latest', 2)
              latestHeightRaw = 2
            }
            const latestHeight = parseInt(latestHeightRaw, 10)
            const latestBlock = await this._engine.persistence.get('bc.block.latest')
            if (!latestBlock) {
              this._logger.warn(`Couldn't get 'bc.block.latest' in processPeerEvaluations`)
              return
            }
            const from = latestHeight
            const to = min(latestHeight + 500, parseInt(latestBlock.getHeight(), 10))
            debug(`ipd: ${ipd} with latest height from: ${from} to: ${to}`)
            const fromBlock = await this._engine.persistence.get(`bc.block.${from}`)
            const toBlock = await this._engine.persistence.get(`bc.block.${to}`)
            debug(`fromBlock: ${fromBlock.getHeight()}`)
            debug(`toBlock: ${toBlock.getHeight()}`)
            const msg = [fromBlock.getHeight(), toBlock.getHeight()]
            const payload = encodeTypeAndData(MESSAGES.GET_DATA, msg)
            const result = await this.qsend(conn, payload)
            debug('sent GET_DATA request to connection')
            debug(result)
            if (result.success) {
              this._logger.info('successful data sent to peer')
            } else {
              this._logger.info(result)
            }
          }
        }
        // const parts = bufferSplit(str, Buffer.from(MSG_SEPARATOR[type]))
        // const rawHeaders = parts[1]
        // const headers = rawHeaders.map(b => BcBlock.deserializeBinary(b))
        // this._engine._emitter.emit('putheaders', {
        //   data: headers,
        //   connection: conn
        // })
        // Peer requested a list of one or more data for tx hashes
      } else if (type === MESSAGES.GET_DATA) {
        const address = conn.remoteAddress + ':' + conn.remotePort
        debug(`M.GET_DATA received GET_DATA request from peer ${address}`)
        const parts = bufferSplit(str, Buffer.from(MSG_SEPARATOR[type]))
        const [, ...rawHeights] = parts
        const low = rawHeights[0]
        const high = rawHeights[1]
        const lowHashBlock = await this._engine.persistence.get('bc.block.' + low)
        const highHashBlock = await this._engine.persistence.get('bc.block.' + high)
        debug(`low: ${low}, high: ${high}`)
        if (!lowHashBlock) {
          debug(`M.GET_DATA unable to find lowHashBlock`)
        }
        if (!highHashBlock) {
          debug(`M.GET_DATA unable to find highHashBlock`)
        }
        if (!lowHashBlock || !highHashBlock) {
          debug(`M.GET_DATA unable to find blocks matching those hashes`)
          if (!lowHashBlock) {
            this._logger.error(`low hash for block height not found: ${low}`)
          }
          if (!highHashBlock) {
            this._logger.error(`high hash for block height not found: ${high}`)
          }
          return Promise.resolve(false)
        }
        const from = min(2, parseInt(lowHashBlock.getHeight(), 10))
        const to = min(parseInt(lowHashBlock.getHeight(), 10) + MAX_DATA_RANGE, parseInt(highHashBlock.getHeight(), 10))
        debug(`M.GET_DATA: getting tx data from range from: ${from} -> ${to}`)
        const blockList = await this._engine.persistence.getBlocksByRange(from, to, 'bc', { asBuffer: true })
        if (!blockList || !Array.isArray(blockList)) {
          this._logger.warn(`could not getBlocksByRange(${from}, ${to}) while handling GET_DATA message`)
          return Promise.resolve(false)
        }
        /*
           * Format outbound data to only the hash and referenced txs
           *   [[
           *     hash of block,
           *     transaction[],
           *     markedTransaction[]
           *   ]...]
           */
        // const txDataOnly = blockList.reduce((list, t) => {
        //  list.push(t.getHash())
        //  list.push(t.getTxsList())
        //  return list
        // }, [])
        const payload = encodeTypeAndData(MESSAGES.DATA, blockList)
        const result = await this.qsend(conn, payload)
        if (result.success === true) {
          this._logger.info('successful update sent to peer')
        }
      } else if (type === MESSAGES.DATA) {
        const address = conn.remoteAddress + ':' + conn.remotePort
        debug(`received DATA from peer ${address}`)
        // TODO: blacklist functionality should go here to prevent peers from requesting large bandwidth multiple times
        const parts = bufferSplit(str, Buffer.from(MSG_SEPARATOR[type]))
        const [, ...blocks] = parts
        const latestBlock = await this._engine.persistence.get('bc.block.latest')
        const ipd = await this._engine.persistence.get('bc.sync.initialpeerdata')
        currentPeer = await this._engine.persistence.get('bc.sync.initialpeer')
        if (ipd !== 'running') {
          this._logger.warn(`peer transmitted data running !== ${String(ipd)}`)
          return
        }
        if (!currentPeer) {
          this._logger.warn(`cannot fetch currentPeer while handling DATA message`)
          return false
          // confirm peer is approved to be delivering data
        } else if (currentPeer !== null && address !== currentPeer.getAddress()) {
          this._logger.warn(`unapproved peer ${address} attempted data delivery`)
          return
        }
        if (!latestBlock) {
          this._logger.warn(`cannot find 'bc.block.latest' while handling DATA message`)
          return false
        }
        let syncComplete = false
        let validDataUpdate = true
        let currentHeight = 2

        for (let i = 0; i < blocks.length; i++) {
          const newBlock = BcBlock.deserializeBinary(blocks[i])
          const blockHeight = newBlock.getHeight()
          // if the block is not defined or corrupt reject the transmission
          debug(`loading newBlock: ${blockHeight}`)
          const block = await this._engine.persistence.get(`bc.block.${blockHeight}`)
          if (block === null || newBlock.getHash() !== block.getHash()) {
            // check if the peer simply sent more blocks
            if (newBlock.getHeight() < latestBlock.getHeight()) {
              debug(`newBlock ${newBlock.getHeight()} does not exist latestBlock ${latestBlock.getHeight()}`)
              validDataUpdate = false
              continue
            }
          }
          // FIX: add block valid test
          if (validDataUpdate === true) {
            await this._engine.persistence.putBlock(newBlock, 0)
            if (newBlock.getHash() === latestBlock.getHash() || newBlock.getHeight() > latestBlock.getHeight()) {
              debug(`the sync is considered complete`)
              syncComplete = true
            }
            // if valid set the new height
            if (currentHeight < newBlock.getHeight()) {
              currentHeight = parseInt(newBlock.getHeight(), 10)
            }
          }
        }

        // if peer sends invalid data it is rejected and removed from the peer data
        if (validDataUpdate === false) {
          // reset the best block to the lowest
          debug('validDataUpdate === false setting bc.data.latest = 2')
          await this._engine.persistence.put('bc.data.latest', 2)
          // process peer evaluations seeking better candidate
          debug('valid datate update is false requesting peer evaluations')
          await this.processPeerEvaluations()
          return
        } else if (syncComplete === false) {
          // update the request to the latest height
          debug(`sync is not complete, highest height is ${currentHeight}`)
          await this._engine.persistence.put('bc.data.latest', currentHeight)
          // TODO: request more blocks from the highest
          // get the current best block with data
          const highestBlock = await this._engine.persistence.getBlockByHeight(currentHeight, 'bc', { asBuffer: true, asHeader: true })
          // get the current best block hash + MAX_DATA_RANGE
          const nextHeight = min(currentHeight + MAX_DATA_RANGE, currentHeight + parseInt(latestBlock.getHeight(), 10))
          const nextHighestBlock = await this._engine.persistence.getBlockByHeight(nextHeight)
          debug(`highestBlock: ${highestBlock.getHeight()} nextHighestBlock: ${nextHighestBlock}`)
          const data = [ highestBlock.getHeight(), nextHighestBlock.getHeight() ]
          const payload = encodeTypeAndData(MESSAGES.GET_DATA, data)
          const sent = await this.qsend(conn, payload)
          if (sent !== undefined) {
            debug(`GET_DATA sent: ${sent}`)
          }
          // FIX: here we should likely keep requesting blocks
        } else if (syncComplete === true) {
          // TODO: Node can start mining now
          // START MINER HERE
          debug('if rovers are done syncing the miner can now be initiated')
          await this._engine.persistence.put('bc.sync.initialpeerheader', 'complete')
          await this._engine.persistence.put('bc.sync.initialpeerdata', 'complete')
        } else {
          // TODO: request more blocks from the highest
          // get the current best block with data
          const highestBlock = await this._engine.persistence.getBlockByHeight(currentHeight, 'bc', { asBuffer: true, asHeader: true })
          // get the current best block hash + MAX_DATA_RANGE
          const nextHeight = min(currentHeight + MAX_DATA_RANGE, currentHeight + parseInt(latestBlock.getHeight(), 10))
          const nextHighestBlock = await this._engine.persistence.getBlockByHeight(nextHeight)
          debug(`highestBlock: ${highestBlock.getHeight()} nextHighestBlock: ${nextHighestBlock}`)

          const data = [ highestBlock.getHeight(), nextHighestBlock.getHeight() ]
          const payload = encodeTypeAndData(MESSAGES.GET_DATA, data)
          const sent = await this.qsend(conn, payload)
          if (sent !== undefined) {
            debug(`GET_DATA sent: ${sent}`)
          }
        }
        // Peer Sends Block List 0007 // Peer Sends Multiverse 001
      } else if (type === MESSAGES.BLOCKS || type === MESSAGES.MULTIVERSE) {
        const ipd = await this._engine.persistence.get('bc.sync.initialpeerdata')
        const address = conn.remoteAddress + ':' + conn.remotePort
        debug(`received BLOCKS|MULTIVERSE data from peer ${address}`)
        const parts = bufferSplit(str, Buffer.from(MSG_SEPARATOR[type]))
        try {
          parts.shift() // dicard type from the array
          const list = parts.map(rawBlock => BcBlock.deserializeBinary(rawBlock))
          const sorted = list.sort((a, b) => {
            if (a.getHeight() > b.getHeight()) {
              return -1 // move block forward
            }
            if (a.getHeight() < b.getHeight()) {
              return 1 // move block forward
            }
            return 0
          })

          if (type === MESSAGES.BLOCKS && iph === 'complete' && ipd === 'complete') {
            this._engine._emitter.emit('putblocklist', {
              data: {
                low: sorted[sorted.length - 1], // lowest block
                high: sorted[0] // highest block
              },
              connection: conn
            })
          } else if (type === MESSAGES.MULTIVERSE && iph === 'complete' && ipd === 'complete') {
            this._engine._emitter.emit('putmultiverse', {
              data: sorted,
              connection: conn
            })
          }
        } catch (err) {
          this._logger.debug('unable to parse: ' + type + ' from peer ')
        }
      } else if (type === MESSAGES.TX) {
        this._logger.debug('Peer announced new TX')
        const parts = bufferSplit(str, Buffer.from(MSG_SEPARATOR[type]))
        const rawBlock = parts[1]
        const tx = Transaction.deserializeBinary(rawBlock)
        this._engine._emitter.emit('puttx', {
          data: tx,
          connection: conn
        })
      } else if (type === MESSAGES.GET_TXS) {
        this._logger.debug('Peer requested TXs')
        // message shape 'GET_TXS[*]<dimension>[*]<id>
        const parts = bufferSplit(str, Buffer.from(MSG_SEPARATOR[type]))
        const [, rawDimension, rawId] = parts
        const dimension = JSON.parse(rawDimension)
        const id = JSON.parse(rawId)
        let blocks
        switch (dimension) {
          case 'hash':
            // get full block with txs by blockHash
            blocks = await this._engine.persistence.getBlockByHash(id, 'bc')
            break

          case 'height':
            // get full block with txs by height
            blocks = await this._engine.persistence.getBlocksByHeight(id, 'bc')
            break

          default:
            this._logger.debug(`Invalid dimension for GET_TXS: ${dimension}`)
            return Promise.resolve(true)
        }
        // send block with TXs
        const payload = encodeTypeAndData(MESSAGES.TXS, blocks)
        const result = await this.qsend(conn, payload)

        if (result.success && result.allSent) {
          this._logger.info('successful update sent to peer')
        }
      } else if (type === MESSAGES.TXS) {
        // FIX: type not convertable to Uint8Array
        debug('peer sent full raw blocks')
        const parts = bufferSplit(str, Buffer.from(MSG_SEPARATOR[type]))
        const [, ...rawBlocks] = parts
        const blocks = rawBlocks.map(b => BcBlock.deserializeBinary(b))
        this._engine._emitter.emit('putfullblock', {
          data: blocks,
          connection: conn
        })
      } else {
        this._logger.info(`Unknown protocol flag received: ${type}`)
      }

      return Promise.resolve(true)
    })().catch(err => {
      this._logger.error(err)
    })
  }

  broadcastNewBlock (block: BcBlock, withoutPeerId: ?Object) {
    this._logger.debug(`broadcasting msg to peers, ${inspect(block.toObject())}`)
    let filters = []
    if (withoutPeerId) {
      if (withoutPeerId.constructor === Array) {
        filters = withoutPeerId
      } else {
        filters.push(withoutPeerId)
      }
    }
    this._engine._emitter.emit('announceblock', { data: block, filters: filters })
  }
}

export default PeerNode
