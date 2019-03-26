/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @disable-flow
 */
import type { RoverClient } from '../../protos/rover_grpc_pb'
import type { RoverMessage } from '../../protos/rover_pb'

const process = require('process')
const { pathOr, contains, reverse, without, xprod } = require('ramda')
const { Messages, Peer } = require('bitcore-p2p')
const bitcoreLib = require('bitcore-lib')
const { Transaction } = require('btc-transaction')
const LRUCache = require('lru-cache')
const convBin = require('binstring')
const { util: xcpUtils } = require('counterjs')
const bitcoin = require('bitcoinjs-lib')
const ms = require('ms')
const BN = require('bn.js')

const logging = require('../../logger')
const { networks } = require('../../config/networks')
const { errToString } = require('../../helper/error')
const { Block, MarkedTransaction } = require('../../protos/core_pb')
const { RoverMessageType, RoverIdent } = require('../../protos/rover_pb')
const { RpcClient } = require('../../rpc')
const { Network, isSatoshiPeer } = require('./network')
const { swapOrder } = require('../../utils/strings')
const { createUnifiedBlock, isBeforeSettleHeight } = require('../helper')

// monkeypatch Peer.prototype._readMessage - to log error and not fail
// see https://github.com/bitpay/bitcore-p2p/issues/86 and https://github.com/bitpay/bitcore-p2p/issues/102
// don't want to use forked repo
var readMessageOriginal = Peer.prototype._readMessage
Peer.prototype._readMessage = function () {
  try {
    readMessageOriginal.apply(this, arguments)
  } catch (e) {
    Peer.prototype._onError.apply(this, ['error', e])
  }
}
// END monkeypatch Peer.prototype._readMessage - to log error and not fail

const NETWORK_TIMEOUT = 3000
const BLOCK_VERSION = 536870912
const BTC_MAX_FETCH_BLOCKS = 20
const BTC_BOOT_BLOCK = process.env.BTC_BOOT_BLOCK
const BC_NETWORK = process.env.BC_NETWORK || 'main'
const BTC_GENESIS_HASH = (true || BC_NETWORK === 'main') // eslint-disable-line
  ? '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f'
  : '000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943'
const BTC_EMB_XCP_ASSET_ID = networks[BC_NETWORK].rovers.btc.embAssetId

const ROVER_NAME = 'btc'

const BTC_BCH_FORK_INFO = {
  forkBlock: {hash: '0000000000000000011865af4122fe3b144e2cbeea86142e8ff2fb4107352d43', height: 478558},
  firstBlockAfterFork: {hash: '00000000000000000019f112ec0a9982926f1258cdcc558dd7c3b7e5dc7fa148', height: 478559},
  secondBlockAfterFork: {hash: '000000000000000000e512213f7303f72c5f7446e6e295f73c28cb024dd79e34', height: 478560}
}

