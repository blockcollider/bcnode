/*
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type Logger from 'winston'
const RocksDb = require('rocksdb')
const BN = require('bn.js')
const debug = require('debug')('bcnode:persistence:rocksdb')
const LRUCache = require('lru-cache')
// const Validator = require('../../script/validator')
// const BeamToJson = require('../../script/beamtojson')
const { blake2bl } = require('../utils/crypto')
const { networks } = require('../config/networks')
const { flatten, max, equals, is, toPairs } = require('ramda')
const { BcBlock, Block, BlockchainHeaders, BlockchainHeader, Transaction, MarkedTransaction, TransactionInput, TransactionOutput } = require('../protos/core_pb')
const { serialize, deserialize } = require('./codec')
const { getLogger } = require('../logger')
const { blockchainMapToList } = require('../mining/primitives')
const { isValidBlock } = require('../bc/validation')

const { ROVER_SECONDS_PER_BLOCK } = require('../rover/utils')

const SCHEDULE_OPERATORS = ['get', 'put', 'del', 'delfromlist']

type BlockBoundary = [string, [BlockchainHeader, BlockchainHeader]]

const BC_NETWORK = process.env.BC_NETWORK || 'main'
const EMBLEM_CONTRACT_ADDRESS = networks[BC_NETWORK].rovers.eth.embContractId

const isNotFoundError = (errStr: string) => /Error: NotFound: /.test(errStr)

const NRG_MINTED_PERISTENCE_KEY = 'bc.nrg.granted'

/**
 * Unified persistence interface
 */
export default class PersistenceRocksDb {
  _db: RocksDb // eslint-disable-line no-undef
  _isOpen: boolean // eslint-disable-line no-undef
  _logger: Logger
  _cache: LRUCache<string, any>

  constructor (location: string = '_data') {
    this._db = new RocksDb(location)
    this._isOpen = false
    this._logger = getLogger(__dirname)
    this._cache = LRUCache({
      max: 40000
    })
  }

  get db (): RocksDb {
    return this._db
  }

  get cache (): LRUCache<string, any> {
    return this._cache
  }

  get isOpen (): boolean {
    return this._isOpen
  }

  /**
   * Open database
   * @param opts
   */
  open (opts: Object = {}): Promise<*> {
    return new Promise((resolve, reject) => {
      this.db.open(opts, err => {
        if (err) {
          this._isOpen = false
          return reject(err)
        }

        this._isOpen = true
        return resolve(true)
      })
    })
  }

  /**
   * Close database
   */
  close (): Promise<*> {
    return new Promise((resolve, reject) => {
      this.db.close(err => {
        if (err) {
          return reject(err)
        }

        resolve(true)
      })
    })
  }

  /**
   * Put data into database
   * @param key
   * @param value
   * @param opts
   */
  put (key: string, value: any, opts: Object = {}): Promise<*> {
    debug('put()', key)

    let serialized
    try {
      serialized = serialize(value)
    } catch (e) {
      debug('put()', e)
      this._logger.warn(`Could not serialize key: ${key}, value: ${value.toObject ? value.toObject() : value}`)
      throw e
    }
    return new Promise((resolve, reject) => {
      this.db.put(key, serialized, opts, err => {
        if (err) {
          return reject(err)
        }

        return resolve(true)
      })
    })
  }

  /**
   * Get data from database
   * @param key
   * @param opts
   */
  get (key: string, opts: Object = { asBuffer: true }): Promise<Object|null> {
    debug('get()', key)

    if (Array.isArray(key)) {
      const msg = 'PersistenceRocksDb.get() for bulk gets is deprecated, use PersistenceRocksDb.getBulk() instead'
      this._logger.error(msg)
      return Promise.reject(new Error(msg))
    }

    return new Promise((resolve, reject) => {
      this.db.get(key, opts, (err, value) => {
        // we got error from Rocksdb underlying library
        if (err) {
          // it is 'not found error' -> resolve as null
          if (isNotFoundError(err.toString())) {
            this._logger.debug(`key: ${key} not found`)
            return resolve(null)
          }

          // TODO: inspect if could happen
          if (opts && opts.softFail) {
            return resolve(value)
          }

          // if other error occured, reject with it
          return reject(new Error(`${err.toString} while getting key: ${key}`))
        }

        try {
          // deserialization went ok -> resolve with deserialized value
          const deserialized = deserialize(value)
          return resolve(deserialized)
        } catch (e) {
          // deserialization failed and softFail requested -> resolve with null
          if (opts && opts.softFail === false) {
            return resolve(null)
          }

          // deserialization failed and no softFail -> reject with error
          return reject(new Error(`Could not deserialize value`))
        }
      })
    })
  }

  getBulk (key: string[], opts: Object = { asBuffer: true }): Promise<Array<Object>> {
    const promises = key.map((k) => {
      return this.get(k)
    })

    return Promise.all(promises.map((p) => p.catch(e => null)))
      .then((results) => {
        return Promise.all(results.filter(a => a !== null))
      })
  }

  putBulk (key: Array<*>, opts: Object = { asBuffer: true }): Promise<Array<Object>> {
    const valid = key.filter((k) => {
      if (k.length === 2) {
        return k
      }
    })
    const promises = valid.map((k) => {
      return this.put(k[0], k[1])
    })
    return Promise.all(promises.map((p) => p.catch(e => null)))
      .then((results) => {
        return Promise.all(results.filter(a => a !== null))
      })
  }

