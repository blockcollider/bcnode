/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const assert = require('assert')
const devp2p = require('ethereumjs-devp2p')
const LRUCache = require('lru-cache')
const portscanner = require('portscanner')
const { promisify } = require('util')

const logging = require('../../logger')
const { getPrivateKey } = require('../utils')

const config = require('../../../config/config')

const BOOTNODES = require('ethereum-common')
  .bootstrapNodes
  .map(node => {
    return {
      address: node.ip,
      udpPort: node.port,
      tcpPort: node.port
    }
  }).concat(config.rovers.eth.altBootNodes)

const DAO_FORK_SUPPORT = true

const DISCONNECT_REASONS = Object.keys(devp2p.RLPx.DISCONNECT_REASONS)
  .reduce((acc, key) => {
    const errorKey = parseInt(devp2p.RLPx.DISCONNECT_REASONS[key], 10)
    acc[errorKey] = key
    return acc
  }, {})

const HOSTS = BOOTNODES.map((b) => {
  return b.address
})

const findAPortNotInUse = promisify(portscanner.findAPortNotInUse)

const getPeerAddr = peer => `${peer._socket.remoteAddress}:${peer._socket.remotePort}`

export default class Network {
  _key: Buffer; // eslint-disable-line no-undef
  _logger: Object; // eslint-disable-line no-undef
  _minimumPeers: number; // eslint-disable-line no-undef
  _peers: string[]; // eslint-disable-line no-undef
  _rlpx: ?devp2p.RLPx; // eslint-disable-line no-undef
  _txCache: LRUCache<string, boolean>; // eslint-disable-line no-undef
  _blocksCache: LRUCache<string, boolean>; // eslint-disable-line no-undef