async function _createUnifiedBlock (roverRpc: RoverClient, block: bitcoreLib.Block, isStandalone: boolean): Block { // TODO specify block type
  const msg = new Block()
  msg.setBlockchain(ROVER_NAME)
  msg.setHash(block.header.hash)
  msg.setPreviousHash(swapOrder(block.header.prevHash.toString('hex')))
  msg.setTimestamp(block.header.time * 1000)
  msg.setHeight(parseInt(block.blockNumber, 10))
  msg.setMerkleRoot(block.header.merkleRoot.toString('hex'))

  const tokenTransactions = []
  for (let tx of block.transactions) {
    try {
      let xcpTx = xcpUtils.parseTransaction(tx.toString('hex'))

      let { message } = xcpTx
      // EMB on XCP transaction
      if (message) {
        let { data: { asset_id: assetId }, type, destination, sourcePublicKey } = message

        let isEmbTx = (BTC_EMB_XCP_ASSET_ID !== null && type === 'Send' && assetId === BTC_EMB_XCP_ASSET_ID && destination && sourcePublicKey)
        let from = bitcoin.ECPair.fromPublicKeyBuffer(sourcePublicKey, bitcoin.networks.bitcoin).getAddress()

        if (isEmbTx) {
          let tTx = new MarkedTransaction()
          tTx.setId(ROVER_NAME)
          tTx.setToken('emb') // TODO maybe contract address?
          tTx.setAddrFrom(from)
          tTx.setAddrTo(destination.address)
          tTx.setValue(new BN(destination.amount).toBuffer())

          tTx.setBlockHeight(msg.getHeight())
          tTx.setIndex(tokenTransactions.length)
          tTx.setHash(tx.id)

          tokenTransactions.push(tTx)
        }
      }

      // OPTIMIZE skip coinbase here, will never be trade settling TX
      // check if is watched for settlement
      const t = Transaction.deserialize(tx.toBuffer())

      // get product of all inputs and outputs and check if before settlement height
      //
      // we only support p2pkh for now
      // TODO add scripthash type?
      const inputs = t.ins.filter(input => input.script.getInType() === 'pubkeyhash')
      const outputs = t.outs.filter(output => output.script.getOutType() === 'pubkeyhash')

      const inputAddresses = inputs.map(input => bitcoin.ECPair.fromPublicKeyBuffer(Buffer.from(input.script.simpleInPubKey()), bitcoin.networks.bitcoin).getAddress())
      const pairs = xprod(inputAddresses, outputs)

      // all combinations of input.address + output.address are being checked, if is before settlement and found, lets add this marked TX
      for (let [from, output] of pairs) {
        const to = output.script.toAddress().toString()
        const isHeightBeforeSettlement = await isBeforeSettleHeight(from, to, ROVER_NAME, roverRpc)
        if (isHeightBeforeSettlement) {
          const value = new BN(reverse(output.value), 16)
          let tokenType = ROVER_NAME
          let tTx = new MarkedTransaction()
          tTx.setId(ROVER_NAME)
          tTx.setToken(tokenType)
          tTx.setAddrFrom(from)
          tTx.setAddrTo(to)
          tTx.setValue(value.toBuffer())

          tTx.setBlockHeight(msg.getHeight())
          tTx.setIndex(tokenTransactions.length)
          tTx.setHash(tx.id)

          tokenTransactions.push(tTx)
        }
      }
    } catch (_) {
      // could not parse TX's input data
    }
  }
  msg.setMarkedTxsList(tokenTransactions)

  return msg
}

const randomChoiceMut = (arr: Array<any>) => {
  const index = Math.floor(Math.random() * arr.length)
  const ret = arr[index]
  arr.splice(index, 1)
  return ret
}

export default class Controller {
  constructor (isStandalone: boolean) {
    this._network = undefined
    this._logger = logging.getLogger(__filename)
    this._blockCache = new LRUCache({ max: 110 })
    this._blocksNumberCache = new LRUCache({ max: 110 })
    this._txCache = new LRUCache({ max: 3000 })
    this._rpc = new RpcClient()
    this._isStandalone = isStandalone
    this._requestedBlockHashes = []
    this._hadQuorumAtLeastOnce = false
    this._initialSync = false
  }

  get network () {
    return this._network
  }

  get initialSync () {
    return this._initialSync
  }

  set initialSync (state) {
    this._initialSync = state
  }

  _tryDisconnectPeer (peer: Peer) {
    try {
      if (peer && peer.status) {
        peer.disconnect()
      }
    } catch (err) {
      this._logger.debug(`could not disconnect from peer, err: ${errToString(err)}`)
    }

    try {
      this.network.removePeer(peer)
    } catch (e) {
      this._logger.debug(`error while removing peer ${peer.host} from network, err: ${errToString(e)}`)
    }
  }

