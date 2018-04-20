/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const assert = require('assert')
const EventEmitter = require('events')
const { DPT, RLPx, ETH, _util } = require('ethereumjs-devp2p')
const ethereumCommon = require('ethereum-common')
const EthereumBlock = require('ethereumjs-block')
const EthereumTx = require('ethereumjs-tx')
const LRUCache = require('lru-cache')
const portscanner = require('portscanner')
const { promisify } = require('util')
const rlp = require('rlp-encoding')

const logging = require('../../logger')
const { getPrivateKey } = require('../utils')

const config = require('../../../config/config')

const BOOTNODES = ethereumCommon
  .bootstrapNodes
  .map(node => {
    return {
      address: node.ip,
      udpPort: node.port,
      tcpPort: node.port
    }
  }).concat(config.rovers.eth.altBootNodes)

const DAO_FORK_SUPPORT = true

const DISCONNECT_REASONS = Object.keys(RLPx.DISCONNECT_REASONS)
  .reduce((acc, key) => {
    const errorKey = parseInt(RLPx.DISCONNECT_REASONS[key], 10)
    acc[errorKey] = key
    return acc
  }, {})

const HOSTS = BOOTNODES.map((b) => {
  return b.address
})

// TODO extract this to config
const ETH_1920000_HEADER = rlp.decode(
  Buffer.from(
    'f9020da0a218e2c611f21232d857e3c8cecdcdf1f65f25a4477f98f6f47e4063807f2308a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d4934794bcdfc35b86bedf72f0cda046a3c16829a2ef41d1a0c5e389416116e3696cce82ec4533cce33efccb24ce245ae9546a4b8f0d5e9a75a07701df8e07169452554d14aadd7bfa256d4a1d0355c1d174ab373e3e2d0a3743a026cf9d9422e9dd95aedc7914db690b92bab6902f5221d62694a2fa5d065f534bb90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008638c3bf2616aa831d4c008347e7c08301482084578f7aa88d64616f2d686172642d666f726ba05b5acbf4bf305f948bd7be176047b20623e1417f75597341a059729165b9239788bede87201de42426',
    'hex'
  )
)
const ETH_1920000 = '4985f5ca3d2afbec36529aa96f74de3cc10a2a4a6c44f2157a57d2c6059a11bb'
const ETC_1920000 = '94365e3a8c0b35089c1d1195081fe7489b528a84b22199c916180db8b28ade7f'
// TODO end extract this to config
const findAPortNotInUse = promisify(portscanner.findAPortNotInUse)

const getPeerAddr = peer => `${peer._socket.remoteAddress}:${peer._socket.remotePort}`

const isValidTx = (tx: EthereumTx) => tx.validate(false)

const isValidBlock = (block: EthereumBlock) => {
  if (!block.validateUnclesHash()) {
    return Promise.resolve(false)
  }

  if (!block.transactions.every(isValidTx)) {
    return Promise.resolve(false)
  }

  return new Promise((resolve, reject) => {
    block.genTxTrie(() => {
      try {
        resolve(block.validateTransactionsTrie())
      } catch (err) {
        reject(err)
      }
    })
  })
}

export default class Network extends EventEmitter {
  _key: Buffer; // eslint-disable-line no-undef
  _logger: Object; // eslint-disable-line no-undef
  _minimumPeers: number; // eslint-disable-line no-undef
  _peers: string[]; // eslint-disable-line no-undef
  _dpt: ?DPT; // eslint-disable-line no-undef
  _rlpx: ?RLPx; // eslint-disable-line no-undef
  _txCache: LRUCache<string, bool>; // eslint-disable-line no-undef
  _blocksCache: LRUCache<string, bool>; // eslint-disable-line no-undef
  _forkDrops: {[string]: ?TimeoutID}; // eslint-disable-line no-undef
  _forkVerifiedForPeer: Object; // eslint-disable-line no-undef
  _peerRequests: Object; // eslint-disable-line no-undef

  constructor () {
    super()
    this._logger = logging.getLogger(__filename)
    this._forkVerifiedForPeer = {}
    this._forkDrops = {}
    this._peerRequests = {}
    this._minimumPeers = 12
    this._peers = []
    this._rlpx = null
    this._key = getPrivateKey()
    this._txCache = new LRUCache({ max: 2000 })
    this._blocksCache = new LRUCache({ max: 118 })
  }

  get peers (): string[] {
    return this._peers
  }

