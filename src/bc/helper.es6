/**
 * Copyright (c) 2017-present, Block Collider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { BcBlock, BlockchainHeader } = require('../protos/core_pb')

function chr4 (): string {
  return Math.random().toString(16).slice(-4)
}
export function standardId (): string {
  return chr4() + chr4() +
    '-' + chr4() +
    '-' + chr4() +
    '-' + chr4() +
    '-' + chr4() + chr4() + chr4()
}
export const getBlockchainsBlocksCount = (block: BcBlock) => {
  // $FlowFixMe
  const headersLists: BlockchainHeader[][] = Object.values(block.getBlockchainHeaders().toObject())
  return headersLists.reduce((acc, headersList: BlockchainHeader[]) => acc + headersList.length, 0)
}