  init (config: { maximumPeers: number }) {
    const network = new Network(config)
    this._network = network

    const pool = this.network.pool

    process.on('disconnect', () => {
      this._logger.info('Parent exited')
      process.exit()
    })

    // FIXME: This can interfere with global handler
    process.on('uncaughtException', (e) => {
      this._logger.error(`Uncaught exception: ${errToString(e)}`)
      process.exit(3)
    })

    const rpcStream = this._rpc.rover.join(new RoverIdent(['btc']))
    rpcStream.on('data', (message: RoverMessage) => {
      this._logger.debug(`rpcStream: Received ${JSON.stringify(message.toObject(), null, 2)}`)
      switch (message.getType()) { // Also could be message.getPayloadCase()
        case RoverMessageType.REQUESTRESYNC:
          this.initialSync = true
          break

        case RoverMessageType.FETCHBLOCK:
          const payload = message.getFetchBlock()
          this.requestBlock(payload.getFromBlock(), payload.getToBlock())
          break

        default:
          this._logger.warn(`Got unknown message type ${message.getType()}`)
      }
    })
    rpcStream.on('close', () => this._logger.info(`gRPC stream from server closed`))

    pool.on('peerready', (peer, addr) => {
      poolTimeout && clearTimeout(poolTimeout)
      poolTimeout = undefined
      this._logger.debug(`Connected to pool version: ${peer.version}, subversion: ${peer.subversion}, bestHeight: ${peer.bestHeight}, host: ${peer.host}`)

      const getForkBlock = new Messages().GetHeaders({
        starts: [BTC_BCH_FORK_INFO.forkBlock.hash],
        stop: BTC_BCH_FORK_INFO.secondBlockAfterFork.hash
      })
      peer.sendMessage(getForkBlock)
    })

    pool.on('peerdisconnect', (peer, addr) => {
      this._logger.debug(`Removing peer ${pathOr('', ['ip', 'v4'], addr)}:${addr.port}`)
      network.removePeer(peer)
    })

    pool.on('peererror', (peer, err) => {
      this._logger.debug(`Peer Error, err: ${errToString(err)}`)
      this._tryDisconnectPeer(peer)
    })
    pool.on('seederror', (err) => {
      this._logger.debug(`Seed Error, err: ${errToString(err)}`)
    })
    pool.on('peertimeout', (err) => {
      this._logger.debug(`Peer timeout, err ${errToString(err)}`)
    })
    pool.on('timeout', (err) => {
      this._logger.debug(`Timeout, err ${errToString(err)}`)
    })
    pool.on('error', (err) => {
      this._logger.debug(`Generic pool error, err ${errToString(err)}`)
    })

    // attach peer events
    pool.on('peerinv', (peer, message) => {
      try {
        this._logger.debug(`Peer INV: ${peer.version}, ${peer.subversion}, ${peer.bestHeight}, ${peer.host}`)
        if (peer.subversion !== undefined && isSatoshiPeer(peer)) {
          try {
            var peerMessage = new Messages().GetData(message.inventory)
            peer.sendMessage(peerMessage)
          } catch (err) {
            this._logger.debug('Error sending message', err)
            this._tryDisconnectPeer(peer)
          }
        }
      } catch (err) {
        this._logger.error(`Common peerinv handler error: ${errToString(err)}`, err)
      }
    })

    pool.on('peerblock', async (peer, _ref) => {
      const { block } = _ref

      this._logger.debug(`PeerBlock: ${peer.version}, ${peer.subversion} ${peer.bestHeight} ${peer.host}, network last block: ${network.bestHeight}`)

      if (!network.hasQuorum()) {
        this._logger.debug(`Got new block but we don't have quorum yet, peer count: ${network.discoveredPeers}`)
        return
      }

      if (network.bestHeight !== undefined && block.header.version === BLOCK_VERSION) {
        const [isNew, _block] = this._onNewBlock(block)
        if (!block.header.validProofOfWork()) {
          this._logger.warn(`Incoming block has invalid difficulty - rejecting the block and restaring rover to try to connect to valid peers`)
          process.exit(1)
        }
        if (isNew) {
          const unifiedBlock = await createUnifiedBlock(this._isStandalone, block, this._rpc.rover, _createUnifiedBlock)
          network.bestHeight = _block.blockNumber
          if (!this._isStandalone) {
            this._rpc.rover.collectBlock(unifiedBlock, (err, response) => {
              if (err) {
                this._logger.warn('RpcClient could not collect block')
              } else {
                this._logger.debug(`Collector Response: ${JSON.stringify(response.toObject(), null, 4)}`)
              }
            })
          } else {
            this._logger.debug(`Collected new BTC block: ${unifiedBlock.toObject()}`)
          }
        }
      } else if (peer !== undefined && peer.status !== undefined && peer.hash !== undefined && pool._connectedPeers[peer.hash] !== undefined) {
        try {
          pool._removeConnectedPeer(peer)
        } catch (err) {
          this._logger.error('Error removing peer', err)
        }
      }
    })

    pool.on('peerheaders', (peer, msg) => {
      const headers = msg.headers.map(({ hash, prevHash }) => ({ hash, prevHash }))

      if (!network.hasPeer(peer)) {
        let isBTCPeer = ((headers.filter(h => h.hash === BTC_BCH_FORK_INFO.firstBlockAfterFork.hash)).length > 0)
        if (!isBTCPeer) {
          this._tryDisconnectPeer(peer)
          return
        }

        if (network.hasQuorum()) {
          try {
            network.updateBestHeight()
            network.addPeer(peer)

            if (!this._hadQuorumAtLeastOnce) {
              this._hadQuorumAtLeastOnce = true

              if (BTC_BOOT_BLOCK) {
                this._logger.debug(`Fetching latest block (h: ${BTC_BOOT_BLOCK}) from network`)
                // see https://en.bitcoin.it/wiki/Protocol_documentation#getblocks
                const getLatestBlock = new Messages().GetBlocks({ starts: [BTC_BOOT_BLOCK], stop: BTC_GENESIS_HASH })
                setTimeout(() => this._sendToRandomPeers(getLatestBlock), ms('5s'))
              }
            }

            // initial sync was requested
            // no way how to sync specific amount of BTC blocks so lets sync from last received hash
            // till protcol limit (even if we need only ~440 blocks)
            if (this.initialSync) {
              const initialSyncBlocks = new Messages().GetBlocks({ starts: [headers[0].hash], stop: BTC_GENESIS_HASH })
              setTimeout(() => this._sendToRandomPeers(initialSyncBlocks), ms('10s'))
              this.initialSync = false
            }
          } catch (err) {
            this._logger.debug('Error in peerheaders cb', err)
          }
        } else if (!network.hasQuorum() && isSatoshiPeer(peer)) {
          try {
            network.addPeer(peer)
          } catch (err) {
            if (peer !== undefined && peer.status !== undefined) {
              peer.disconnect()
            }
          }
        } else {
          this._tryDisconnectPeer(peer)
        }
        return
      }

      // here we got headers from blocks manually requested by fetch_block or during boot
      // to a decision _requestedBlockHashes array we only store first.hash and last.hash
      // but we request first.prevHash - last.hash so that the reply actually includes block
      // with first.hash (if you request 2-6, you will only recieve 3-6)
      const requestHeaders = headers.slice(0, msg.headers.length - 1)
      // Store hashes to requested hashes to be able to track and save arriving blocks with height < bestHeight
      for (const h of requestHeaders) {
        this._logger.debug(`Is header ${h.hash} already requested?`)
        if (!contains(h.hash, this._requestedBlockHashes)) {
          this._logger.debug(`Requesting header ${h.hash}?`)
          this._requestedBlockHashes.push(h.hash)
        }
      }

      const firstHeader = headers[0]
      const lastHeader = headers[headers.length - 1]
      const peerMessage = new Messages().GetBlocks({ starts: [firstHeader.prevHash], stop: lastHeader.hash })
      peer.sendMessage(peerMessage)
    })

    let poolTimeout = setTimeout(function () {
      network.disconnect()
      network.connect()
    }, NETWORK_TIMEOUT)

    network.connect()

    setInterval(() => {
      this._logger.info(`peer count pool: ${pool.numberConnected()} dp: ${network.discoveredPeers}, sp: ${network.satoshiPeers}, q: ${network.hasQuorum()}, bh: ${network.bestHeight}`)
    }, 6 * 1000)
  }

