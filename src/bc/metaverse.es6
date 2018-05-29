/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type BcBlock from '../protos/core_pb'

const CircularBuffer = require('circular-buffer')
const { flatten } = require('ramda')

const MAX_METAVERSE_DEPTH = 7

export class Metaverse {
  _blocks: CircularBuffer
  _maxDepth: number
  _height: number

  constructor (maxDepth: number = MAX_METAVERSE_DEPTH) {
    this._blocks = new CircularBuffer(maxDepth)
    this._maxDepth = maxDepth
    this._height = 0

    for (let i = 0; i < this.maxDepth; i++) {
      this.blocks.enq([])
    }
  }

  get blocks (): CircularBuffer {
    return this._blocks
  }

  get blocksCount (): number {
    const blocks = this.toFlatArray()
    return blocks.length
  }

  get maxDepth (): number {
    return this._maxDepth
  }

  get maxHeight (): number {
    return this._height + this.maxDepth - 1
  }

  get minHeight (): number {
    return this._height
  }

  addBlock (block: BcBlock): boolean {
    const height = block.getHeight()
    const depth = height - this.minHeight
    if (depth <= this.maxHeight) {
      const blocks = this.blocks.get(depth) || []
      blocks.push(block)
      this.blocks[depth] = blocks
      return true
    }

    return false
  }

  getBlockByHash (hash: string): ?BcBlock {
    this.toFlatArray().forEach((block) => {
      if (block.hash === hash) {
        return block
      }
    })

    return null
  }

  toArray (): Array<Array<BcBlock>> {
    return this._blocks.toarray()
  }

  toFlatArray (): Array<BcBlock> {
    const blocks = this.toArray()
    return flatten(blocks)
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

  print () {
    console.log(JSON.stringify(this.toObject(), null, 2))
  }

  toObject (): Object {
    const res = {}
    this.toArray().forEach((row, index) => {
      res[this.minHeight + index] = row.map((block) => block.toObject())
    })

    return res
  }
}

export default Metaverse