  /**
   * Sorts the given headers from lowest to highest
   * @param headers
   */
  sortChildHeaders (headers: Object[]): Object[] {
    return headers.sort((a, b) => {
      if (new BN(a.getHeight()).gt(new BN(b.getHeight())) === true) {
        return 1
      }
      if (new BN(a.getHeight()).lt(new BN(b.getHeight())) === true) {
        return -1
      }
      return 0
    })
  }
  /**
   * TODO: Turn this into optional condition
   * Write the child headers contained within a BC Block to disk
   * @param block BcBlock containing
   */
  async forcePutChildHeaders (block: BcBlock, opts: Object = {
    btc: true,
    neo: true,
    lsk: true,
    eth: true,
    wav: true
  }): Promise<*> {
    const headers = block.getBlockchainHeaders()
    return Promise.all([]
      .concat(this.sortChildHeaders(headers.getBtcList()).reverse()
        .map((b, i) => {
          if (opts.btc) {
            if (i < 1) {
              return this.put('btc.block.latest', b)
                .then(() => {
                  return this.put('btc.block.' + b.getHeight(), b)
                })
            }
            return this.put('btc.block.' + b.getHeight(), b)
          }
        }))
      .concat(this.sortChildHeaders(headers.getEthList()).reverse()
        .map((b, i) => {
          if (opts.eth) {
            if (i < 1) {
              return this.put('eth.block.latest', b)
                .then(() => {
                  return this.put('eth.block.' + b.getHeight(), b)
                })
            }
            return this.put('eth.block.' + b.getHeight(), b)
          }
        }))
      .concat(this.sortChildHeaders(headers.getNeoList()).reverse()
        .map((b, i) => {
          if (opts.neo) {
            if (i < 1) {
              return this.put('neo.block.latest', b)
                .then(() => {
                  return this.put('neo.block.' + b.getHeight(), b)
                })
            }
            return this.put('neo.block.' + b.getHeight(), b)
          }
        }))
      .concat(this.sortChildHeaders(headers.getLskList()).reverse()
        .map((b, i) => {
          if (opts.lsk) {
            if (i < 1) {
              return this.put('lsk.block.latest', b)
                .then(() => {
                  return this.put('lsk.block.' + b.getHeight(), b)
                })
            }
            return this.put('lsk.block.' + b.getHeight(), b)
          }
        }))
      .concat(this.sortChildHeaders(headers.getLskList()).reverse()
        .map((b, i) => {
          if (opts.wav) {
            if (i < 1) {
              return this.put('wav.block.latest', b)
                .then(() => {
                  return this.put('wav.block.' + b.getHeight(), b)
                })
            }
            return this.put('wav.block.' + b.getHeight(), b)
          }
        }))
    )
  }

  /**
   * Write the child headers contained within a BC Block to disk
   * @param block BcBlock containing
   */
  async putChildHeaders (block: BcBlock, opts: Object = {
    btc: true,
    neo: true,
    lsk: true,
    eth: true,
    wav: true
  }): Promise<*> {
    const headers = block.getBlockchainHeaders()
    // const table = {}
    return Promise.all([]
      // restrict to sequence only
      .concat(this.sortChildHeaders(headers.getBtcList())
        .map((b) => {
          if (opts.btc) {
            return (async () => {
              try {
                let latest = await this.get('btc.block.latest')
                if (b.getHeight() > latest.getHeight()) {
                  return Promise.all([
                    this.put('btc.block.latest', b),
                    this.put('btc.block.' + b.getHeight(), b)
                  ])
                } else {
                  return this.put('btc.block.' + b.getHeight(), b)
                }
              } catch (e) {
                return Promise.all([
                  this.put('btc.block.latest', b),
                  this.put('btc.block.' + b.getHeight(), b)
                ])
              }
            })()
          }
          return Promise.resolve(true)
        }))
      .concat(this.sortChildHeaders(headers.getEthList())
        .map((b) => {
          if (opts.eth) {
            return (async () => {
              try {
                const latest = await this.get('eth.block.latest')
                if (b.getHeight() > latest.getHeight()) {
                  return Promise.all([
                    this.put('eth.block.latest', b),
                    this.put('eth.block.' + b.getHeight(), b)
                  ])
                } else {
                  return this.put('eth.block.' + b.getHeight(), b)
                }
              } catch (e) {
                return Promise.all([
                  this.put('eth.block.latest', b),
                  this.put('eth.block.' + b.getHeight(), b)
                ])
              }
            })()
          }
          return Promise.resolve(true)
        }))
      .concat(this.sortChildHeaders(headers.getWavList())
        .map((b) => {
          if (opts.wav) {
            return (async () => {
              try {
                const latest = await this.get('wav.block.latest')
                if (b.getHeight() > latest.getHeight()) {
                  return Promise.all([
                    this.put('wav.block.latest', b),
                    this.put('wav.block.' + b.getHeight(), b)
                  ])
                } else {
                  return this.put('wav.block.' + b.getHeight(), b)
                }
              } catch (e) {
                return Promise.all([
                  this.put('wav.block.latest', b),
                  this.put('wav.block.' + b.getHeight(), b)
                ])
              }
            })()
          }
          return Promise.resolve(true)
        }))
      .concat(this.sortChildHeaders(headers.getLskList())
        .map((b) => {
          if (opts.lsk) {
            return (async () => {
              try {
                const latest = await this.get('lsk.block.latest')
                if (b.getHeight() > latest.getHeight()) {
                  return Promise.all([
                    this.put('lsk.block.latest', b),
                    this.put('lsk.block.' + b.getHeight(), b)
                  ])
                } else {
                  return this.put('lsk.block.' + b.getHeight(), b)
                }
              } catch (e) {
                return Promise.all([
                  this.put('lsk.block.latest', b),
                  this.put('lsk.block.' + b.getHeight(), b)
                ])
              }
            })()
          }
          return Promise.resolve(true)
        }))
      .concat(this.sortChildHeaders(headers.getNeoList())
        .map((b) => {
          if (opts.neo) {
            return (async () => {
              try {
                const latest = await this.get('neo.block.latest')
                if (b.getHeight() > latest.getHeight()) {
                  return Promise.all([
                    this.put('neo.block.latest', b),
                    this.put('neo.block.' + b.getHeight(), b)
                  ])
                } else {
                  return this.put('neo.block.' + b.getHeight(), b)
                }
              } catch (e) {
                return Promise.all([
                  this.put('neo.block.latest', b),
                  this.put('neo.block.' + b.getHeight(), b)
                ])
              }
            })()
          }
          return Promise.resolve(true)
        }))
    ).then((c) => {
      if (c !== undefined) {
        this._logger.debug('synchronized child headers: ' + c.length)
      }
      return Promise.resolve(true)
    }).catch((err) => {
      return Promise.reject(err)
    })
  }
  async stepFrom (blockchain: string, start: number, opts: Object = { highWaterMark: 100000000, asBuffer: true }): Promise<?number> {
    return new Promise((resolve, reject) => {
      const cycle = async (n) => {
        try {
          await this.get(blockchain + '.' + n)
          return cycle(n + 1)
        } catch (err) {
          this._logger.debug(err)
          return resolve(n - 1)
        }
      }
      return cycle(start)
    })
  }

