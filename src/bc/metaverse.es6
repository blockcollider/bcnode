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

const MAX_METAVERSE_DEPTH = 7

export class Metaverse {
  _blocks: CircularBuffer
  _maxDepth: number
  _height: number

  constructor (maxDepth: number = MAX_METAVERSE_DEPTH) {
    this._blocks = new CircularBuffer(maxDepth)
    this._maxDepth = maxDepth
    this._height = 0
  }

  get blocks (): CircularBuffer {
    return this._blocks
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

  getBlockByHash (hash: string): ?BcBlock {
    this.toArray().forEach((block) => {
      if (block.hash === hash) {
        return block
      }
    })

    return null
  }

  toArray (): Array<BcBlock> {
    return this._blocks.toarray()
  }
}

export default Metaverse
