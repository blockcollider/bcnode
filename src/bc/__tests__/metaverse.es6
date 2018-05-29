/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { BcBlock } = require('../../protos/core_pb')
const { Metaverse } = require('../metaverse')

const BASE_DIFFICULTY = 42

describe('Metaverse', () => {
  test('constructor()', () => {
    const metaverse = new Metaverse()
    expect(metaverse.blocksCount).toEqual(0)
  })

  test('add() - first one', () => {
    const metaverse = new Metaverse()

    const block = new BcBlock()
    block.setDifficulty(BASE_DIFFICULTY)
    block.setHeight(0)

    metaverse.addBlock(block)
    expect(metaverse.blocksCount).toEqual(1)
  })

  test('add() - one for each depth', () => {
    const metaverse = new Metaverse()

    for (let i = 0; i < metaverse.maxDepth; i++) {
      const block = new BcBlock()
      block.setDifficulty(BASE_DIFFICULTY + i)
      block.setHeight(i)
      metaverse.addBlock(block)
    }
    expect(metaverse.blocksCount).toEqual(metaverse.maxDepth)

    const blocksArray = metaverse.toArray()
    for (let i = 0; i < metaverse.maxDepth; i++) {
      const block = blocksArray[i][0]
      expect(block.getDifficulty()).toEqual(BASE_DIFFICULTY + i)
      expect(block.getHeight()).toEqual(i)
    }
  })

  test('add() - N for each depth', () => {
    const metaverse = new Metaverse()
    const blocksPerDepth = 5

    for (let i = 0; i < metaverse.maxDepth; i++) {
      for (let j = 0; j < blocksPerDepth; j++) {
        const block = new BcBlock()
        block.setDifficulty(BASE_DIFFICULTY + (i * blocksPerDepth) + j)
        block.setHeight(i)
        metaverse.addBlock(block)
      }
    }

    metaverse.print()
    expect(metaverse.blocksCount).toEqual(blocksPerDepth * metaverse.maxDepth)

    const blocksArray = metaverse.toArray()
    for (let i = 0; i < metaverse.maxDepth; i++) {
      for (let j = 0; j < blocksPerDepth; j++) {
        const block = blocksArray[i][j]
        expect(block.getDifficulty()).toEqual(BASE_DIFFICULTY + (i * blocksPerDepth) + j)
        expect(block.getHeight()).toEqual(i)
      }
    }
  })
})