  /**
   * Removes blocks stored in persistence that match a given blockchain
   * @param blockchain string
   * @param start Number
   * @param start Number
   * @param opts
   */
  flushFrom (blockchain: string, start: number = 2, until: number = 0, opts: Object = { highWaterMark: 100000000, asBuffer: true }): Promise<?boolean> {
    let count = 0
    return new Promise((resolve, reject) => {
      const iter = this.db.iterator(opts)
      const cycle = () => {
        return iter.next((err, key) => {
          if (key !== undefined) {
            count++
          }
          this._logger.info('---------------------' + key)
          if (err) {
            return reject(err)
          } else if (key !== undefined && key.indexOf(blockchain) > -1) {
            // default is to flush continuously unless until is defined
            let pass = true
            if (until > 0) {
              if (key.indexOf('.') > -1 && key.split('.').pop() < until) {
                pass = true
              } else {
                pass = false
              }
            }
            if (pass) {
              if (Number(key.split('.').pop()) > start) {
                return this.del(key).then(cycle).catch((e) => {
                  return reject(err)
                })
              }
            }
            return cycle()
          } else if (key !== undefined) {
            return cycle()
          } else {
            this._logger.info('flushed ' + count + ' of ' + blockchain)
            return resolve(true)
          }
        })
      }
      return cycle()
    })
  }

  /**
   * Write pending values to perminent values
   * @param blockchain string
   * @param opts
   */
  putPending (blockchain: string = 'bc', opts: Object = { highWaterMark: 100000000, asBuffer: true }): Promise<?boolean> {
    return new Promise((resolve, reject) => {
      const iter = this.db.iterator(opts)
      const cycle = () => {
        return iter.next((err, key) => {
          if (err) {
            return reject(err)
          } else if (key !== undefined && key.indexOf('pending.' + blockchain) > -1) {
            return this.get(key)
              .then((res) => {
                const stringKey = key.replace('pending.', '')
                this._logger.info(stringKey)
                return this.put(stringKey, res).then(cycle)
                  .catch((err) => {
                    return reject(err)
                  })
              })
              .catch((err) => {
                return reject(err)
              })
          }
        })
      }
      return cycle()
    })
  }

  /**
   * Delete data from database
   * @param key
   * @param opts
   */
  del (key: string, opts: Object = {}): Promise<*> {
    debug('del()', key)

    return new Promise((resolve, reject) => {
      this.db.del(key, opts, err => {
        if (err) {
          return reject(err)
        }

        resolve(true)
      })
    })
  }

  async getBlockBoundariesToFetch (headers: BlockchainHeaders): Promise<bool|Array<BlockBoundary>> {
    let headerList
    try {
      headerList = blockchainMapToList(headers)
    } catch (_) {
      return false
    }
    const boundaries = {
      'btc': [],
      'eth': [],
      'lsk': [],
      'neo': [],
      'wav': []
    }

    const TOO_OLD_LATEST_THRESHOLD = 10 * 60 * 1000 // 2 minutes

    for (const header of headerList) {
      const chain = header.getBlockchain()
      const height = header.getHeight()
      try {
        // check if we have this block
        await this.get(`${chain}.block.${height}`)
        continue
      } catch (_) {
        let from, to, chainLatest
        // we dont have it // TODO check error type
        try {
          chainLatest = await this.get(`${chain}.block.latest`)
        } catch (_) {
          // we don't have chain latest - let's postpone the check because we can't do anything now
          continue
        }

        // our latest block is older than 2 minutes from this header - probably starting
        if ((header.getTimestamp() - chainLatest.getTimestamp()) > TOO_OLD_LATEST_THRESHOLD) {
          this._logger.debug(`Requested to fetch header older than 10 minutes`)
          continue
        }
        // our latest rovered is lower
        if (chainLatest.getHeight() < height) {
          const [previousFrom, previousTo] = boundaries[chain]

          if (!previousFrom || previousFrom.getHeight() > chainLatest.getHeight()) {
            from = chainLatest
          }

          if (!previousTo || header.getHeight() > previousTo.getHeight()) {
            to = header
          }

          boundaries[chain] = [from, to]
          continue
        } else {
          // find nearest lower we have
          let nearestLower, nearestHigher

          let candidateHeight = header.getHeight() - 1
          while (!nearestLower) {
            try {
              nearestLower = await this.get(`${chain}.block.${candidateHeight}`)
            } catch (_) {
              // TODO handle errors different than not found
              candidateHeight--
            }
          }

          candidateHeight = header.getHeight() + 1
          while (!nearestHigher) {
            try {
              nearestHigher = await this.get(`${chain}.block.${candidateHeight}`)
            } catch (_) {
              // TODO handle errors different than not found
              candidateHeight++
            }
          }

          const [previousFrom, previousTo] = boundaries[chain]

          if (!previousFrom || previousFrom.getHeight() > nearestLower.getHeight()) {
            from = nearestLower
          }

          if (!previousTo || nearestHigher.getHeight() > previousTo.getHeight()) {
            to = nearestHigher
          }

          boundaries[chain] = [from, to]
          continue
        }
      }
    }

    // now we have boundaries for each chain, just filter them for empty cases
    return toPairs(boundaries).filter(([chain, [from, to]]) => {
      return from !== undefined && to !== undefined
    })
  }

  async isValidBlockCached (newBlock: BcBlock, opts: { fullBlock: boolean } = { fullBlock: true }): Promise<boolean> {
    try {
      if (new BN(newBlock.getHeight()).lt(new BN(151500)) === true) {
        return Promise.resolve(true)
      }
      const cached = await this.get('valid_' + newBlock.getHash())
      // if of type: string 'false' it means the block is invalid
      return Promise.resolve(cached)
    } catch (_) {
      try {
        const valid = isValidBlock(newBlock, opts)
        await this.put('valid_' + newBlock.getHash(), valid)
        // return this block in wrhatever state it was validated
        return Promise.resolve(valid)
      } catch (err) {
        // error attempting to parse this as a block, reject
        this._logger.error(err)
        return Promise.resolve(false)
      }
    }
  }

  /**
   * Get transaction by it's hash
   * @param hash string
   * @param blockchain string
   */
  async getTransactionByHash (txHash: string, blockchain: string = 'bc', opts: Object = { asBuffer: true }): Promise<Transaction|false> {
    const key = `${blockchain}.tx.${txHash}` // TODO do we want the prefix? -> yes, because of chains that fork (ETC has hashes that ETH also has)
    try {
      const tx = await this.get(key, { asBuffer: true, softFail: true })
      return tx
    } catch (err) {
      this._logger.error(err)
      return false
    }
  }

  /**
   * Add outpoint claim from input, return false if claim cannot be made and tx is invalid
   * @param txInput TransactionInput
   * @param txHash string Hash of the transaction containing the input
   * @param blockchain string
   */
  async putOutPointClaim (txInput: TransactionInput, txHash: string, blockchain: string = 'bc', opts: Object = { asBuffer: true, force: false }): Promise<boolean> {
    const outpoint = txInput.getOutPoint()
    const key = `${blockchain}.op.${outpoint.getHash()}.${outpoint.getIndex()}`
    try {
      // if this query returns a transaction hash the outpoint has been spent
      const claim = await this.get(key, opts)
      if (claim !== undefined && claim !== false) {
        await this.put(key, txHash, opts)
        return Promise.resolve(true) // outpoint is now spent, miner will not accept tx spending this output until transactions have been cleaned
      } else {
        return Promise.resolve(false) // outpoint is spent
      }
    } catch (err) {
      this._logger.error(err)
      return Promise.resolve(false)
    }
  }

