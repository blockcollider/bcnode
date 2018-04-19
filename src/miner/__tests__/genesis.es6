/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { getGenesisBlock } = require('../genesis')

describe('Genesis', () => {
  test('getGenesisBlock()', () => {
    const genesisBlock = getGenesisBlock()
    expect(genesisBlock.toObject()).toEqual({
      hash: '0xxxxxxxxxxxxxxxxxxxxxxxxx',
      height: 1,
      miner: '0x93490z9j390fdih2390kfcjsd90j3uifhs909ih3',
      difficulty: 141129464479256,
      timestamp: 1524145655,
      merkleRoot: '511d94127384b79e22a900ed4c86f4fda2b824619b00ad59a730aaa2945ca5a6',
      chainRoot: 'f65d51318cfd348bb66c8893a9583dfbebb475599f862f5bbc3978dd6d7b290f',
      distance: 1,
      nonce: 0,
      txCount: 0,
      transactionsList: [],
      childBlockchainCount: 5,
      childBlockHeadersList: [
        { blockchain: 'btc',
          hash: '0x39499390034',
          childBlockConfirmationsInParentCount: 1,
          previousHash: '0xxxxxxxxxxxxxxxxx',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 },
        { blockchain: 'eth',
          childBlockConfirmationsInParentCount: 1,
          hash: 'ospoepfkspdfs',
          previousHash: '0xxxxxxxxxxxxxxxxx',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 },
        { blockchain: 'lsk',
          childBlockConfirmationsInParentCount: 1,
          hash: '0x39300923i42034',
          previousHash: '0xxxxxxxxxxxxxxxxx',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 },
        { blockchain: 'wav',
          childBlockConfirmationsInParentCount: 1,
          hash: '0xsjdfo3i2oifji3o2',
          previousHash: '0xxxxxxxxxxxxxxxxx',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 },
        { blockchain: 'neo',
          childBlockConfirmationsInParentCount: 1,
          hash: '0xw3jkfok2jjvijief',
          previousHash: '0xxxxxxxxxxxxxxxxx',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 }
      ]
    })
  })
})
