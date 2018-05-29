/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const CircularBuffer = require('circular-buffer')

const MAX_METAVERSE_DEPTH = 7

export class Metaverse {
  _blocks: CircularBuffer
  _maxDepth: number

  constructor (maxDepth: number = MAX_METAVERSE_DEPTH) {
    this._blocks = new CircularBuffer(maxDepth)
    this._maxDepth = maxDepth
  }

  get blocks (): CircularBuffer {
    return this._blocks
  }

  get maxDepth (): number {
    return this._maxDepth
  }

  getBlockByHash (hash: string): ?Object {
    this.toArray().forEach((block) => {
      if (block.hash === hash) {
        return block
      }
    })

    return null
  }

  toArray (): Array<*> {
    return this._blocks.toarray()
  }
}

export default Metaverse