  /**
   * Remove outpoint claim by input, return true if claim existed otherwise false if claim
   * @param txInput TransactionInput
   * @param txHash string Hash of the transaction containing the input unlink from outpoint
   * @param blockchain string
   */
  async delOutPointClaim (txInput: TransactionInput, txHash: string, blockchain: string = 'bc', opts: Object = { asBuffer: true }): Promise<boolean> {
    const outpoint = txInput.getOutPoint()
    const key = `${blockchain}.op.${outpoint.getHash()}.${outpoint.getIndex()}`
    try {
      // if this query returns a transaction hash the outpoint has been spent
      const claims = await this.get(key, opts)
      if (claims !== undefined && claims !== false && claims !== null && claims.length < 1) {
        return Promise.resolve(false) // outpoint claim did not exist to remove
      } else if (claims.indexOf(txHash) > -1) {
        // TSR: triggers tx panel threshold calculation
        // remove the tx hash of the input claiming the outpoint
        claims.splice(claims.indexOf(txHash), 1)
        // if the claims are now 0 for this outpoint delete the reference key
        if (claims.length < 1) {
          await this.del(key, opts)
        }
        return Promise.resolve(true) // outpoint claim removed
      } else {
        return Promise.resolve(false) // outpoint claim did not exist to remove
      }
    } catch (err) {
      this._logger.error(err)
      return Promise.resolve(false)
    }
  }

  /**
   * Remove the transaction and any spent outpoints
   * @param tx Transaction
   * @param blockchain string
   */
  async delTransaction (tx: Transaction|MarkedTransaction|string, branch: number = 0, blockchain: string = 'bc', opts: Object = { asBuffer: true, force: false }): Promise<boolean> {
    // remove blockchain.tx.txhash
    // remove blockchain.op.txHash.index[] (outpoints) delOutPointClaim
    try {
      if (is(String, tx)) {
        tx = await this.getTransactionByHash(tx, blockchain)
        if (!tx) {
          // transaction does not exist on dist
          return Promise.resolve(false)
        }
      }
      const txKey = `${blockchain}.tx.${tx.getHash()}`
      // determine if transaction is marked or from Block Collider / Super Collider
      await this.del(txKey, opts)
      if (tx.getInputsList === undefined) { // transaction is marked
        return Promise.resolve(true)
      } else {
        if (branch !== undefined && branch === 0) {
          // remove claims on outputs
          await Promise.all(tx.getInputsList().map((input) => {
            return this.delOutPointClaim(input, tx, blockchain)
          }))
        }
        return Promise.resolve(true)
      }
    } catch (err) {
      this._logger.error(err)
      return Promise.resolve(false)
    }
  }

  async getNrgMintedSoFar (): number|null {
    return this.get(NRG_MINTED_PERISTENCE_KEY)
  }

  async setNrgMintedSoFar (nrg: number) {
    await this.put(NRG_MINTED_PERISTENCE_KEY, nrg)
  }

  /**
   * Put transaction data on disk
   * @param tx Transaction
   * @param blockHash string
   * @param branch Number
   */
  async putTransaction (tx: Transaction|MarkedTransaction, blockHash: string, branch: number = 0, blockchain: string = 'bc', opts: Object = { asBuffer: true, force: false }): Promise<boolean> {
    // if blockchain specified for transaction
    if (tx.getId !== undefined) {
      blockchain = tx.getId()
    }
    const key = `${blockchain}.tx.${tx.getHash()}`
    try {
      const indexedTx = await this.putTransactionBlockIndex(tx.getHash(), blockHash, branch, blockchain, { softFail: true })
      if (indexedTx !== undefined && indexedTx !== false) {
        await this.put(key, tx, opts)
        // check if it's a marked transaction if not confirm the spendability of outpoints
        if (tx.getTransactionInputsList !== undefined) {
          if (opts.force === true) {
            await Promise.all(tx.getTransactionInputsList().map((txInput) => {
              return this.putOutPointClaim(txInput, tx.getHash(), blockchain, opts)
            }))
            // if branch is 0 it is a main branch update
          } else if (branch !== undefined && branch === 0) {
            const availability = await Promise.all(tx.getTransactionInputsList().map((txInput) => {
              return this.putOutPointClaim(txInput, tx.getHash(), blockchain, opts)
            }))
            const status = availability.every((op) => {
              return op === true
            })
            if (status === undefined || status === false) {
              return Promise.reject(new Error('transaction inputs attempting to spend already spent outpoints'))
            }
          }
          // check if the transaction is op_makercoll and set necessary address watch
          // const txOutputs = tx.getTransactionOutputsList()
          // const markedOperations = txOutputs.reduce((all, out) => {
          //   const script = out.getOutputScript().toString('hex')
          //   all = all.concat(Validator.includesMarkedTxs(script))
          //   return all
          // }, [])
          // for (let i = 0; i < markedOperations.length; i++) {
          //   if (markedOperations[i].opCode === 'OP_MAKERCOLL') {
          //      BeamToJson.toJSON('OP_MAKERCOLL', markedOperations[i])
          //   }
          // }
        }
      } else {
        this._logger.error(new Error('unable to index tx'))
        return Promise.resolve(false)
      }
      return Promise.resolve(true)
    } catch (err) {
      this._logger.error(err)
      return Promise.resolve(false)
    }
  }

  /**
   * Store of valid block headers from Block Collider or connected chains, block must not be on disk
   * @param hash BcBlock
   * @param height
   * @param blockchain string
   */
  async putBlockHashAtHeight (blockHash: string, height: string|number, blockchain: string = 'bc', opts: Object = { asBuffer: true }): Promise<boolean> {
    const key = `${blockchain}.height.${height}`
    try {
      await this.runScheduledOperations(height, blockchain, opts)
      let hashes = await this.get(key, opts)
      if (!hashes) {
        hashes = []
      }
      if (hashes.indexOf(blockHash) > -1) {
        // block already exists at height
        return true
      }
      hashes.push(blockHash)
      await this.put(key, hashes, opts)
      return true
    } catch (err) {
      this._logger.error(err)
      return false
    }
  }

