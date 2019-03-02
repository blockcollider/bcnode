/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { RocksDb as PersistenceRocksDb } from '../persistence'

const { BcBlock } = require('../protos/core_pb')
const { getGenesisBlock } = require('./genesis')
const { PubSub } = require('../engine/pubsub')

export class BlockPool {
  _blockchain: Object // FIXME: Add annotation
  _persistence: PersistenceRocksDb
  _syncEnabled: bool
  _cache: Object[] // FIXME: Add annotation
  _maximumHeight: ?number
  _checkpoint: ?BcBlock
  _genesisBlock: BcBlock
  _pubsub: PubSub

  constructor (persistence: PersistenceRocksDb, pubsub: PubSub) {
    this._cache = []
    this._checkpoint = false
    this._persistence = persistence
    this._syncEnabled = true
    this._maximumHeight = null
    this._pubsub = pubsub
    this._genesisBlock = getGenesisBlock()
  }

  get checkpoint (): ?BcBlock {
    return this._checkpoint
  }

  get genesisBlock () : BcBlock {
    return this._genesisBlock
  }

  get maximumHeight () : ?number {
    return this._maximumHeight
  }

  set maximumHeight (height: number) {
    this._maximumHeight = height
  }

  get persistence () : PersistenceRocksDb {
    return this._persistence
  }

  get pubsub (): PubSub {
    return this._pubsub
  }

  // ranch dressing
  _eventResyncFailed (block: BcBlock) {
    // Request to update the data with a resync command
    // TODO: Implement miner stop and peer cycling
    this.pubsub.publish('update.resync.failed', { data: BcBlock })
  }

  _eventCheckpointReached (lastBlock: BcBlock) {
    // the blockchain has been fully populated from genesis block to checkpoint
    this.pubsub.publish('state.checkpoint.end', {
      checkpoint: this._checkpoint,
      genesisSecondBlock: lastBlock
    })

    this._checkpoint = false
  }

  _hasParent (block: BcBlock): boolean {
    const previousHash = block.getPreviousHash()
    const parentHeight = block.getHeight() - 1

    if (this._blockchain[parentHeight] === undefined) {
      return false
    }

    const matches = this._blockchain[parentHeight].reduce((all, item) => {
      if (item.getHash() === previousHash) {
        all = all + 1
      }
      return all
    }, 0)

    if (matches > 0) {
      return true
    }

    return false
  }

  updateCheckpoint (block: BcBlock): Promise<*> {
    // add checkpoint
    return this.purge(block)
  }

  async addBlock (block: BcBlock): Promise<*> {
    const hash = block.getHash()
    const previousHash = block.getPreviousHash()
    const height = block.getHeight()
    const toWrite = []
    let writeFromCache = false

    if (!this._checkpoint) {
      return Promise.reject(new Error('no checkpoint set for blockpool'))
    }

    if (hash === this.genesisBlock.getHash()) {
      return Promise.resolve(true)
    }

    const earliest = await this._persistence.get('bc.block.earliest')
    if (earliest) {
      // the sequence is complete trigger complete event
      if (block.getHash() === earliest.previousHash() &&
         previousHash === this._genesisBlock.getHash()) {
        this._eventCheckpointReached(block)
        return this._persistence.del('bc.block.earliest') // clean up and remove earliest for next sync
      }

      if (block.getHash() === earliest.previousHash() &&
         block.getHeight() === 2 &&
         previousHash !== this._genesisBlock.getHash()) {
        this._eventResyncFailed()
        return this._persistence.del('bc.block.earliest') // clean up and remove earliest for next sync
      }

      if (earliest.getHash() === hash) {
        return Promise.resolve(true)
      }

      // new block is earlier than the earliest
      if (earliest.getHeight() < height) {
        return Promise.resolve(true)
      }

      if (earliest.getPreviousHash() === hash) {
        toWrite.push(block)
      } else if (earliest.getHeight() > height) {
        this._cache.push(block)
        this._cache = this._cache.filter((b) => {
          if (b.getHeight() < earliest.getHeight()) {
            return b
          }
        })
        this._cache = this._cache.sort((a, b) => {
          if (a.getHeight() > b.getHeight()) {
            return 1
          }
          if (a.getHeight() < b.getHeight()) {
            return -1
          }
          return 0
        })
        const candidates = this._cache.reduce((all, b) => {
          if (earliest.getPreviousHash() === b.getHash()) {
            all.push(b)
          }
          return all
        }, [])
        if (candidates.length > 0) {
          writeFromCache = true
          toWrite.push(candidates.pop())
        }
      }

      // commit work to disk
      if (toWrite.length > 0) {
        const committedBlock = toWrite.pop()
        await this.persistence.put('bc.block.' + committedBlock.getHeight(), committedBlock)
        // if the solution was found in the cache rerun
        if (writeFromCache === true &&
          this._cache.length > 0) {
          await this.persistence.put('bc.block.earliest', committedBlock)
          return this.addBlock(this._cache.pop())
        }
        return this.persistence.put('bc.block.earliest', committedBlock)
      } else {
        return Promise.resolve(true)
      }
    } else {
      // when earliest is not set
      if (hash !== this.genesisBlock.getHash() &&
        height > 1 &&
        height < (this._checkpoint && this._checkpoint.getHeight())) {
        await this.persistence.put('bc.block.' + height, block)
        return this.persistence.put('bc.block.earliest', block)
      } else {
        if (height < 2) {
          return Promise.reject(new Error('invalid block claiming to be genesis'))
        } else {
          this._cache.push(block)
          return Promise.resolve(true)
        }
      }
    }
  }

  async purgeFrom (start: number, end: number): Promise<*> {
    if (end < 1 || start <= 1) {
      return Promise.reject(new Error('cannot purge below height 2'))
    }

    if (start === end) {
      return Promise.resolve(true)
    } else {
      try {
        await this._persistence.del('bc.block.' + start)
        return this.purgeFrom(start - 1, end)
      } catch (err) {
        return this.purgeFrom(start - 1, end)
      }
    }
  }

  async purge (checkpoint: ?BcBlock): Promise<*> {
    if (!checkpoint) {
      const latest = await this._persistence.get('bc.block.latest')
      if (!latest) {
        return Promise.reject(new Error('No latest block found'))
      }
      const height = latest.getHeight() - 1
      if (height < 2) {
        return Promise.reject(new Error('checkpoint set to genesis height'))
      }

      return this.purgeFrom(height, 1)
    }

    const height = checkpoint.getHeight() - 1
    try {
      const latest = await this._persistence.get('bc.block.latest')
      if (!latest) {
        return Promise.reject(new Error('No latest block found'))
      }
      const latestHeight = latest.getHeight()

      if (height < 2) {
        return Promise.reject(new Error('checkpoint set to genesis height'))
      }

      if (height > latestHeight) {
        return Promise.reject(new Error('cannot purge after latest block'))
      }

      this._checkpoint = checkpoint
      return this.purgeFrom(height, 1)
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

export default BlockPool
