/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type BcBlock from '../protos/core_pb'

const { getGenesisBlock } = require('./genesis')
const { PubSub } = require('../engine/pubsub')
const BLOCK_POOL_REFERENCE = 'bc.blockpool.'
const GENESIS_DATA = require('./genesis.raw')

export class BlockPool {
  _persistence: any
  _syncEnabled: bool
  _cache: Object[]
  _maximumHeight: ?number
  _checkpoint: ?BcBlock
  _genesisBlock: Object
  _pubsub: Object

  constructor (persistence: any, pubsub: any) {
    this._cache = []
    this._checkpoint = false
    this._persistence = persistence
    this._syncEnabled = true
    this._maximumHeight = null
    this._pubsub = pubsub
    this._genesisBlock = getGenesisBlock()
  }

  _eventTriggerResync () {
     // Request to update the data with a resync command
     this.pubsub.publish('update.resync.pool', {})
  }

  _eventCheckpointReached (lastBlock: BcBlock) {
     // the blockchain has been fully populated from genesis block to checkpoint
     this.pubsub.publish('state.checkpoint.complete', { checkpoint: this._checkpoint, genesisChildBlock: lastBlock })
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
    return this._purge(block)
  }

  get checkpoint(): ?BcBlock {
    return this._checkpoint
  }

  get pubsub(): PubSub {
    return this._pubsub
  }

  async addBlock (block: BcBlock): Promise<*> {
    const self = this
    const hash = block.getHash()
    const previousHash = block.getPreviousHash()
    const height = block.getHeight()
    const toWrite = []
    let writeFromCache = false
    if(this._checkpoint === undefined && this._checkpoint === false) {
      return Promise.reject(new Error('no checkpoint set for blockpool'))
    }
    if(hash === self.genesisBlock.getHash()){
       return Promise.resolve(true)
    }
    try {
      const earliest = await this._persistence.get('bc.block.earliest')
      // the sequence is complete trigger complete event
       if(block.getHash() === earliest.previousHash() &&
         previousHash === self._genesisBlock.getHash()){
         self._eventCheckpointReached(block)
         return this._persistence.del('bc.block.earliest') // clean up and remove earliest for next sync
       }
      if(earliest.getHash() === hash) {
       return Promise.resolve(true)
      }
      // new block is earlier than the earliest
      if(earliest.getHeight() < height) {
       return Promise.resolve(true)
      }
      if(earliest.getPreviousHash() === hash) {
        toWrite.push(block)
      } else if(earliest.getHeight() > height) {
       self._cache.push(block)
       self._cache = self._cache.filter((b) => {
          if(b.getHeight() < earliest.getHeight()){
            return b
          }
       })
       self._cache = self._cache.sort((a,b) => {
          if(a.getHeight() > b.getHeight()) {
            return 1
          }
          if(a.getHeight() < b.getHeight()) {
            return -1
          }
          return 0
       })
       const candidates = self._cache.reduce((all, b) => {
          if(earliest.getPreviousHash() === b.getHash()){
            all.push(b)
          }
          return all
       }, [])
       if(candidates.length > 0){
          writeFromCache = true
          toWrite.push((candidates.pop())
       }
      }
      // commit work to disk
      if(toWrite.length > 0){
        const committedBlock = toWrite.pop()
        await self._persistance.put('bc.block.' + committedBlock.getHeight(), committedBlock)
        // if the solution was found in the cache rerun
        if(writeFromCache === true &&
          self._cache.length > 0){
          await self._persistance.put('bc.block.earliest', committedBlock)
          return self.addBlock(self._cache.pop())
        }
        return self._persistance.put('bc.block.earliest', committedBlock)
      } else {
        return Promise.resolve(true)
      }
    } catch((err) => {
      // when earliest is not set
      if(hash !== self.genesisBlock.getHash() &&
         height > 1 &&
         height < self._checkpoint.getHeight()){
        await self._persistance.put('bc.block.' + height, block)
        return self._persistance.put('bc.block.earliest', block)
      } else {
        if(height < 2) {
          return Promise.reject('invalid block claiming to be genesis')
        } else {
          self._cache.push(block)
          return Promise.resolve(true)
        }
      }
    })
  }
  async purgeFrom (height: number) Promise<*> {
    if(number < 2) {
      return Promise.resolve(true)
    } else {
       await this._persistence.del('bc.block.' + (number-1))
       return purgeFrom(number-1)
    }
  }
  async purge (checkpoint: ?BcBlock) Promise<*> {
    const self = this
    if(checkpoint !== undefined && checkpoint !== false) {
      try {
        const latest = await self._persistence.get('bc.block.latest')
        const latestHeight = latest.getHeight()
        const height = checkpoint.getHeight() - 1
        if(height < 2){
          return Promise.reject(new Error('checkpoint set to genesis height'))
        }
        if(height > latestHeight){
          return Promise.reject(new Error('cannot purge after latest block'))
        }
       self._checkpoint = block
       return self.purgeFrom(height)
      } catch((err) => {
        return Promise.reject(err)
      })
    } else {
       const latest = await self._persistence.get('bc.block.latest')
       const height = latest.getHeight() - 1
       if(height < 2){
         return Promise.reject(new Error('checkpoint set to genesis height'))
       }
       return self.purgeFrom(height)
    }
  }
}

export default BlockPool