  /**
   * Delete block hash from height
   * @param height number
   * @param blockchain string
   * @param hash string
   */
  async delHashAtHeight (height: number, blockchain: string, hash: string, opts: Object = { asBuffer: true }): Promise<boolean> {
    const key = `${blockchain}.height.${height}`
    try {
      let hashes = await this.get(key, opts)
      if (!hashes) {
        hashes = []
      }
      if (hashes.indexOf(hash) < 0) {
        return true
      }
      hashes = hashes.splice(hashes.indexOf(hash), 1)
      return this.put(key, hashes, opts)
    } catch (err) {
      this._logger.error(err)
      return Promise.resolve(false)
    }
  }

  /**
   * Associates the transaction with a block. Used for both side branch and main branch chains.
   * @param tx string
   * @param blockHash string
   * @param blockchain string
   */
  async putTransactionBlockIndex (txHash: string, blockHash: string, branch: number = 0, blockchain: string = 'bc', opts: Object = { asBuffer: true }): Promise<boolean> {
    const key = `${blockchain}.txs.${blockHash}`
    try {
      let hashes = await this.get(key, { asBuffer: true, softFail: true })
      if (hashes === false || hashes === null) {
        hashes = []
      } else if (hashes.indexOf(txHash) > -1) {
        return Promise.resolve(true)
      }
      hashes.push(txHash)
      // assign a block hash to a tx
      const txBlockKey = `${blockchain}.txblock.${txHash}`
      await this.put(txBlockKey, `${blockchain}.block.${blockHash}`)
      await this.put(key, hashes, opts)
      return Promise.resolve(true)
    } catch (_) {
      const txBlockKey = `${blockchain}.txblock.${txHash}`
      await this.put(txBlockKey, `${blockchain}.block.${blockHash}`)
      await this.put(key, [txBlockKey], opts)
      return Promise.resolve(true)
    }
  }

  /**
   * Put block by it's hash and chain id. Also stores transactions if possible
   * @param block BcBlock
   * @param blockchain string
   */
  async putBlock (block: BcBlock|Block, branch: number = 0, blockchain: string = 'bc', opts: Object = { asBuffer: true }): Promise<boolean> {
    if (block.getBlockchain !== undefined) {
      blockchain = block.getBlockchain()
    }
    if (block.getHash === undefined) {
      this._logger.err(new Error('putBlock(): malformed block submission without hash'))
      return Promise.resolve(false)
    }
    // check scheduled events
    const key = `${blockchain}.block.${block.getHash()}`
    debug(`putBlock(): storing ${key}`)
    try {
      await this.runScheduledOperations(new BN(block.getHeight()).toNumber(), blockchain, opts)
      // OPTIMIZE we should remove block.txs after creating txs promises array not to store TXs twice (once with block and once separately)
      if (block.getTxsList !== undefined) {
        const txs = block.getTxsList().map((tx) => { return tx.getHash() })
        // header blocks pulled from bc blocks
        const headersMap = block.getBlockchainHeaders()
        const headers = Object.keys(headersMap.toObject()).reduce((all, listName) => {
          const getMethodName = `get${listName[0].toUpperCase()}${listName.slice(1)}`
          const chainHeaders = headersMap[getMethodName]()
          all = all.concat(chainHeaders)
          return all
        }, [])

        debug(`putBlock(): storing ${key} as BC`)
        await this.updateMarkedBalances(block, blockchain) // update the marked address balances
        await this.put(key, block)
        await this.put(`${blockchain}.block.${block.getHeight()}`, block)
        await this.putBlockHashAtHeight(block.getHash(), block.getHeight(), blockchain)
        await this.put(`${blockchain}.txs.${block.getHash()}`, txs) // bulk updates the txs of this block hash
        await Promise.all([].concat(
          block.getTxsList().map(tx => this.putTransaction(tx, block.getHash()))
        ).concat(
          headers.map(header => this.putBlock(header))
        ))
        if (branch !== undefined && branch === 0) {
          // block is considered a part of main branch so fixed height is stored
          await this.put(`${blockchain}.block.${block.getHeight()}`, block) // TODO: This adds unecessary block
        }
        return Promise.resolve(true)
      } else {
        // the block is a child block not of type BcBlock
        const txs = block.getMarkedTxsList().map((tx) => { return tx.getHash() })
        await this.putBlockHashAtHeight(block.getHash(), block.getHeight(), blockchain)
        await this.put(`${blockchain}.txs.${block.getHash()}`, txs) // bulk updates the txs of this block hash
        await this.put(key, block)
        return Promise.all([].concat(
          block.getMarkedTxsList().reduce((all, tx) => {
            all.push(this.putTransaction(tx.getHash(), block.getHash(), branch, blockchain))
            return all
          }, [])
        )).then(allResults => {
          // TODO should do something with result
          return Promise.resolve(true)
        }).catch((err) => {
          this._logger.error(err)
          return Promise.resolve(false)
        })
      }
    } catch (err) {
      this._logger.error(err)
      return Promise.resolve(false)
    }
  }

