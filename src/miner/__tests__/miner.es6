const BN = require('bn.js')
const { Block } = require('../../protos/core_pb')

const {
  prepareNewBlock,
  prepareWork,
  mine
} = require('../miner')

const { getGenesisBlock } = require('../genesis')

const { mockRandom } = require('jest-mock-random')

describe('Miner', () => {
  test('mine()', () => {
    const minerPublicAddress = '0x93490z9j390fdih2390kfcjsd90j3uifhs909ih3'

    const genesisTimestamp = ((Date.now() / 1000) << 0) - 70
    const genesisBlock = getGenesisBlock(minerPublicAddress)
    expect(genesisBlock.toObject()).toEqual({
      hash: '0xxxxxxxxxxxxxxxxxxxxxxxxx',
      height: 1,
      miner: '0x93490z9j390fdih2390kfcjsd90j3uifhs909ih3',
      difficulty: 141129464479256,
      timestamp: genesisTimestamp,
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
          previousHash: '0xxxxxxxxxxxxxxxxx',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 },
        { blockchain: 'eth',
          hash: 'ospoepfkspdfs',
          previousHash: '0xxxxxxxxxxxxxxxxx',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 },
        { blockchain: 'lsk',
          hash: '0x39300923i42034',
          previousHash: '0xxxxxxxxxxxxxxxxx',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 },
        { blockchain: 'wav',
          hash: '0xsjdfo3i2oifji3o2',
          previousHash: '0xxxxxxxxxxxxxxxxx',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 },
        { blockchain: 'neo',
          hash: '0xw3jkfok2jjvijief',
          previousHash: '0xxxxxxxxxxxxxxxxx',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 }
      ]
    })

    /* - !!! THIS NEW BLOCK COMES IN !!!
    {
        hash: "0x0000000000000000000",
        merkleRoot: "0x000x00000",
        height: 3,
        timestamp: 1400000000
    }

    so a database query would gather all of the best blocks below in newBestBlockchainsBlockHeaders to assemble work around it
    most of the blocks would be the same with the same values
    */

    const newTransactions = []
    const newBestBlockchainsBlockHeaders = [
      new Block([
        'btc',
        '0x39499390034',
        "0xxxxxxxxxxxxxxxxx'",
        1400000000,
        2,
        '0x000x00000'
      ]),
      new Block([
        'eth',
        '0xksjiefjisefmnsef', // <-------  the new block would update his previous block
        'ospoepfkspdfs', // the previous hash from above
        1480000000,
        3,
        '0x000x00000'
      ]),
      new Block([
        'lsk',
        '0x39300923i42034',
        "0xxxxxxxxxxxxxxxxx'",
        1400000000,
        2,
        '0x000x00000'
      ]),
      new Block([
        'wav',
        '0xsjdfo3i2oifji3o2',
        "0xxxxxxxxxxxxxxxxx'",
        1400000000,
        2,
        '0x000x00000'
      ]),
      new Block([
        'neo',
        '0xw3jkfok2jjvijief',
        "0xxxxxxxxxxxxxxxxx'",
        1400000000,
        2,
        '0x000x00000'
      ])
    ]

    const work = prepareWork(genesisBlock, newBestBlockchainsBlockHeaders)
    const newBlock = prepareNewBlock(
      genesisBlock,
      genesisBlock.getChildBlockHeadersList(),
      newBestBlockchainsBlockHeaders,
      newTransactions,
      minerPublicAddress
    )

    mockRandom([0.12137218313968567])

    const solution = mine(
      work,
      minerPublicAddress,
      newBlock.getMerkleRoot(),
      new BN(newBlock.getDifficulty()).div(new BN(100000, 16)).toString() // divide diff in test by huge number to finish quickly
    )

    const newBlockTimestamp = Date.now() / 1000 << 0
    // Set timestamp after minings
    newBlock.setTimestamp(newBlockTimestamp)
    newBlock.setDistance(solution.distance)
    newBlock.setNonce(solution.nonce)

    expect(newBlock.toObject()).toEqual({
      hash: 'fc3d9ba19e4ad2cdcf3dc488a8d167aeb6352e4f647aecd825ff95d706e44427',
      height: 2,
      merkleRoot: '6afe889d6f083c70df22ff7fc5fd02e66d2ade95b214839661046681d6e9592f',
      difficulty: 169690252393619,
      chainRoot: '132f52a2ae403c18fd6b5d232af8b6860e7d6f5f52df9504e58c2f39c49d7dd4',
      distance: 212727732440313,
      nonce: '0.12137218313968567',
      txCount: 0,
      miner: minerPublicAddress,
      timestamp: newBlockTimestamp,
      transactionsList: [],
      childBlockchainCount: 5,
      childBlockHeadersList: [
        { blockchain: 'btc',
          hash: '0x39499390034',
          previousHash: '0xxxxxxxxxxxxxxxxx\'',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 },
        { blockchain: 'eth',
          hash: '0xksjiefjisefmnsef',
          previousHash: 'ospoepfkspdfs',
          merkleRoot: '0x000x00000',
          height: 3,
          timestamp: 1480000000 },
        { blockchain: 'lsk',
          hash: '0x39300923i42034',
          previousHash: '0xxxxxxxxxxxxxxxxx\'',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 },
        { blockchain: 'wav',
          hash: '0xsjdfo3i2oifji3o2',
          previousHash: '0xxxxxxxxxxxxxxxxx\'',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 },
        { blockchain: 'neo',
          hash: '0xw3jkfok2jjvijief',
          previousHash: '0xxxxxxxxxxxxxxxxx\'',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 }
      ]
    })
  })
})