  _onNewBlock (block): [boolean, Object] {
    const { hash } = block.header

    if (this._blockCache.has(hash)) {
      return [false, block]
    }

    this._blockCache.set(hash, true)

    const coinbaseTx = block.transactions[0]
    // TODO probably pull to utils
    const buffer = convBin(coinbaseTx.toString('hex'), { in: 'hex', out: 'buffer' })
    const deserializedCoinbaseTx = Transaction.deserialize(buffer)
    const blockNumber = deserializedCoinbaseTx.ins[0].script.getBlockHeight()

    // check if blockNumber >= last seen block or block hash was requested by fetch_block method
    if (blockNumber < this.network.bestHeight && !contains(hash, this._requestedBlockHashes)) {
      this._logger.info(`Block ${blockNumber} received but < best height: ${this.network.bestHeight}`)
      return [false, block]
    }

    if (this._blocksNumberCache.has(blockNumber) === true) {
      this._logger.warn('possible orphan conflict:  ' + blockNumber + ' ' + hash)
    } else {
      this._blocksNumberCache.set(blockNumber, true)
    }

    // this was a manually requested block, let's log it and remove from requested blocks
    if (contains(hash, this._requestedBlockHashes)) {
      this._logger.debug(`Fetched requested block ${blockNumber}, h: ${hash}`)
      this._requestedBlockHashes = without([hash], this._requestedBlockHashes)
    }

    block.transactions.forEach(tx => {
      this._onNewTx(tx, block)
    })
    block.blockNumber = blockNumber

    return [true, block]
  }