  /**
   * Whenever a BcBlock is deleted reset marked transactions table to the most recent mod 3000 block height
   * @param block BcBlock
   */
  async resetMarkedBalancesFromBlock (block: BcBlock, blockchain: string = 'bc', opts: Object = { asBuffer: true }): Promise<boolean> {
    const mod = new BN(block.getHeight()).mod(new BN(3000))
    // delete the snap shot as well if mod 3000 === 0
    if (new BN(0).eq(mod) === true) {
      await this.del(`${blockchain}.marked.latest.snapshot`)
      await this.del(`${blockchain}.marked.balances.snapshot`)
      await this.del(`${blockchain}.marked.latest`)
      await this.del(`${blockchain}.marked.balances`)
      return Promise.resolve(true)
    // if there are less than 3000 blocks there is no marked transaction to reset
    } else if (new BN(block.getHeight()).lt(new BN(3000))) {
      return Promise.resolve(true)
    } else {
      try {
        const latestSnapshot = await this.get(`${blockchain}.marked.latest.snapshot`)
        const balancesSnapshot = await this.get(`${blockchain}.marked.balances.snapshot`)
        await this.put(`${blockchain}.marked.latest`, latestSnapshot)
        await this.put(`${blockchain}.marked.balances`, balancesSnapshot)
        return true
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
  /**
   * Gets the balance of a marked token from a given chain
   * @param address string
   * @param tokenAddress string
   * @param connectedChain string the connected chain for Emblems is Ethereum
   * @param blockchain string
   */
  async getMarkedBalanceData (address: string, tokenAddress: string = EMBLEM_CONTRACT_ADDRESS, connectedChain: string = 'eth', blockchain: string = 'bc', opts: Object = { asBuffer: true }): Promise<BN> {
    const balances = await this.get(`${blockchain}.marked.balances`)
    if (!balances) {
      return new BN(0)
    }
    if (balances[connectedChain] === undefined) {
      return new BN(0)
    }
    if (balances[connectedChain][tokenAddress] === undefined) {
      return new BN(0)
    }
    if (balances[connectedChain][tokenAddress][address] === undefined) {
      return new BN(0)
    }
    return new BN(balances[connectedChain][tokenAddress][address])
  }

  /**
   * Run any operations scheduled at block height and delete
   * @param height {number} block height
   * @param blockchain {string} value of data
   */
  async runScheduledOperations (height: number|string, blockchain: string = 'bc', opts: Object = { asBuffer: true }): Promise<boolean> {
    let scheduledOperations = await this.get(`${blockchain}.schedule.${height}`)
    if (!scheduledOperations || !Array.isArray(scheduledOperations)) {
      return Promise.resolve(true)
    }

    for (let i = 0; i < scheduledOperations.length; i++) {
      if (scheduledOperations[i].length >= 4) {
        let operation = scheduledOperations[1]
        let key = scheduledOperations[2]
        // if the operation has a value sdf
        if (scheduledOperations[i].length === 5) {
          let value = scheduledOperations[3]
          // check if the operation is a delfromlist
          if (operation !== 'delfromlist') {
            await this[operation](key, value)
          } else {
            const data = await this.get(key)
            const update = data.reduce((all, d) => {
              if (!equals(d, value)) {
                all.push(d)
              }
              return all
            }, [])
            if (update.length === 0) {
              await this.del(key)
            } else {
              await this.put(key, update)
            }
          }
        } else {
          await this[operation](key)
        }
      }
    }
    return Promise.resolve(true)
  }

  /**
   * Adds simple database operation to be conducted at a block height
   * @param height {number} block height
   * @param operation {string} type of operation get, put, del
   * @param key {string} key of data
   * @param value {string} value of data
   * @param blockchain {string} value of data
   */
  async scheduleAtBlockHeight (height: number, operation: string, key: string, value: any = '', blockchain: string = 'bc', opts: Object = { asBuffer: true }): Promise<boolean> {
    const refKey = `${blockchain}.schedule.${height}`
    let scheduledOperations = await this.get(refKey)
    if (!scheduledOperations || !Array.isArray(scheduledOperations)) {
      scheduledOperations = []
    }
    // check if the given operation is supported
    if (SCHEDULE_OPERATORS[operation] === undefined) {
      return Promise.resolve(false)
    }
    let eventArgs = [height, operation, key, value, blockchain]
    // if the value is empty or default do not store in the schedule
    if (value === '') {
      eventArgs = [height, operation, key, blockchain]
    }
    const uniqueKey = blake2bl(eventArgs.join(''))
    const restrictedSet = scheduledOperations.map((s) => {
      return blake2bl(s.join(''))
    })
    if (restrictedSet.indexOf(uniqueKey) > -1) {
      return Promise.resolve(true)
    }
    scheduledOperations.push(eventArgs)
    await this.put(refKey, eventArgs)

    return Promise.resolve(true)
  }

  /**
   * Updates the table of balances for all marked transactions from connected chains
   * @param block BcBlock
   * @param blockchain string
   */
  async updateMarkedBalances (block: BcBlock, blockchain: string = 'bc', opts: Object = { asBuffer: true }): Promise<boolean> {
    const providedBlockHeight = block.getHeight()
    let currentBlockIndex = 1
    let balances = {}
    // checks bc.marked.latest and bc.marked.balances keys in rocksdb
    // look up the last block indexed with  marked transactions in context of given blockchain
    const latestMarkedBlock = await this.get(`${blockchain}.marked.latest`)
    const headersMap = block.getBlockchainHeaders()

    if (!latestMarkedBlock) {
      // if no marked transaction scan has been run set height to the provided block
      for (let listName of Object.keys(headersMap.toObject())) {
        balances[listName.slice(0, 3)] = {}
      }
    } else if (new BN(providedBlockHeight).eq(latestMarkedBlock.getHeight())) {
      // already added marked balances for this block
      balances = await this.get(`${blockchain}.marked.balances`)
      return JSON.parse(balances) // FIXME introduce new protobuf message for this
    } else {
      currentBlockIndex = latestMarkedBlock.getHeight()
      balances = JSON.parse(await this.get(`${blockchain}.marked.balances`))
      if (!balances) {
        balances = {}
        // if this occurs marked database is corrupt reset
        currentBlockIndex = 1
        for (let listName of Object.keys(headersMap.toObject())) {
          balances[listName.slice(0, 3)] = {}
        }
      }
    }

    for (let i = currentBlockIndex; i <= providedBlockHeight; i++) {
      try {
        const blockFrame: Block|BcBlock = await this.get(`${blockchain}.block.${i}`)
        const frameHeaders = blockFrame.getBlockchainHeaders()
        Object.keys(frameHeaders.toObject()).map(listName => {
          const method = `get${listName[0].toUpperCase()}${listName.slice(1)}`
          const connectedBlockHeaders = frameHeaders[method]()
          const chain = listName.slice(0, 3)
          const txs = [].concat(...connectedBlockHeaders.map(header => header.getMarkedTxsList()))
          for (let tx of txs) {
            // The default token address is EMB
            if (balances[chain] === undefined) {
              balances[chain] = {}
            }
            if (balances[chain][tx.getToken()] === undefined) {
              balances[chain][tx.getToken()] = {}
            }
            // if it is from address SUBTRACT the total balance
            if (balances[chain][tx.getToken()][tx.getAddrFrom()] === undefined) {
              balances[chain][tx.getToken()][tx.getAddrFrom()] = '0'
            }

            if (balances[chain][tx.getToken()][tx.getAddrTo()] === undefined) {
              balances[chain][tx.getToken()][tx.getAddrTo()] = '0'
            }
            balances[chain][tx.getToken()][tx.getAddrFrom()] = new BN(balances[chain][tx.getToken()][tx.getAddrFrom()]).sub(new BN(tx.getValue())).toString()
            balances[chain][tx.getToken()][tx.getAddrTo()] = new BN(balances[chain][tx.getToken()][tx.getAddrTo()]).add(new BN(tx.getValue())).toString()
          }
        })
        // assign the latest marked transaction height
        await this.put(`${blockchain}.marked.latest`, block)
        // update the balances stored on disk
        await this.put(`${blockchain}.marked.balances`, JSON.stringify(balances))
        // store a snapshot every 3000 blocks
        if (new BN(block.getHeight()).mod(new BN(3000)).eq(new BN(0)) === true) {
          await this.put(`${blockchain}.marked.latest.snapshot`, block)
          await this.put(`${blockchain}.marked.balances.snapshot`, JSON.stringify(balances))
        }
      } catch (err) {
        return Promise.reject(err)
      }
    }
    return true
  }

  /**
   * Remove the block often used to remove stale orphans
   * @param hash string
   * @param blockchain string
   */
  async delBlock (hash: string|BcBlock|Block, branch: number = 0, blockchain: string = 'bc', opts: Object = { asBuffer: true }): Promise<boolean> {
    try {
      let block
      let key
      if (hash === undefined) {
        return Promise.resolve(false)
      } else if (is(String, hash)) {
        block = hash
        hash = block.getHash()
        key = `${blockchain}.block.${hash}`
      } else {
        key = `${blockchain}.block.${hash}`
        block = await this.get(key, opts)
      }

      const txsKey = `${blockchain}.txs.${hash}`

      if (block === undefined || block === false || block === null) {
        return Promise.resolve(true)
      // determine if the block is a block collider block with method GetTxsList
      } else if (block.getTxsList !== undefined) {
        return Promise.all([
          this.resetMarkedBalancesFromBlock(block, blockchain),
          this.delHashAtHeight(block.getHeight(), blockchain, block.getHash(), opts), // removes hash from height index
          this.del(txsKey, opts), // removes transaction index for this block
          this.del(key, opts) // removes block data
        ].concat(
          block.getTxsList().reduce((all, tx) => {
            // remove any transactions stored on disk
            all.push(this.delTransaction(tx, branch, blockchain, opts))
            return all
          }, [])
        )).then(allResults => {
          // TODO do sth with all results
          return Promise.resolve(true)
        })
      } else {
        return Promise.all([
          // this.delMarkedBalancesAfterHeight(),
          // update marked balances
          this.delHashAtHeight(block.getHeight(), blockchain, block.getHash(), opts), // removes hash from height index
          this.del(txsKey, opts), // removes transaction index for this block
          this.del(key, block) // removes block data
        ]).then(allResults => {
          // TODO do sth with allResults
          return Promise.resolve(true)
        })
      }
    } catch (err) {
      this._logger.error(err)
      return Promise.resolve(false)
    }
  }

  /**
   * Get transactions by block hash
   * @param {string} blockHash of the block which TX we want to get
   */
  async getTransactionsByBlockHash (blockHash: string, blockchain: string = 'bc', opts: Object = { asBuffer: true }): Promise<Transaction[]|false> {
    const key = `${blockchain}.txs.${blockHash}` // TODO do we want the prefix?
    let txHashes: string[]
    let txList: Transaction[]
    try {
      txHashes = await this.get(key, opts)
      if (txHashes === null) {
        this._logger.warn(`no txHashes found: ${key}`)
        return Promise.resolve(false)
      }
    } catch (err) {
      this._logger.error(`Could not get tx hashes array for blockHash: ${blockHash}`, err.toString())
      return Promise.resolve(false)
    }

    try {
      txList = await this.getBulk(txHashes.map(hash => `${blockchain}.tx.${hash}`))
      // TODO do we want this check? Do we want to return the found TXs even if we did not found all of them in the persistence?
      if (txList.length !== txHashes.length) {
        this._logger.warn(`Found less TXs than number of hash references stored, hashes.length: ${txHashes.length}, txList.legnth: ${txList.length}`)
        return Promise.resolve(false)
      }
      return Promise.resolve(txList)
    } catch (err) {
      this._logger.error(`Could not get tx list for mr: ${blockHash}`, err.toString())
      return Promise.resolve(false)
    }
  }

  /**
   * Get block by hash with all transactions, reassembles blocks with transactions
   * @param blockchain string
   * @param hash string
   */
  async getBlockByHash (hash: string, blockchain: string = 'bc', opts: Object = { asBuffer: true, asHeader: false }): Promise<BcBlock|Block> {
    const key = `${blockchain}.block.${hash}`
    let block
    try {
      block = await this.get(key, opts)
      if (block === null) {
        this._logger.info(`no block found by hash ${hash}`)
        return false
      }
    } catch (err) {
      this._logger.error(`could not find block by hash ${hash}`, err.toString())
      return false
    }

    try {
      // get the txs unless only the header is being returned
      if (opts.asHeader !== true) {
        const txList = await this.getTransactionsByBlockHash(hash)
        if (txList === false) {
          return false // OR [block, null], see next TODO comment
        }
        // TODO cleaner way to do this
        block.setTxsList(txList)
      }
      return block
    } catch (err) {
      block.setTxsList([])
      this._logger.error(`Could not find transactions list for blockHash: ${block.getHash()}`, err.toString())
      return block
    }
  }

  /**
   * Get block on main branch at a specific height
   * @param height string
   * @param blockchain string
   */
  async getBlockByHeight (height: string|number, blockchain: string = 'bc', opts: Object = { asBuffer: true }): Promise<BcBlock|Block> {
    const key = `${blockchain}.block.${height}`
    debug(`getBlocKByHeight() key ${key}`)
    let block: null|BcBlock
    try {
      block = await this.get(key, opts)
      if (!block) {
        this._logger.warn(`Could not find blockKey by key ${key}`)
        return false
      }
    } catch (err) {
      this._logger.error(`Could not find block by height ${height}`, err.toString())
      return false
    }
    try {
      if (block.getHash() !== undefined && opts.asHeader !== true) {
        const txList = await this.getTransactionsByBlockHash(block.getHash())
        if (txList === false) {
          return Promise.resolve(false) // OR Promise.resolve([block, null]), see next TODO comment
        }
        // TODO cleaner way to do this
        block.setTxsList(txList)
      } else if (opts.asHeader !== true) {
        this._logger.warn(`no transactions found in block: ${block.getHash()}`)
      }
      return Promise.resolve(block)
    } catch (err) {
      block.setTxsList([])
      return Promise.resolve(block)
    }
  }

  /**
   * Get complete block headers by height
   * @param height number
   * @param blockchain string
   */
  async getBlocksByHeight (height: number, blockchain: string = 'bc', opts: Object = { asBuffer: true }): Promise<BcBlock[]|false> {
    const key = `${blockchain}.height.${height}` // TODO do we want the prefix? Better name than block_height_hashes?
    let blockHashes: string[]
    try {
      blockHashes = await this.get(key, opts)
      // query db to get the list of hashes associated at a height
      if (blockHashes === null) {
        this._logger.error(`could not get block hashes for height: ${height}, with key ${key}`)
        return false
      }
    } catch (err) {
      this._logger.error(`could not get block hashes for height: ${height}`, err.toString())
      return false
    }
    // optionally only get the block hashes for scanning for potential orphans
    if (opts.asHashes !== undefined) {
      return blockHashes
    }
    return Promise.all(blockHashes.map(hash => {
      return this.getBlockByHash(hash, blockchain, opts)
    }))
  }

  /**
   * Get blocks by range to -1 is latest
   * @param from number
   * @param to number
   * @param blockchain string
   */
  async getBlocksByRange (from: number, to: number, blockchain: string = 'bc', opts: Object = { asBuffer: true }): Promise<BcBlock[]|false> {
    try {
      if (to === -1) {
        const latestBlock = await this.get(`${blockchain}.block.latest`)
        if (latestBlock === null) {
          this._logger.error(new Error('could not find latest'))
          return false
        }
        to = parseInt(latestBlock.getHeight(), 10)
      } else if (from > to) {
        this._logger.error(new Error('from cannot be greater than to'))
        return false
      }
      let intervalSize = to - from
      if (intervalSize > 5000) {
        this._logger.warn('block range lookup limited to 5000')
        intervalSize = 5000
        from = max(to - 5000, 2)
      }
      const heights = [...Array(intervalSize).keys()].map((k) => { return k + from })
      debug(`getBlocksByRange() heights found: ${heights.length}`)
      return Promise.all(heights.map((height) => {
        return this.getBlocksByHeight(height, blockchain, opts)
      })).then(flatten)
    } catch (err) {
      this._logger.error(err)
      return false
    }
  }

  /**
   * Tries to find TransactionOutput for TransactionInput identified by outpoint hash and index
   *
   * returns false if either tx does not exist or doesn't have the output
   */
  async getOutputForInput (hash: string, index: number): Promise<TransactionOutput|false> {
    let tx

    try {
      tx = await this.get(`bc.tx.${hash}`)
      if (!tx) {
        return false
      }
    } catch (err) {
      this._logger.info(`TX ${hash} not found`)
      return true
    }

    const outputs = tx.getOutputsList()
    const output = outputs[index]

    if (!output) {
      return false
    }

    return output
  }

  /**
   * Attempts to load blocks by range from cache or loads from disk and updates cache
   */
  async getBlocksByRangeCached (start: number, end: number, blockchain: string = 'bc'): Promise<BcBlock[]> {
    const response = []
    let cacheStable = true
    if (end <= start || (end <= start + 1)) {
      return response
    }
    // test the cache integrity
    const latestBlock = await this.get(`${blockchain}.block.latest`)
    if (latestBlock && this.cache.has(`${blockchain}.block.` + latestBlock.getHeight())) {
      const cachedBlock = this.cache.get(`${blockchain}.block.` + latestBlock.getHeight())
      if (cachedBlock.getHeight() !== latestBlock.getHeight()) {
        cacheStable = false
      }
    }
    if (this.cache.has(`${blockchain}.block.` + start)) {
      const cachedBlock = this.cache.get(`${blockchain}.block.` + start)
      if (cachedBlock.getHeight() !== latestBlock.getHeight()) {
        cacheStable = false
      }
    }
    for (let i = start; i < end; i++) {
      if (this.cache.has(`${blockchain}.block.` + i) && cacheStable === true) {
        response.push(this.cache.get(`${blockchain}.block.` + i))
      } else {
        const block = await this.get(`${blockchain}.block.` + i)
        if (block === undefined || block === false) {
          break
        } else {
          response.push(block)
          this.cache.set(`${blockchain}.block.` + i, block)
        }
      }
    }

    return Promise.resolve(response)
  }

  // async getUnspentCollateral (address: string, blockchain: string = 'bc', opts: Object = { resetIndex: false, asBuffer: true }): Promise<number> {

  // takes an address and list of outputs
  // all relevent outputs must be spendable
  // returns any outputs in which the address was involved

  /**
   * Returns flags for each chain signaling if chain has a full 72h history from now
   *
   */
  async getDecisivePeriodOfCrossChainBlocksStatus (): Promise<{'btc': bool, 'eth': bool, 'lsk': bool, 'neo': bool, 'wav': bool}> {
    const result = {}
    const now = Date.now()
    const chains = ['btc', 'eth', 'lsk', 'neo', 'wav']
    for (const chain of chains) {
      result[chain] = false

      const latest = await this.get(`${chain}.block.latest`)

      // we don't have chain latest -> we didn't rover this chain yet
      if (!latest) {
        result[chain] = true
      }

      if (latest) {
        // chain latest timestamp we have is older than now (allow for waiting period for the next block)
        if (latest.getTimestamp() + ROVER_SECONDS_PER_BLOCK[chain] * 2 < now) {
          result[chain] = true
        }

        // check from latest to (now - 72h) of chain blocks
        const lowestHeightOfDecisivePeriod = latest.getHeight() - (72 * 60 * 60 / ROVER_SECONDS_PER_BLOCK[chain])
        for (let i = latest.getHeight() - 1; i >= lowestHeightOfDecisivePeriod || i === 0; i--) {
          const block = await this.get(`${chain}.block.${i}`)
          if (!block) {
            result[chain] = true
            break
          }
        }
      }
    }

    return result
  }

  /**
   * Decrement key
   * @param key {string}
   * @param amount {number} [optional]
   */
  async dec (key: string, amount: number = 1): Promise<number|Error> {
    const val = await this.get(key)
    if (val === null) {
      return 0
    }
    const value = parseInt(val, 10) // coerce for Flow
    const inc = value - amount
    if (inc < 0) {
      return 0
    }

    await this.put(key, inc)
    return inc
  }

  /**
   * Increment key
   * @param key {string}
   * @param amount {number} [optional]
   */
  async inc (key: string, amount: number = 1): Promise<number> {
    const val = await this.get(key)
    if (val === null) {
      await this.put(key, 1)
      return 1
    }

    const value = parseInt(val, 10) // coerce for Flow
    const inc = value + amount
    await this.put(key, inc)
    return inc
  }

  /**
   * Update List
   * @param key {string}
   * @param update {any}
   */
  async updateList<T> (key: string, update: T|null = null): Promise<null|T[]> {
    const val = await this.get(key)
    if (update === null) {
      await this.del(key)
      return null
    }
    if (val === null) {
      await this.put(key, [update])
      return [update]
    }
    if (Array.isArray(val) === false) {
      throw new Error(`key "${key}" is not a list`)
    }
    try {
      val.push(update)
      await this.put(key, val)
      return val
    } catch (err) {
      throw new Error('unable to update list')
    }
  }
}
