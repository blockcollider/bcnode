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

  constructor (persistence: any) {
    this._persistence = persistence
    this._syncEnabled = true
  }

  async getLatest (key: string): BcBlock {
    const latestHash = await this._persistence.get(key + 'latest')
    const latest = await this._persistence.get(latestHash)
    return latest
  }

  async putLatest (data) {
    return await this._persistence.put(BLOCK_POOL_REFERENCE + 'latest', data)
  }

  async disableSync (itr: number) {
    this._syncEnabled = false
    try {
      await this._persistence.del(BLOCK_POOL_REFERENCE + itr)
      if (itr > GENESIS_DATA.height) {
        return this.disableSync(itr--)
      }
    } catch (err) {
      return new Error(err)
    }
  }

  addBlock (block: BcBlock): Promise<*> {
    const height = block.getHeight()
    const hash = block.getHash()
    const previousHash = block.getPreviousHash()
    if (this._syncEnabled) {
      return this._persistence.get(previousHash)
        .then((res) => {
          this._persistence.get(res)
            .then((possibleBlock) => {
              const latest = this.getLatest(BLOCK_POOL_REFERENCE)
              if (latest.getHeight() < possibleBlock.getHeight()) {
                return this.putLatest(block)
              }
              return this._persistence.put('bc.block.' + height, possibleBlock)
            })
            .catch((_) => {
              return Promise.all([
                this._persistence.del(BLOCK_POOL_REFERENCE + height),
                this._persistence.del(hash)])
                .catch((err) => {
                  throw Error(err)
                })
            })
        })
        .catch((_) => {
          const latest = this.getLatest(BLOCK_COOLPREFERENCE)
          const tasks = [
            this._persistence.put(BLOCK_POOL_REFERENCE + height, block),
            this._persistence.put(hash, BLOCK_POOL_REFERENCE + height)
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
    } else {
      return Promise.resolve()
    }
  }

  purge (ref: string) {
    const latest = this.getLatest(BLOCK_POOL_REFERENCE)
    this._syncEnabled = true
    return Promise.all([
      this.disableSync(latest.getHeight())
    ])
  }

}

export default BlockPool
