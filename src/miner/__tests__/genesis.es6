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
          hash: '0000000000000000003a77d5927982946004cb0ffdabc356ebf3c1de8cfa82c3',
          childBlockConfirmationsInParentCount: 1,
          previousHash: '00000000000000000029fa0e75be83699a632ed531a882f7f04e26392c372bf5',
          merkleRoot: 'ea5f5cd60d98846778d39d02a7a49844a93c2bb1608e602eaf6a93675effa5d5',
          height: 518390,
          timestamp: 1523829019 },
        { blockchain: 'eth',
          childBlockConfirmationsInParentCount: 1,
          hash: '0xa0c8290fbbefa0410ea7e727ce1f2a7ee7c6db1495a92e0f8778201c13dcef2b',
          previousHash: '0x5cee422a929fb1263d96954f935b794c29a9e8f904bb47de2e167aaa37d391ff',
          merkleRoot: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
          height: 5451804,
          timestamp: 1523844539 },
        { blockchain: 'lsk',
          childBlockConfirmationsInParentCount: 1,
          hash: '2875516409288438346',
          previousHash: '6899263519938768036',
          merkleRoot: '2875516409288438346',
          height: 5743193,
          timestamp: 1523894800 },
        { blockchain: 'neo',
          childBlockConfirmationsInParentCount: 1,
          hash: '3a7faa52678c965680c65222149e077e9fed1316aa11c05e5f61c9efd9874224',
          previousHash: 'c734ed02a391207ad22a732d5318b8625bc6ec0a4d7772fcdda2191adb8e4f4f',
          merkleRoot: '205231ee785064e0407a77553120ca044c5c643f52aa23731a99e008ac719a16',
          height: 2141254,
          timestamp: 1523645134 },
        { blockchain: 'wav',
          childBlockConfirmationsInParentCount: 1,
          hash: '2zBdKozsif6AQMfnfRsCiiiviBQsSaX2p5mmobwDoCUJ6veuSWGZrf9CuNzjhUw4cjpAmiZxvYzgjdVQHvxjMzhU',
          previousHash: '57DGUE3gEjKo5WEYLKkHn2dnLiCoZKiEqGvEGZCbiANFYov4qRk3hgh8CruLZ5gYzjYNsFnWuoNmwjzK7GJ9iPmh',
          merkleRoot: '2zBdKozsif6AQMfnfRsCiiiviBQsSaX2p5mmobwDoCUJ6veuSWGZrf9CuNzjhUw4cjpAmiZxvYzgjdVQHvxjMzhU',
          height: 962470,
          timestamp: 1523901811 }
      ]
    })
  })
})