  get rlpx (): RLPx {
    return this._rlpx
  }

  addPeer (peer: Object) {
    if (!peer || !peer.endpoint) {
      return
    }

    const host = peer.endpoint.address
    const protocol = 'http'

    if (HOSTS.indexOf(host) > -1) {
      return
    }

    if (peer.endpoint.tcpPort) {
      const port = peer.endpoint.tcpPort
      const target = `${protocol}://${host}:${port}`

      this._logger.debug('New peer: ' + target)
      this.peers.push(target)
    }
  }

  connect () {
    findAPortNotInUse(30304, 33663)
      .then((port) => {
        this.run(port)
      })
      .catch(() => {
        this._logger.error('Unable to find local network interface to listen on')
        process.exit(3)
      })
  }

  onNewTx (tx: EthereumTx, peer: Object) {
    const txHashHex = tx.hash().toString('hex')
    if (this._txCache.has(txHashHex)) {
      return
    }

    this._txCache.set(txHashHex, true)
    this._logger.debug(`new tx: ${txHashHex} (from ${getPeerAddr(peer)})`)
  }

  onNewBlock (block: EthereumBlock, peer: Object) {
    const blockHashHex = block.hash().toString('hex')
    if (this._blocksCache.has(blockHashHex)) {
      return
    }

    this._blocksCache.set(blockHashHex, true)

    for (let tx of block.transactions) {
      this.onNewTx(tx, peer)
    }

    this._logger.debug(`Transmitting new block ${blockHashHex} from peer "${getPeerAddr(peer)}"`)
    this.emit('newBlock', block)
  }

  handleMessage (rlpx: Object, code: string, payload: Buffer, peer: Object) {
    this._logger.debug(`new message, code: ${code}`)
    // console.log('message.payload', payload)
    // console.log(`new message (${addr}) ${code} ${rlp.encode(payload).toString('hex')}`)

    switch (code) {
      case ETH.MESSAGE_CODES.BLOCK_BODIES:
        this.handleMessageBlockBodies(payload, peer)
        break

      case ETH.MESSAGE_CODES.BLOCK_HEADERS:
        this.handleMessageBlockHeaders(payload, peer)
        break

      case ETH.MESSAGE_CODES.GET_BLOCK_BODIES:
        this.handleMessageGetBlockBodies(peer)
        break

      case ETH.MESSAGE_CODES.GET_BLOCK_HEADERS:
        this.handleMessageGetBlockHeaders(payload, peer)
        break

      case ETH.MESSAGE_CODES.GET_NODE_DATA:
        this.handleMessageGetNodeData(peer)
        break

      case ETH.MESSAGE_CODES.GET_RECEIPTS:
        this.handleMessageGetReceipts(peer)
        break

      case ETH.MESSAGE_CODES.NEW_BLOCK:
        this.handleMessageNewBlock(payload, peer)
        break

      case ETH.MESSAGE_CODES.NEW_BLOCK_HASHES:
        this.handleMessageNewBlockHashes(payload, peer)
        break

      case ETH.MESSAGE_CODES.TX:
        this.handleMessageTx(payload, peer)
        break

      case ETH.MESSAGE_CODES.RECEIPTS:
        break

      case ETH.MESSAGE_CODES.NODE_DATA:
        break
    }
  }

  handleMessageBlockBodies (payload: Object, peer: Object) {
    if (DAO_FORK_SUPPORT !== null && !this._forkVerifiedForPeer[getPeerAddr(peer)]) {
      return
    }

    if (payload.length !== 1) {
      this._logger.debug(`${getPeerAddr(peer)} not more than one block body expected (received: ${payload.length})`)
      return
    }

    while (this._peerRequests[getPeerAddr(peer)].bodies.length > 0) {
      const header = this._peerRequests[getPeerAddr(peer)].bodies.shift()
      const block = new EthereumBlock([
        header.raw,
        payload[0][0],
        payload[0][1]
      ])

      isValidBlock(block).then(isValid => {
        if (isValid) {
          this.onNewBlock(block, peer)
        } else {
          this._logger.info(`Disconnecting ${getPeerAddr(peer)} for invalid block body`)
          peer.disconnect(RLPx.DISCONNECT_REASONS.USELESS_PEER)
        }
      })
    }
  }

