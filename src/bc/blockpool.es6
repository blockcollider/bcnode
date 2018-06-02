/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type BcBlock from '../protos/core_pb'

const BLOCK_POOL_REFERENCE = 'bc.blockpool.'
const GENESIS_DATA = require('./genesis.raw')

export class BlockPool {
  _persistence: any
  _syncEnabled: bool
  _maximumHeight: ?number

  constructor (persistence: any) {
    this._persistence = persistence
    this._syncEnabled = true
    this._maximumHeight = null
  }

  set maximumHeight (height: number) {
    this._maximumHeight = height
  }

  async getLatest (key: string): BcBlock {
    const latestHash = await this._persistence.get(key + 'latest')
    const latest = await this._persistence.get(latestHash)
    return latest
  }

  putLatest (data) {
    return this._persistence.put(BLOCK_POOL_REFERENCE + 'latest', data)
  }

  async deleteStep (itr: number) {
    try {
      await this._persistence.del(BLOCK_POOL_REFERENCE + itr)
      if (itr > GENESIS_DATA.height) {
        return this.deleteStep(itr--)
      }
    } catch (err) {
      return new Error(err)
    }
  }

  addBlock (block: BcBlock): Promise<*> {
    const self = this
    const height = block.getHeight()
    const hash = block.getHash()
    const previousHash = block.getPreviousHash()
    return self._persistence.get(previousHash)
      // then -> check if a parent of the block exists in the main chain
      .then((res) => {
        // parent exists so determine if this block is also the new high for this chain 
        return self._persistence.get(res)
               .then((possibleBlock) => {
                 const latest = self.getLatest(BLOCK_POOL_REFERENCE + 'latest')
                 if (latest.getHeight() < possibleBlock.getHeight()) {
                   return self.putLatest(block)
                 }
                 return self._persistence.put('bc.block.' + height, possibleBlock)
               })
               .catch((_) => {
                 return Promise.all([
                   self._persistence.del(BLOCK_POOL_REFERENCE + height),
                   self._persistence.del(hash)])
                   .catch((err) => {
                     throw Error(err)
                   })
               })
      })
      .catch((_) => {
        const latest = this.getLatest(BLOCK_POOL_REFERENCE)
        const tasks = [
          self._persistence.put(BLOCK_POOL_REFERENCE + height, block),
          self._persistence.put(hash, BLOCK_POOL_REFERENCE + height)
        ]
        if (latest.getHeight() < block.getHeight()) {
          tasks.push(this.putLatest(block))
        }
        return Promise.all(tasks)
          .then(() => {
            return this._persistence.get('bc.block.' + height)
              .then((has) => {
                return has
              })
              .catch((err) => {
                throw new Error(err)
              })
          })
          .catch((err) => {
            throw new Error(err)
          })
      })
  }

  purge (ref: string) {
    const latest = this.getLatest(ref)
    this._syncEnabled = true
    return Promise.all([
      this.deleteStep(latest.getHeight())
    ])
  }
}

export default BlockPool
