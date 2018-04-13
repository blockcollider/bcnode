const BN = require('bn.js')
const { blake2bl } = require('../../utils/crypto')
const { Block, BcBlock } = require('../../protos/core_pb')

const {
  // these are only public because of this test
  createMerkleRoot,
  getChildrenBlocksHashes,
  getChildrenRootHash,
  // TODO these are only public because of this test
  prepareNewBlock,
  prepareWork,
  mine
} = require('../miner')

describe('Miner', () => {
  test('mine()', () => {
    /* - example Bitcoin block
      {
        hash:      <---- Just need this for "const blockHashes" below
        prevHash:
        merkleRoot:
      }
      */

    const minerPublicAddress = '0x93490z9j390fdih2390kfcjsd90j3uifhs909ih3'
    const oldTransactions = []

    const oldBestBlockchainsBlockHeaders = [
      new Block([
        'btc',
        '0x39499390034',
        '0xxxxxxxxxxxxxxxxx',
        1400000000,
        2,
        '0x000x00000'
      ]),
      new Block([
        'eth',
        'ospoepfkspdfs',
        '0xxxxxxxxxxxxxxxxx',
        1400000000,
        2,
        '0x000x00000'
      ]),
      new Block([
        'lsk',
        '0x39300923i42034',
        '0xxxxxxxxxxxxxxxxx',
        1400000000,
        2,
        '0x000x00000'
      ]),
      new Block([
        'wav',
        '0xsjdfo3i2oifji3o2',
        '0xxxxxxxxxxxxxxxxx',
        1400000000,
        2,
        '0x000x00000'
      ]),
      new Block([
        'neo',
        '0xw3jkfok2jjvijief',
        '0xxxxxxxxxxxxxxxxx',
        1400000000,
        2,
        '0x000x00000'
      ])
    ]

    const oldBestBlockchainHeaderHashes = getChildrenBlocksHashes(oldBestBlockchainsBlockHeaders)

    const oldChainRoot = blake2bl(getChildrenRootHash(oldBestBlockchainHeaderHashes).toString())

    const genesisTimestamp = ((Date.now() / 1000) << 0) - 70
    const genesisBlock = new BcBlock()
    genesisBlock.setHash('0xxxxxxxxxxxxxxxxxxxxxxxxx')
    genesisBlock.setHeight(1)
    genesisBlock.setMiner(minerPublicAddress)
    genesisBlock.setDifficulty(141129464479256)
    genesisBlock.setTimestamp(genesisTimestamp)
    // blockchains, transactions, miner address, height
    genesisBlock.setMerkleRoot(
      createMerkleRoot(
        oldBestBlockchainHeaderHashes.concat(
          oldTransactions.concat([minerPublicAddress, 1])
        )
      )
    )
    genesisBlock.setChainRoot(oldChainRoot)
    genesisBlock.setDistance(1)
    genesisBlock.setTxCount(0)
    genesisBlock.setNonce(0) // TODO
    genesisBlock.setTransactionsList(oldTransactions)
    genesisBlock.setChildBlockchainCount(5)
    genesisBlock.setChildBlockHeadersList(oldBestBlockchainsBlockHeaders)

    expect(genesisBlock.toObject()).toEqual({
      hash: '0xxxxxxxxxxxxxxxxxxxxxxxxx',
      height: 1,
      miner: '0x93490z9j390fdih2390kfcjsd90j3uifhs909ih3',
      difficulty: 141129464479256,
      timestamp: genesisTimestamp,
      merkleRoot: '570905689d00f6b7a15c332e54c02418f22e98db880a675f32e63537531ae48c',
      chainRoot: 'b4816d65eabac8f1a143805ffc6f4ca148c4548e020de3db21207a4849ea9abe',
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
      oldBestBlockchainsBlockHeaders,
      newBestBlockchainsBlockHeaders,
      newTransactions,
      minerPublicAddress
    )

    const solution = mine(
      work,
      minerPublicAddress,
      newBlock.getMerkleRoot(),
      new BN(newBlock.getDifficulty()).div(new BN(100000, 16)).toString(), // divide diff in test by huge number to finish quickly
      () => 0.12137218313968567 // fake rng to produce stable test result
    )

    const newBlockTimestamp = Date.now() / 1000 << 0
    // Set timestamp after minings
    newBlock.setTimestamp(newBlockTimestamp)
    newBlock.setDistance(solution.distance)
    newBlock.setNonce(solution.nonce)

    expect(newBlock.toObject()).toEqual({
      hash: '642759529ceb51fe2141b398da012d07959de22e563ab35a01d4f2424f6f94d0',
      height: 2,
      merkleRoot: '3846bfe390e8d5e887cf9df928e25516ca3209b9f87320ac24628b82276a6acc',
      difficulty: 169690252393619,
      chainRoot: '0d6ac1386c1792cedd2066f6e062033788a8a66ddb8c10b1ba9f5339dcafad51',
      distance: 182925574122964,
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