  handleMessageBlockHeaders (payload: Object, peer: Object) {
    if (DAO_FORK_SUPPORT !== null && this._forkVerifiedForPeer[getPeerAddr(peer)] === undefined) {
      if (payload.length !== 1) {
        this._logger.debug(`${getPeerAddr(peer)} expected one header for DAO fork verify (received: ${payload.length})`)
        return
      }

      const expectedHash = DAO_FORK_SUPPORT
        ? ETH_1920000
        : ETC_1920000
      const header = new EthereumBlock.Header(payload[0])
      if (header.hash().toString('hex') === expectedHash) {
        this._logger.debug(`${getPeerAddr(peer)} verified to be on the same side of the DAO fork`)
        const timeout = this._forkDrops[getPeerAddr(peer)]
        if (timeout) {
          clearTimeout(timeout)
        }
        this._forkVerifiedForPeer[getPeerAddr(peer)] = true
      }
    } else {
      if (payload.length > 1) {
        this._logger.debug(`${getPeerAddr(peer)} not more than one block header expected (received: ${payload.length})`)
        return
      }

      let isValidPayload = false
      const header = new EthereumBlock.Header(payload[0])
      const eth = peer.getProtocols()[0]
      while (this._peerRequests[getPeerAddr(peer)].headers.length > 0) {
        const blockHash = this._peerRequests[getPeerAddr(peer)].headers.shift()

        if (header.hash().equals(blockHash)) {
          isValidPayload = true
          setTimeout(() => {
            eth.sendMessage(
              ETH.MESSAGE_CODES.GET_BLOCK_BODIES,
              [blockHash]
            )
            this._peerRequests[getPeerAddr(peer)].bodies.push(header)
          }, 100) // 0.1 sec
          return
        }
      }

      if (!isValidPayload) {
        this._logger.debug(`${getPeerAddr(peer)} received wrong block header ${header.hash().toString('hex')}`)
      }
    }
  }

  handleMessageGetBlockBodies (peer: Object) {
    const eth = peer.getProtocols()[0]
    eth.sendMessage(ETH.MESSAGE_CODES.BLOCK_BODIES, [])
  }

  handleMessageGetBlockHeaders (payload: Object, peer: Object) {
    const eth = peer.getProtocols()[0]
    const headers = []
    // hack
    if (DAO_FORK_SUPPORT && _util.buffer2int(payload[0]) === 1920000) {
      headers.push(ETH_1920000_HEADER)
    }

    eth.sendMessage(ETH.MESSAGE_CODES.BLOCK_HEADERS, headers)
  }

  handleMessageGetNodeData (peer: Object) {
    const eth = peer.getProtocols()[0]
    eth.sendMessage(ETH.MESSAGE_CODES.NODE_DATA, [])
  }

  handleMessageGetReceipts (peer: Object) {
    const eth = peer.getProtocols()[0]
    eth.sendMessage(ETH.MESSAGE_CODES.RECEIPTS, [])
  }

  handleMessageNewBlock (payload: Object, peer: Object) {
    if (DAO_FORK_SUPPORT !== null && !this._forkVerifiedForPeer[getPeerAddr(peer)]) {
      return
    }

    const newBlock = new EthereumBlock(payload[0])

    isValidBlock(newBlock).then(isValid => {
      if (isValid) {
        this.onNewBlock(newBlock, peer)
      }
    })
  }

  handleMessageNewBlockHashes (payload: Object, peer: Object) {
    if (DAO_FORK_SUPPORT !== null && this._forkVerifiedForPeer[getPeerAddr(peer)] === false) {
      return
    }

    const eth = peer.getProtocols()[0]
    for (let item of payload) {
      const blockHash = item[0]
      if (this._blocksCache.has(blockHash.toString('hex'))) {
        continue
      }

      setTimeout(() => {
        eth.sendMessage(
          ETH.MESSAGE_CODES.GET_BLOCK_HEADERS,
          [blockHash, 1, 0, 0]
        )

        this._peerRequests[getPeerAddr(peer)].headers.push(blockHash)
      }, 100) // 0.1 sec
    }
  }

  handleMessageTx (payload: Object, peer: Object) {
    if (DAO_FORK_SUPPORT !== null && !this._forkVerifiedForPeer[getPeerAddr(peer)]) {
      return
    }

    for (let item of payload) {
      const tx = new EthereumTx(item)
      if (isValidTx(tx)) {
        this.onNewTx(tx, peer)
      }
    }
  }

