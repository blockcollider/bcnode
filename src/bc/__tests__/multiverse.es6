/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { flatten } = require('ramda')

const { BcBlock, BlockchainHeader, BlockchainHeaders, Block } = require('../../protos/core_pb')
const { Multiverse } = require('../multiverse')

const PersistenceRocksDb = require('../../persistence/rocksdb').default
jest.mock('../../persistence/rocksdb')

const rndString = () => Number(Math.random().toString().slice(2)).toString(36)
const createMockBlockchainHeader = (blockchain: string, height: number) => new BlockchainHeader([
  blockchain, // string blockchain = 1;
  rndString(), // string hash = 2;
  rndString(), // string previous_hash = 3;
  Date.now() - (Math.random() * 1000 << 0), // uint64 timestamp = 4;
  height, // uint64 height = 5;
  rndString(), // string merkle_root = 6;
  1 // uint64 blockchain_confirmations_in_parent_count = 7;
])

const blockchainHeaderToRoveredBlock = (header: BlockchainHeader): Block => {
  return new Block([
    header.blockchain,
    header.hash,
    header.previousHash,
    header.timestamp,
    header.height,
    header.merkleRoot
  ])
}

describe.skip('Multiverse', () => {
  beforeEach(() => {
    // $FlowFixMe - flow is unable to properly type mocked module
    PersistenceRocksDb.mockClear()
  })

  test('constructor()', () => {
    const multiverse = new Multiverse(new PersistenceRocksDb())
    expect(multiverse.blocksCount).toEqual(0)
  })

  describe('validateRoveredBlocks', () => {
    let mockPersistence
    let multiverse
    let mockBlockchainHeadersObj
    let mockBlockchainHeaders

    beforeAll(() => {
      mockPersistence = new PersistenceRocksDb()
      multiverse = new Multiverse(mockPersistence)
      mockBlockchainHeadersObj = {
        setBtcList: [createMockBlockchainHeader('btc', 529338)], // btc
        setEthList: [createMockBlockchainHeader('eth', 5858091)], // eth
        setLskList: [createMockBlockchainHeader('lsk', 6351117)], // lsk
        setNeoList: [createMockBlockchainHeader('neo', 2435841)], // neo
        setWavList: [createMockBlockchainHeader('wav', 1057785)] // wav
      }
      mockBlockchainHeaders = new BlockchainHeaders()
      Object.entries(mockBlockchainHeadersObj).forEach(([method, list]) => {
        mockBlockchainHeaders[method](list)
      })
    })

    test('resolves as true if all blocks are rovered', async () => {
      // we don't care here about other values in the BcBlock so keep default values
      const mockBlock = new BcBlock()
      mockBlock.setBlockchainHeaders(mockBlockchainHeaders)

      const mockGetBulkReturnValue = flatten(Object.values(mockBlockchainHeaders.toObject())).map(blockchainHeaderToRoveredBlock)
      mockPersistence.getBulk.mockResolvedValueOnce(mockGetBulkReturnValue)

      const allAreRovered = await multiverse.validateRoveredBlocks(mockBlock)
      expect(allAreRovered).toBe(true)
    })

    test('resolves as false if some block in BlockchainHeaders was not rovered by node', async () => {
      // we don't care here about other values in the BcBlock so keep default values
      const mockBlock = new BcBlock()
      mockBlock.setBlockchainHeaders(mockBlockchainHeaders)
      // mock that persistence returns olny eth, lsk, neo and wav Block from persistence (btc is missing - was not rovered)
      const mockGetBulkReturnValue = flatten(Object.values(mockBlockchainHeaders.toObject())).map(blockchainHeaderToRoveredBlock).slice(1)
      mockPersistence.getBulk.mockResolvedValueOnce(mockGetBulkReturnValue)

      const allAreRovered = await multiverse.validateRoveredBlocks(mockBlock)
      expect(allAreRovered).toBe(false)
    })

    test('resolves ad false if some block in BlockchainHeaders has different values', async () => {
      // we don't care here about other values in the BcBlock so keep default values
      const mockBlock = new BcBlock()
      mockBlock.setBlockchainHeaders(mockBlockchainHeaders)
      // mock that BTC block returned from persistence has different hash, previous hash and merkleRoot
      const mockGetBulkReturnValue = flatten(Object.values(mockBlockchainHeaders.toObject())).map(blockchainHeaderToRoveredBlock)
      mockGetBulkReturnValue[0].setHash('differentHash')
      mockGetBulkReturnValue[0].setPreviousHash('differentPreviousHash')
      mockGetBulkReturnValue[0].setMerkleRoot('differentMerkleRoot')
      mockPersistence.getBulk.mockResolvedValueOnce(mockGetBulkReturnValue)

      const allAreRovered = await multiverse.validateRoveredBlocks(mockBlock)
      expect(allAreRovered).toBe(false)
    })
  })
})
