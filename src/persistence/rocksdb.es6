/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type Logger from 'winston'
const RocksDb = require('rocksdb')

const debug = require('debug')('bcnode:persistence:rocksdb')
const { BcBlock } = require('../protos/core_pb')
const { serialize, deserialize } = require('./codec')
const { getLogger } = require('../logger')

/**
 * Unified persistence interface
 */
export default class PersistenceRocksDb {
  _db: RocksDb // eslint-disable-line no-undef
  _isOpen: boolean // eslint-disable-line no-undef
  _logger: Logger

  constructor (location: string = '_data') {
    this._db = new RocksDb(location)
    this._isOpen = false
    this._logger = getLogger(__dirname)
  }

  get db (): RocksDb {
    return this._db
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
      this._logger.warn(`Could not serialize key: ${key}, value: ${value.toObject()}`)
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
  get (key: string, opts: Object = { asBuffer: true }): Promise<Object>|Promise<Array<Object>> {
    debug('get()', key)

    if (Array.isArray(key)) {
      const promises = key.map((k) => {
        return this.get(k)
      })

      return promises.map((p) => p.catch(e => null))
        .then((results) => results.filter(a => a))
    }

    return new Promise((resolve, reject) => {
      this.db.get(key, opts, (err, value) => {
        if (err) {
          return reject(new Error(`${err.message} - ${key}`))
        }
        try {
          const deserialized = deserialize(value)
          return resolve(deserialized)
        } catch (e) {
          return reject(new Error(`Could not deserialize value`))
        }
      })
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

  /**
   * Scan blocks to return balance of miner address
   * @param address
   * @param startBlock
   * @param endBlock
   */
  async scanBlockGrants (address: string, startBlock: number, endBlock: number): Object {
    const self = this
    const accountBalances = {
      confirmed: 0,
      unconfirmed: 0
    }
    for (let i = startBlock; i < endBlock; i++) {
      try {
        const block = await self.get('bc.block.' + i)
        if (block !== undefined && block.getMiner() === address) {
          if (block.getNrgGrant() !== 1600000000) {
            block.setNrgGrant(1600000000) // Force BT Reward
          }
          if (endBlock - i > 99 && block.getNrgGrant() !== undefined) {
            accountBalances.confirmed += block.getNrgGrant()
          } else if (endBlock - i < 99 && block.getNrgGrant() !== undefined) {
            accountBalances.unconfirmed += block.getNrgGrant()
          }
        }
      } catch (err) {
        return err
      }
    }
    return accountBalances
  }

  /**
   * Get Balance of Address (Before Target)
   * @param address
   * @param opts
   */
  getBtAddressBalance (address: string, opts: Object = { asBuffer: true }): Promise<Object> {
    const self = this
    return new Promise((resolve, reject) => {
      if (address === undefined) {
        return reject(new Error(`no address provided`))
      }
      if (/^(0x){1}[0-9a-fA-F]{40}$/i.test(address) === false) {
        return reject(new Error(`malformed address`))
      }
      this.db.get('bc.block.latest', opts, (err, value) => {
        if (err) {
          return reject(new Error(`${err.message} --> local Block Collider ledger not found, sychronize machine with network`))
        }
        try {
          const latestBlock: BcBlock = deserialize(value)
          if (latestBlock !== undefined && latestBlock.getHeight() !== undefined) {
            const endBlock = latestBlock.getHeight()
            return resolve(self.scanBlockGrants(address, 1, Number(endBlock)))
          } else {
            return reject(new Error(`No blocks stored on disk`))
          }
        } catch (e) {
          return reject(new Error(`Could not deserialize value`))
        }
      })
    })
  }
}