  handlePeerAdded (rlpx: RLPx, peer: Object) {
    const addr = getPeerAddr(peer)

    const eth = peer.getProtocols()[0]
    this._peerRequests[getPeerAddr(peer)] = {
      headers: [],
      bodies: []
    }

    const clientId = peer.getHelloMessage().clientId

    this._logger.debug(`Add peer: (${addr}, ${clientId}), eth${eth.getVersion()}, total: ${rlpx.getPeers().length}`)

    eth.sendStatus({
      networkId: 1, // reference: https://ethereum.stackexchange.com/a/17101
      td: _util.int2buffer(17179869184), // total difficulty in genesis block
      bestHash: Buffer.from(
        'd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3',
        'hex'
      ),
      genesisHash: Buffer.from(
        'd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3',
        'hex'
      )
    })

    // check DAO
    eth.once('status', () => {
      if (DAO_FORK_SUPPORT === null) {
        return
      }
      eth.sendMessage(ETH.MESSAGE_CODES.GET_BLOCK_HEADERS, [
        1920000,
        1,
        0,
        0
      ])

      this._forkDrops[getPeerAddr(peer)] = setTimeout(() => {
        peer.disconnect(RLPx.DISCONNECT_REASONS.USELESS_PEER)
      }, 15000 /* 15 sec */)

      peer.once('close', () => {
        const timeout = this._forkDrops[getPeerAddr(peer)]
        if (timeout) {
          clearTimeout(timeout)
        }
      })
    })

    eth.on('message', async (code, payload) => {
      this.handleMessage(rlpx, code, payload, peer)
    })
  }

  handlePeerError (dpt: DPT, peer: Object, err: Error) {
    // $FlowFixMe
    if (err.code === 'ECONNRESET') {
      return
    }

    if (err instanceof assert.AssertionError) {
      const peerId = peer.getId()

      if (peerId !== null) {
        dpt.banPeer(peerId, 300000 /* 5 minutes */)
      }

      this._logger.debug(`Peer error (${getPeerAddr(peer)}): ${err.message}`)
      return
    }

    this._logger.debug(`Peer error (${getPeerAddr(peer)}): ${err.stack || err.toString()}`)
  }

  handlePeerRemoved (rlpx: Object, peer: Object, reason: Object, disconnectWe: boolean) {
    const who = disconnectWe ? 'we disconnect' : 'peer disconnect'
    const total = rlpx.getPeers().length
    const reasonCode = DISCONNECT_REASONS[parseInt(String(reason), 10)]
    this._logger.debug(`Remove peer (${getPeerAddr(peer)}): ${who}, reason code: ${reasonCode}, total: ${total}`)
  }

  onError (msg: string, err: Error) {
    this._logger.error(`Error: ${msg} ${err.toString()}`)
  }

  // TODO port is never used
  run (port: number) {
    // DPT
    this._dpt = new DPT(this._key, {
      refreshInterval: 30000,
      timeout: 25000,
      endpoint: {
        address: '0.0.0.0',
        udpPort: null,
        tcpPort: null
      }
    })

    this._dpt.on('error', (err) => this.onError('DPT Error', err))

    const rlpx = this._rlpx = new RLPx(this._key, {
      dpt: this._dpt,
      maxPeers: 60,
      capabilities: [ETH.eth63, ETH.eth62],
      listenPort: null
    })

    rlpx.on('error', (err) => this.onError('RLPX Error', err))

    rlpx.on('peer:added', (peer) => this.handlePeerAdded(rlpx, peer))

    rlpx.on('peer:removed', (peer, reason, disconnectWe) => this.handlePeerRemoved(rlpx, peer, reason, disconnectWe))

    rlpx.on('peer:error', (peer, err) => this.handlePeerError(this._dpt, peer, err))

    for (let node of BOOTNODES) {
      // $FlowFixMe
      this._dpt.bootstrap(node).catch(err => {
        this._logger.debug(`DPT bootstrap error: ${err.stack || err.toString()}`)
      })
    }

    setInterval(() => {
      // $FlowFixMe
      const peersCount = this._dpt.getPeers().length
      const openSlots = this.rlpx._getOpenSlots()
      const queueLength = this.rlpx._peersQueue.length
      const queueLength2 = this.rlpx._peersQueue.filter(o => o.ts <= Date.now()).length
      this._logger.debug(`Rover peers ${peersCount}, open slots: ${openSlots}, queue: ${queueLength} / ${queueLength2}`)
    }, 30000 /* 30 sec */)
  }
}