  constructor () {
    this._logger = logging.getLogger(__filename)
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

  get rlpx (): ?devp2p.RLPx {
    return this._rlpx
  }

  addPeer (peer: Object) {
    if (!peer || !peer.endpoint) {
      return
    }

    var host = peer.endpoint.address
    var protocol = 'http'

    if (HOSTS.indexOf(host) > -1) {
      return
    }

    if (peer.endpoint.tcpPort) {
      const port = peer.endpoint.tcpPort
      const target = `${protocol}://${host}:${port}`

      this._logger.info('new peer: ' + target)
      this.peers.push(target)
    }
  }

  connect () {
    findAPortNotInUse(30304, 33663)
      .then((port) => {
        this.run(port)
      })
      .catch(() => {
        this._logger.error('unable to find local network interface to listen on')
        process.exit(3)
      })
  }

  handleMessage (rlpx: Object, code: string, payload: Buffer) {
    console.log('message.code', code)
    // console.log('message.payload', payload)

    // console.log(`new message (${addr}) ${code} ${rlp.encode(payload).toString('hex')}`)

    switch (code) {
      case devp2p.ETH.MESSAGE_CODES.BLOCK_BODIES:
        this.handleMessageBlockBodies()
        break

      case devp2p.ETH.MESSAGE_CODES.BLOCK_HEADERS:
        this.handleMessageBlockHeaders()
        break

      case devp2p.ETH.MESSAGE_CODES.GET_BLOCK_BODIES:
        this.handleMessageGetBlockBodies()
        break

      case devp2p.ETH.MESSAGE_CODES.GET_BLOCK_HEADERS:
        this.handleMessageGetBlockHeaders()
        break

      case devp2p.ETH.MESSAGE_CODES.GET_NODE_DATA:
        this.handleMessageGetNodeData()
        break

      case devp2p.ETH.MESSAGE_CODES.GET_RECEIPTS:
        this.handleMessageGetReceipts()
        break

      case devp2p.ETH.MESSAGE_CODES.NEW_BLOCK:
        this.handleMessageNewBlock()
        break

      case devp2p.ETH.MESSAGE_CODES.NEW_BLOCK_HASHES:
        this.handleMessageNewBlockHashes(payload)
        break

      case devp2p.ETH.MESSAGE_CODES.TX:
        this.handleMessageTx()
        break

      case devp2p.ETH.MESSAGE_CODES.RECEIPTS:
        break

      case devp2p.ETH.MESSAGE_CODES.NODE_DATA:
        break
    }
  }

  handleMessageBlockBodies () {
    /*
    if (DAO_FORK_SUPPORT !== null && !forkVerified) {
      return
    }

    if (payload.length !== 1) {
      console.log(
        `${addr} not more than one block body expected (received: ${
          payload.length
          })`
      )
      return
    }

    let isValidPayload = false
    while (requests.bodies.length > 0) {
      const header = requests.bodies.shift()
      const block = new EthereumBlock([
        header.raw,
        payload[0][0],
        payload[0][1]
      ])
      const isValid = await isValidBlock(block)
      if (isValid) {
        isValidPayload = true
        onNewBlock(block, peer)
        return
      }
    }

    if (!isValidPayload) {
      log.info(
        'disconnecting ' +
        addr +
        ' for invalid ' +
        ID +
        ' block body'
      )
      peer.disconnect(devp2p.RLPx.DISCONNECT_REASONS.USELESS_PEER)
    }
    //*/
  }

  handleMessageBlockHeaders () {
    /*
    if (DAO_FORK_SUPPORT !== null && !forkVerified) {
      if (payload.length !== 1) {
        // console.log(`${addr} expected one header for DAO fork verify (received: ${payload.length})`)
        return
      }

      const expectedHash = DAO_FORK_SUPPORT
        ? ETH_1920000
        : ETC_1920000
      const header = new EthereumBlock.Header(payload[0])
      if (header.hash().toString('hex') === expectedHash) {
        // console.log(`${addr} verified to be on the same side of the DAO fork`)
        clearTimeout(forkDrop)
        forkVerified = true
      }
    } else {
      if (payload.length > 1) {
        // console.log(`${addr} not more than one block header expected (received: ${payload.length})`)
        return
      }

      let isValidPayload = false
      const header = new EthereumBlock.Header(payload[0])
      while (requests.headers.length > 0) {
        const blockHash = requests.headers.shift()

        if (header.hash().equals(blockHash)) {
          isValidPayload = true
          setTimeout(() => {
            eth.sendMessage(
              devp2p.ETH.MESSAGE_CODES.GET_BLOCK_BODIES,
              [blockHash]
            )
            requests.bodies.push(header)
          }, 100) // 0.1 sec
          return
        }
      }

      if (!isValidPayload) {
        // console.log(`${addr} received wrong block header ${header.hash().toString('hex')}`)
      }
    }
    //*/
  }

  handleMessageGetBlockBodies () {
    /*
    eth.sendMessage(devp2p.ETH.MESSAGE_CODES.BLOCK_BODIES, [])
    //*/
  }

  handleMessageGetBlockHeaders () {
    /*
    const headers = []
    // hack
    if (
      DAO_FORK_SUPPORT &&
      devp2p._util.buffer2int(payload[0]) === 1920000
    ) {
      headers.push(ETH_1920000_HEADER)
    }

    eth.sendMessage(devp2p.ETH.MESSAGE_CODES.BLOCK_HEADERS, headers)
    //*/
  }

  handleMessageGetNodeData () {
    /*
    eth.sendMessage(devp2p.ETH.MESSAGE_CODES.NODE_DATA, [])
    //*/
  }

  handleMessageGetReceipts () {
    /*
    eth.sendMessage(devp2p.ETH.MESSAGE_CODES.RECEIPTS, [])
    //*/
  }

  handleMessageNewBlock () {
    /*
    if (DAO_FORK_SUPPORT !== null && !forkVerified) {
      return
    }

    const newBlock = new EthereumBlock(payload[0])

    const isValidNewBlock = await isValidBlock(newBlock)
    if (isValidNewBlock) {
      onNewBlock(newBlock, peer)
    }
    //*/
  }

  handleMessageNewBlockHashes (payload: Object) {
    /*
    if (DAO_FORK_SUPPORT !== null && !forkVerified) {
      return
    }

    for (let item of payload) {
      const blockHash = item[0]
      if (blocksCache.has(blockHash.toString('hex'))) {
        continue
      }

      setTimeout(() => {
        eth.sendMessage(
          devp2p.ETH.MESSAGE_CODES.GET_BLOCK_HEADERS,
          [blockHash, 1, 0, 0]
        )

        requests.headers.push(blockHash)
      }, 100) // 0.1 sec
    }
    // */
  }

  handleMessageTx () {
    /*
    if (DAO_FORK_SUPPORT !== null && !forkVerified) {
      return
    }

    /// ////////////////////// FIX ME
    for (let item of payload) {
      const tx = new EthereumTx(item)
      if (isValidTx(tx)) {
        onNewTx(tx, peer)
      }
    }
    //*/
  }

  handlePeerAdded (rlpx: Object, peer: Object) {
    const addr = getPeerAddr(peer)

    const host = addr.split(':')[0]
    const port = addr.split(':')[1]

    const eth = peer.getProtocols()[0]
    const requests = {
      headers: [],
      bodies: []
    }

    const clientId = peer.getHelloMessage().clientId

    this._logger.info(`Add peer: ${addr} ${clientId} (eth${eth.getVersion()}) (total: ${rlpx.getPeers().length})`)

    eth.sendStatus({
      networkId: 1,
      td: devp2p._util.int2buffer(17179869184), // total difficulty in genesis block
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
    let forkDrop: ?TimeoutID = null
    let forkVerified = false
    eth.once('status', () => {
      if (DAO_FORK_SUPPORT === null) return
      eth.sendMessage(devp2p.ETH.MESSAGE_CODES.GET_BLOCK_HEADERS, [
        1920000,
        1,
        0,
        0
      ])

      forkDrop = setTimeout(() => {
        peer.disconnect(devp2p.RLPx.DISCONNECT_REASONS.USELESS_PEER)
      }, 15000 /* 15 sec */)

      peer.once('close', () => {
        if (forkDrop) {
          clearTimeout(forkDrop)
        }
      })
    })

    eth.on('message', async (code, payload) => {
      this.handleMessage(rlpx, code, payload)
    })
  }

  handlePeerError (dpt: Object, peer: Object, err: Error) {
    // $FlowFixMe
    if (err.code === 'ECONNRESET') {
      return
    }

    if (err instanceof assert.AssertionError) {
      const peerId = peer.getId()

      if (peerId !== null) {
        dpt.banPeer(peerId, 300000 /* 5 minutes */)
      }

      this._logger.error(`Peer error (${getPeerAddr(peer)}): ${err.message}`)
    }

    this._logger.error(`Peer error (${getPeerAddr(peer)}): ${err.stack || err.toString()}`)
  }

  handlePeerRemoved (rlpx: Object, peer: Object, reason: Object, disconnectWe: boolean) {
    const who = disconnectWe ? 'we disconnect' : 'peer disconnect'
    const total = rlpx.getPeers().length
    const reasonCode = DISCONNECT_REASONS[parseInt(String(reason), 10)]
    this._logger.warn(`Remove peer: ${getPeerAddr(peer)} (${who}, reason code: ${reasonCode}) (total: ${total})`)
  }

  onError (msg: string, err: Error) {
    this._logger.error(`${msg} ${err.toString()}`)
  }

  run (port: number) {
    // DPT
    const dpt = new devp2p.DPT(this._key, {
      refreshInterval: 30000,
      timeout: 25000,
      endpoint: {
        address: '0.0.0.0',
        udpPort: null,
        tcpPort: null
      }
    })

    dpt.on('error', (err) => this.onError('DPT Error', err))

    const rlpx = this._rlpx = new devp2p.RLPx(this._key, {
      dpt: dpt,
      maxPeers: 60,
      capabilities: [devp2p.ETH.eth63, devp2p.ETH.eth62],
      listenPort: null
    })

    rlpx.on('error', (err) => this.onError('RLPX Error', err))

    rlpx.on('peer:added', (peer) => this.handlePeerAdded(rlpx, peer))

    rlpx.on('peer:removed', (peer, reason, disconnectWe) => this.handlePeerRemoved(rlpx, peer, reason, disconnectWe))

    rlpx.on('peer:error', (peer, err) => this.handlePeerError(dpt, peer, err))

    for (let node of BOOTNODES) {
      dpt.bootstrap(node)
        .catch(err => {
          this._logger.error(`DPT bootstrap error: ${err.stack || err.toString()}`)
        })
    }

    /*
    function onNewTx (tx, peer) {
      const txHashHex = tx.hash().toString('hex')
      if (txCache.has(txHashHex)) {
        return
      }

      txCache.set(txHashHex, true)
      // console.log(`new tx: ${txHashHex} (from ${getPeerAddr(peer)})`)
    }

    function onNewBlock (block, peer) {
      const blockHashHex = block.hash().toString('hex')
      const peersCount = dpt.getPeers().length
      if (blocksCache.has(blockHashHex)) {
        return
      }

      blocksCache.set(blockHashHex, true)
      for (let tx of block.transactions) {
        onNewTx(tx, peer)
      }

      transmitRoverBlock(block)
    }

    function isValidTx (tx) {
      return tx.validate(false)
    }

    async function isValidBlock (block) {
      if (!block.validateUnclesHash()) {
        return false
      }

      if (!block.transactions.every(isValidTx)) {
        return false
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
    // */

    setInterval(() => {
      // console.log(dpt.getPeers());
      const peersCount = dpt.getPeers().length
      const openSlots = rlpx._getOpenSlots()
      const queueLength = rlpx._peersQueue.length
      const queueLength2 = rlpx._peersQueue.filter(o => o.ts <= Date.now())
        .length

      this._logger.info(`rover peers ${peersCount}, open slots: ${openSlots}, queue: ${queueLength} / ${queueLength2}`)

    }, 30000 /* 30 sec */)
  }
}
