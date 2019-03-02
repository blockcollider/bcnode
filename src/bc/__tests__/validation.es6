/**
 * Copyright (c) 2017-present, Block Collider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { childrenHeightSum, validateBlockSequence } = require('../validation')

const { BcBlock, BlockchainHeader, BlockchainHeaders } = require('../../protos/core_pb')

const rndString = () => Number(Math.random().toString().slice(2)).toString(36)
const createMockBlockchainHeader = (height) => new BlockchainHeader([
  rndString(), // string blockchain = 1;
  rndString(), // string hash = 2;
  rndString(), // string previous_hash = 3;
  Date.now() - (Math.random() * 1000 << 0), // uint64 timestamp = 4;
  height, // uint64 height = 5;
  rndString(), // string merkle_root = 6;
  1 // uint64 blockchain_confirmations_in_parent_count = 7;
])
const createMockBlock = (childrenHeights: [number[], number[], number[], number[], number[]]): BcBlock => {
  const block = new BcBlock()
  const blockchainHeaders = new BlockchainHeaders()
  const [btcHeights, ethHeights, lskHeights, neoHeights, wavHeights] = childrenHeights
  blockchainHeaders.setBtcList(btcHeights.map(h => createMockBlockchainHeader(h)))
  blockchainHeaders.setEthList(ethHeights.map(h => createMockBlockchainHeader(h)))
  blockchainHeaders.setLskList(lskHeights.map(h => createMockBlockchainHeader(h)))
  blockchainHeaders.setNeoList(neoHeights.map(h => createMockBlockchainHeader(h)))
  blockchainHeaders.setWavList(wavHeights.map(h => createMockBlockchainHeader(h)))

  block.setHash(rndString())
  block.setHeight(1)
  block.setBlockchainHeaders(blockchainHeaders)
  block.setDistance(100)
  block.setPreviousHash(rndString())
  block.setTotalDistance('101')

  return block
}

describe('validation', () => {
  describe('childrenHeightSum', () => {
    it('sums height of all children', () => {
      const mockBlock = createMockBlock([[1], [1], [1], [1], [1]])
      expect(childrenHeightSum(mockBlock)).toBe(5)
    })

    it('correctly sums ONLY THE HIGHEST despite some having multiple blocks', () => {
      const mockBlock = createMockBlock([[1], [1], [1], [1], [1, 2]])
      expect(childrenHeightSum(mockBlock)).toBe(6)
    })
  })

  describe('validateBlockSequence', () => {
    it('validates that both BC blocks and blockchainHeaders form a chain', () => {
      const mockParentBlock = createMockBlock([[2], [2], [2], [2], [2]])
      mockParentBlock.setHeight(10)
      mockParentBlock.setHash('a')
      mockParentBlock.setPreviousHash('1')
      mockParentBlock.getBlockchainHeaders().getBtcList()[0].setHash('btc_a')
      mockParentBlock.getBlockchainHeaders().getBtcList()[0].setPreviousHash('btc_1')
      mockParentBlock.getBlockchainHeaders().getEthList()[0].setHash('eth_a')
      mockParentBlock.getBlockchainHeaders().getEthList()[0].setPreviousHash('eth_1')
      mockParentBlock.getBlockchainHeaders().getLskList()[0].setHash('lsk_a')
      mockParentBlock.getBlockchainHeaders().getLskList()[0].setPreviousHash('lsk_1')
      mockParentBlock.getBlockchainHeaders().getNeoList()[0].setHash('neo_a')
      mockParentBlock.getBlockchainHeaders().getNeoList()[0].setPreviousHash('neo_1')
      mockParentBlock.getBlockchainHeaders().getWavList()[0].setHash('wav_a')
      mockParentBlock.getBlockchainHeaders().getWavList()[0].setPreviousHash('wav_1')

      const mockChildBlock = createMockBlock([[2], [3], [2], [2], [2]])
      mockChildBlock.setHeight(11)
      mockChildBlock.setHash('b')
      mockChildBlock.setPreviousHash('a')
      mockChildBlock.getBlockchainHeaders().getBtcList()[0].setHash('btc_a')
      mockChildBlock.getBlockchainHeaders().getBtcList()[0].setPreviousHash('btc_1')
      mockChildBlock.getBlockchainHeaders().getEthList()[0].setHash('eth_b')
      mockChildBlock.getBlockchainHeaders().getEthList()[0].setPreviousHash('eth_a')
      mockChildBlock.getBlockchainHeaders().getLskList()[0].setHash('lsk_a')
      mockChildBlock.getBlockchainHeaders().getLskList()[0].setPreviousHash('lsk_1')
      mockChildBlock.getBlockchainHeaders().getNeoList()[0].setHash('neo_a')
      mockChildBlock.getBlockchainHeaders().getNeoList()[0].setPreviousHash('neo_1')
      mockChildBlock.getBlockchainHeaders().getWavList()[0].setHash('wav_a')
      mockChildBlock.getBlockchainHeaders().getWavList()[0].setPreviousHash('wav_1')

      expect(validateBlockSequence([mockParentBlock, mockChildBlock])).toBe(true)
    })
  })
})
