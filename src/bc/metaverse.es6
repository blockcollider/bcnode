/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type BcBlock from '../protos/core_pb'

const { flatten } = require('ramda')

const COMMIT_METAVERSE_DEPTH = 7

export class Metaverse {
  _blocks: Object
  _commitDepth: number
  _writeQueue: BcBlock[]
  _height: number
  _persistence: any

  constructor (commitDepth: number = COMMIT_METAVERSE_DEPTH, persistence: any) {
    this._blocks = {}
    this._writeQueue = []
    this._persistence = persistence
    this._commitDepth = commitDepth
    this._height = 0
    // TODO: I want this to load from current persistence
  }

  get blocks (): Object {
    return this._blocks
  }

  get blocksCount (): number {
    const blocks = Object.keys(this._blocks)
    return blocks.length
  }

  addBlock (block: BcBlock, force: boolean = false): boolean {
    const height = block.getHeight()
    const childHeight = height + 1
    const parentHeight = height - 1
    let hasParent = false
    let hasChild = false
    let inMetaverseLayer = false
    let added = false
    if (height === 1) {
      return false
      // this is the genesis block
    }
    if (this._blocks[parentHeight] !== undefined) {
      hasParent = this._blocks[parentHeight].reduce((all, item) => {
        if (item.getHash() === block.getPreviousHash()) {
          all = true
        }
        return all
      }, false)
    }
    if (this._blocks[childHeight] !== undefined) {
      hasChild = this._blocks[parentHeight].reduce((all, item) => {
        if (item.previousHash() === block.getHash()) {
          all = true
        }
        return all
      }, false)
    }
    if (this._blocks[height] !== undefined) {
      inMetaverseLayer = this._blocks[parentHeight].reduce((all, item) => {
        if (item.previousHash() === block.getHash()) {
          all = true
        }
        return all
      }, false)
    }
    if (hasParent || hasChild) {
      if (inMetaverseLayer === false) {
        if (this._blocks[height] === undefined) {
          this._blocks[height] = []
        }
        this._blocks[height].push(block)
        if (this._blocks[height].length > 1) {
          this._blocks[height] = this._blocks[height].sort((a, b) => {
            if (a.difficulty > b.difficulty) return 1
            if (a.difficulty < b.difficulty) return -1
            return 0
          })
          added = true
        }
        if (this._blocks[height] !== undefined &&
            this._blocks[height].length > 0 &&
            this._blocks[height][0].getHash() === block.getHash()) {
          this._writeQueue.push(block)
          added = true
        }
      }
    } else if (force === true) {
      this._writeQueue.push(block)
    }
    return added
  }

  getHighestBlock (): ?BcBlock {
    const keys = Object.keys(this._blocks)
    if (keys.length > 0) {
      const last = keys.pop()
      const block = this._blocks[last][0]
      return block
    } else {
      return null
    }
  }

  getLowestBlock (): ?BcBlock {
    const keys = Object.keys(this._blocks)
    if (keys.length > 0) {
      const last = keys.shift()
      const block = this._blocks[last][0]
      return block
    } else {
      return null
    }
  }

  shouldBroadcastBlock (block: BcBlock, force: boolean = false): boolean {
    const highestBlock = this.getHighestBlock()
    if (highestBlock !== null) {
      if (this.addBlock(block, force) === true) {
        // $FlowFixMe
        const height = highestBlock.getHeight()
        if (block.getHeight() >= height) {
          return true
        }
      }
    } else {
      return true
    }
    return false
  }

  toArray (): Array<Array<BcBlock>> {
    return this._blocks.toarray()
  }

  toFlatArray (): Array<BcBlock> {
    const blocks = this.toArray()
    return flatten(blocks)
  }

  persistMetaverse (): Promise<*> {
    if (this._writeQueue.length > 0) {
      const tasks = []
      for (let i = 0; i < this._writeQueue.length; i++) {
        tasks.push(this._persistence.pus('bc.block.' + this._writeQueue[i].getHeight(), this._writeQueue[i]))
      }
      this._writeQueue = []
      return Promise.all(tasks)
    }

    return Promise.resolve()
  }

  // print () {
  //   for (let i = 0; i < this.maxDepth; i++) {
  //     console.log(`DEPTH: ${i}, HEIGHT: ${this.minHeight + i}`)
  //     const blocks = this.blocks.get(i) || []
  //     for (let j = 0; j < blocks.length; j++) {
  //       console.log(j, blocks[j].toObject())
  //     }
  //   }
  // }
}

export default Metaverse