  _onNewTx (tx, block) {
    if (this._txCache.has(tx.hash)) {
      return
    }

    this._txCache.set(tx.hash, true)
    if (tx.isCoinbase() === true) {}
    // this._handleTx(tx);
  }

  // _handleTx (tx) {
  //   async.reduce(
  //     tx.outputs,
  //     {
  //       utxos: new Array(),
  //       keys: new Array(),
  //       amount: 0,
  //       n: 0
  //     },
  //     function (memo, out, next) {
  //       if (out.script.isPublicKeyHashOut()) {
  //         /// /db.get(out.script.toAddress(), function (err, result) {
  //         /// /  if (!(err)) {
  //         //    var key = new PrivateKey(result);
  //         //    memo.keys.push(key);
  //         //    var utxo = new Transaction.UnspentOutput({
  //         //      "txid" : tx.transaction.id,
  //         //      "vout" : memo.n,
  //         //      "address" : out.script.toAddress(),
  //         //      "script" : out.script,
  //         //      "satoshis" : out.satoshis,
  //         //      "output" : out
  //         //    });
  //         //    memo.utxos.push(utxo);
  //         //    memo.amount += out.satoshis;
  //         /// /  };
  //         //  memo.n++;
  //         //  next(null, memo);
  //         /// /});
  //       }
  //     },
  //     function (err, results) {}
  //   )
  // }
  //

  requestBlock (fromBlock: Block, toBlock: Block) { // now can be just a consecutive from-to hashes
    if (toBlock.getPreviousHash() === fromBlock.getHash()) {
      // we have nothing to do here, consecutive blocks
      this._logger.debug(`Nothing to do, sent blocks are consecutive`)
      return
    }
    if (toBlock.getHeight() - fromBlock.getHeight() > BTC_MAX_FETCH_BLOCKS) {
      this._logger.info(`Requested ${toBlock.getHeight() - fromBlock.getHeight()} (more than ${BTC_MAX_FETCH_BLOCKS}) to be fetched either node is starting or very stale / different btc chain BC block received, giving up`)
      return
    }
    // request headers first to have a whole list of headers to be fetched
    // with this list we are able to track if requested blocks where fetched
    const peerMessage = new Messages().GetHeaders({ starts: [fromBlock.getHash()], stop: toBlock.getHash() })
    this._sendToRandomPeers(peerMessage)
  }

  _sendToRandomPeers (message: Object, quorumFraction: number = 5): void { // should be one of GetHeaders, GetBlocks
    const peers = [].concat(Object.values(this.network.pool._connectedPeers))

    // select random floor(maximumPeers / quorumFraction)
    const askPeers = []
    const numChosen = Math.floor(peers.length / quorumFraction)
    for (var i = 0; i < numChosen; i++) {
      askPeers.push(randomChoiceMut(peers))
    }

    this._logger.debug(`Sending message ${message.command} to from ${numChosen} peers`)

    for (let peer of askPeers) {
      peer.sendMessage(message)
    }
  }

  close () {
    this.network.close()
  }
}
