/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @disable-flow
 */

const { pathOr } = require('ramda')
const { Messages } = require('bitcore-p2p')
const { Transaction } = require('btc-transaction')
const LRUCache = require('lru-cache')
const convBin = require('binstring')
const process = require('process')
const logging = require('../../logger')

const { Block } = require('../../protos/core_pb')
const { RpcClient } = require('../../rpc')
const Network = require('./network').default
const { swapOrder } = require('../../utils/strings')
const { createUnifiedBlock } = require('../helper')

const NETWORK_TIMEOUT = 3000
const BLOCK_VERSION = 536870912

function _createUnifiedBlock (block: Object): Block { // TODO specify block type
  const msg = new Block()
  msg.setBlockchain('btc')
  msg.setHash(block.header.hash)
  msg.setPreviousHash(swapOrder(block.header.prevHash.toString('hex')))
  msg.setTimestamp(block.header.time * 1000)
  msg.setHeight(parseInt(block.blockNumber, 10))
  msg.setMerkleRoot(block.header.merkleRoot.toString('hex'))

  return msg
}

export default class Controller {
  constructor () {
    this._dpt = false
    this._interfaces = []
    this._logger = logging.getLogger(__filename)
    this._blockCache = new LRUCache({ max: 110 })
    this._blocksNumberCache = new LRUCache({ max: 110 })
    this._txCache = new LRUCache({ max: 3000 })

    this._rpc = new RpcClient()
  }

  get dpt () {
    return this._dpt
  }

  get interfaces () {
    return this._interfaces
  }

  init (config) {
    const network = new Network(config)
    this._interfaces.push(network)

    const pool = network.connect()
    const poolTimeout = setTimeout(function () {
      pool.disconnect().connect()
    }, NETWORK_TIMEOUT)

    process.on('disconnect', () => {
      this._logger.info('Parent exited')
      process.exit()
    })

    process.on('uncaughtError', (e) => {
      this._logger.error('Uncaught error', e)
      process.exit(3)
    })

    pool.on('peerready', (peer, addr) => {
      clearTimeout(poolTimeout)
      this._logger.debug(`Connected to pool version: ${peer.version}, subversion: ${peer.subversion}, bestHeight: ${peer.bestHeight}, host: ${peer.host}`)

      if (network.hasQuorum()) {
        try {
          network.lastBlock = network.setState()
          network.discoveredPeers++
          network.addPeer(peer)
        } catch (err) {
          this._logger.error('Error in peerready cb', err)
        }
      } else if (!network.hasQuorum() && peer.subversion.indexOf('/Satoshi:0.1') > -1) {
        try {
          network.discoveredPeers++
          network.addPeer(peer)
        } catch (err) {
          if (peer !== undefined && peer.status !== undefined) {
            peer.disconnect()
          }
        }
      } else {
        try {
          if (peer !== undefined && peer.status !== undefined) {
            peer.disconnect()
          }
        } catch (err) {
          this._logger.error('Could not disconnect from network', err)
        }
      }
    })

    pool.on('peerdisconnect', (peer, addr) => {
      this._logger.debug(`Removing peer ${pathOr('', ['ip', 'v4'], addr)}:${addr.port}`)
      try {
        network.removePeer(peer)
      } catch (e) {
        this._logger.warn(`Error while disconnecting peer ${peer.host}, ${addr}, ${e.message}`)
      }
    })

    pool.on('peererror', function (peer, err) {
      // log.error("Peer Error");
      // log.error(err);
    })

    pool.on('seederror', (err) => {
      this._logger.error('Seed Error', err)
    })
    pool.on('peertimeout', (err) => {
      this._logger.error('Seed Error', err)
    })
    pool.on('timeout', (err) => {
      this._logger.error('Seed Error', err)
    })
    pool.on('error', (err) => {
      this._logger.error('Seed Error', err)
    })

    // attach peer events
    pool.on('peerinv', (peer, message) => {
      try {
        this._logger.debug(`Peer INV: ${peer.version}, ${peer.subversion}, ${peer.bestHeight}, ${peer.host}`)
        if (peer.subversion !== undefined && peer.subversion.indexOf('/Satoshi:') > -1) {
          try {
            var peerMessage = new Messages().GetData(message.inventory)
            peer.sendMessage(peerMessage)
          } catch (err) {
            this._logger.error('Error sending message', err)

            try {
              pool._removePeer(peer)
            } catch (err) {
              this._logger.error('Error removing peer', err)
            }
          }
        }
      } catch (err) {
        this._logger.error('Common peerinv handler error', err)
      }
    })

    pool.on('peerblock', (peer, _ref) => {
      const { block } = _ref

      this._logger.debug('PeerBlock: ' + peer.version, peer.subversion, peer.bestHeight, peer.host)
      this._logger.debug('Peer best height submitting block: ' + peer.bestHeight)
      this._logger.debug('Last block' + network.bestHeight)

      if (network.bestHeight !== undefined && block.header.version === BLOCK_VERSION) {
        block.lastBlock = network.bestHeight
        if (block.lastBlock !== undefined && block.lastBlock !== false) {
          const [isNew, _block] = this._onNewBlock(peer, block)

          if (isNew) {
            const unifiedBlock = createUnifiedBlock(block, _createUnifiedBlock)
            network.bestHeight = _block.blockNumber
            this._rpc.rover.collectBlock(unifiedBlock, (err, response) => {
              if (err) {
                this._logger.warn('RpcClient could not collect block')
              } else {
                this._logger.debug(`Collector Response: ${JSON.stringify(response.toObject(), null, 4)}`)
              }
            })
          }
        }
      } else {
        try {
          pool._removePeer(peer)
        } catch (err) {
          this._logger.error('Error removing peer', err)
        }
      }
    })

    setInterval(() => {
      this._logger.info('Peers ' + pool.numberConnected())
    }, 60 * 1000)
  }

  _onNewBlock (height, block): [boolean, Object] {
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

    if (this._blocksNumberCache.has(blockNumber) === true) {
      this._logger.warn('possible orphan conflict:  ' + blockNumber + ' ' + hash)
    } else {
      this._blocksNumberCache.set(blockNumber, true)
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

  close () {
    this.interfaces.map((network) => network.close())
  }
}
