/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// const { BcBlock } = require('../../protos/core_pb')
// const { Multiverse } = require('../multiverse')
//
// const BASE_DIFFICULTY = 42
//
// describe('Multiverse', () => {
//   test('constructor()', () => {
//     const multiverse = new Multiverse()
//     expect(multiverse.blocksCount).toEqual(0)
//   })
//
//   test('add() - first one', () => {
//     const multiverse = new Multiverse()
//
//     const block = new BcBlock()
//     block.setDifficulty(BASE_DIFFICULTY)
//     block.setHeight(0)
//
//     multiverse.addBlock(block)
//     expect(multiverse.blocksCount).toEqual(1)
//   })
//
//   test('add() - one for each depth', () => {
//     const multiverse = new Multiverse()
//
//     for (let i = 0; i < multiverse.commitDepth; i++) {
//       const block = new BcBlock()
//       block.setDifficulty(BASE_DIFFICULTY + i)
//       block.setHeight(i)
//       multiverse.addBlock(block)
//     }
//     expect(multiverse.blocksCount).toEqual(multiverse.commitDepth)
//
//     const blocksArray = multiverse.toArray()
//     for (let i = 0; i < multiverse.commitDepth; i++) {
//       const block = blocksArray[i][0]
//       expect(block.getDifficulty()).toEqual(BASE_DIFFICULTY + i)
//       expect(block.getHeight()).toEqual(i)
//     }
//   })
//
//   test('add() - N for each depth', () => {
//     const multiverse = new Multiverse()
//     const blocksPerDepth = 5
//
//     for (let i = 0; i < multiverse.commitDepth; i++) {
//       for (let j = 0; j < blocksPerDepth; j++) {
//         const block = new BcBlock()
//         block.setDifficulty(BASE_DIFFICULTY + (i * blocksPerDepth) + j)
//         block.setHeight(i)
//         multiverse.addBlock(block)
//       }
//     }
//
//     multiverse.print()
//     expect(multiverse.blocksCount).toEqual(blocksPerDepth * multiverse.commitDepth)
//
//     const blocksArray = multiverse.toArray()
//     for (let i = 0; i < multiverse.commitDepth; i++) {
//       for (let j = 0; j < blocksPerDepth; j++) {
//         const block = blocksArray[i][j]
//         expect(block.getDifficulty()).toEqual(BASE_DIFFICULTY + (i * blocksPerDepth) + j)
//         expect(block.getHeight()).toEqual(i)
//       }
//     }
//   })
// })
