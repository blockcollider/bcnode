/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @disable-flow
 */

const { Messages } = require('bitcore-p2p')
const { Transaction } = require('btc-transaction')
const LRUCache = require('lru-cache')
const convBin = require('binstring')
const process = require('process')
const logging = require('../../logger')

const { Block } = require('../../protos/block_pb');
const { RpcClient } = require('../../rpc')
const Network = require('./network').default
const { swapOrder } = require('../../utils/strings')

const NETWORK_TIMEOUT = 3000
const BLOCK_VERSION = 536870912

const config = require('../../../config/config')

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

    process.on('disconnect', function () {
      this._logger.info('parent exited')
      process.exit()
    })

    process.on('uncaughtError', function (e) {
      this._logger.error('Uncaught error', e)
      process.exit(3)
    })

    pool.on('peerready', (peer, addr) => {
      clearTimeout(poolTimeout)
      this._logger.info(`connected to pool version: ${peer.version}, subversion: ${peer.subversion}, bestHeight: ${peer.bestHeight}, host: ${peer.host}`)

      if (network.hasQuorum()) {
        try {
          network.lastBlock = network.setState()
          network.discoveredPeers++
          network.addPeer(peer)
        } catch (err) {
          this._logger.error('error in peerready cb', err)
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
      this._logger.debug(`removing peer ${peer}, ${addr}`)
      network.removePeer(peer)
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
        this._logger.info(`PeerINV: ${peer.version}, ${peer.subversion}, ${peer.bestHeight}, ${peer.host}`)
        if (peer.subversion !== undefined && peer.subversion.indexOf('/Satoshi:') > -1) {
          try {
            var peerMessage = new Messages().GetData(message.inventory)
            peer.sendMessage(peerMessage)
          } catch (err) {
            this._logger.error('error sening message', err)

            try {
              pool._removePeer(peer)
            } catch (err) {
              this._logger.error('error removing peer', err)
            }
          }
        }
      } catch (err) {
        this._logger.error('commoin peerinv handler error', err)
      }
    })

    pool.on('peerblock', (peer, _ref) => {
      const { block } = _ref

      this._logger.info('PeerBlock: ' + peer.version, peer.subversion, peer.bestHeight, peer.host)
      this._logger.info('peer best height submitting block: ' + peer.bestHeight)
      this._logger.info('LAST BLOCK ' + network.bestHeight)

      if (network.bestHeight !== undefined && block.header.version === BLOCK_VERSION) {
        block.lastBlock = network.bestHeight
        if (block.lastBlock !== undefined && block.lastBlock !== false) {
          const [isNew, _block] = this._onNewBlock(peer, block)

          if (isNew) {
            const unifiedBlock = this._createUnifiedBlock(_block)
            network.bestHeight = _block.blockNumber

            this._rpc.collector.collectBlock(unifiedBlock, (err, response) => {
              console.log('Collector Response:', response);
            });
          }
        }
      } else {
        try {
          pool._removePeer(peer)
        } catch (err) {
          this._logger.error('error removing peer', err)
        }
      }
    })

    setInterval(() => {
      this._logger.info('rover peers ' + pool.numberConnected())
    }, 60000)
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

  _createUnifiedBlock (block: Object) { // TODO specify block type
    // return {
    //   blockNumber: block.blockNumber,
    //   prevHash: swapOrder(block.header.prevHash.toString('hex')),
    //   blockHash: block.header.hash,
    //   root: block.header.merkleRoot,
    //   timestamp: block.header.time,
    //   nonce: block.header.nonce,
    //   version: block.header.version,
    //   difficulty: block.header.getDifficulty(),
    //   transactions: block.transactions.reduce((all, t) => {
    //     const tx = {
    //       txHash: t.hash,
    //       // inputs: t.inputs,
    //       // outputs: t.outputs,
    //       marked: false
    //     }
    //     all.push(tx)
    //     return all
    //   }, [])
    // }

    const msg = new Block()
    msg.setBlockchain('btc')
    msg.setHash(block.header.hash)

    return msg
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
