const BN = require('bn.js')
const { Block } = require('../../protos/core_pb')

const {
  prepareNewBlock,
  prepareWork,
  mine
} = require('../miner')

const { getGenesisBlock, GENESIS_MINER_KEY } = require('../genesis')

const { mockRandom } = require('jest-mock-random')
const mockNow = require('jest-mock-now')

const TEST_MINER_KEY = GENESIS_MINER_KEY // crypto.randomBytes(32)

const TEST_DATA = require('../data').BLOCKS_MAP

describe('Miner', () => {
  test('mine()', () => {
    const genesisBlock = getGenesisBlock()

    const genesisHeaders = genesisBlock.getChildBlockHeadersList()

    // Convert genesis headers back to raw Block which is returned by miner
    const headers = genesisHeaders
      .map((oldHeader) => {
        return new Block([
          oldHeader.getBlockchain(),
          oldHeader.getHash(),
          oldHeader.getPreviousHash(),
          oldHeader.getTimestamp(),
          oldHeader.getHeight(),
          oldHeader.getMerkleRoot()
        ])
      })

    // Pick ethereum header
    const oldHeader = headers[1]

    const testEthBlock = TEST_DATA.eth[0]
    expect(testEthBlock.previousHash).toEqual(oldHeader.getHash())

    // Change hash, previousHash, timestamp and height
    const newHeader = new Block([
      testEthBlock.blockchain,
      testEthBlock.hash, // <-------  the new block would update his previous block
      testEthBlock.previousHash, // the previous hash from above
      testEthBlock.timestamp / 1000,
      testEthBlock.height,
      testEthBlock.merkleRoot
    ])

    // Update changed header in header list
    headers[1] = newHeader

    // Mock timestamp - 3600 seconds (1 hour) after genesis block
    let mockedTimestamp = mockNow(new Date((genesisBlock.getTimestamp() * 1000) + 3600 * 1000))

    // Prepare work for miner
    const work = prepareWork(genesisBlock, headers)

    // Create (not yet existing) block
    const newBlock = prepareNewBlock(
      genesisBlock,
      headers,
      headers[1],
      [], // transactions
      TEST_MINER_KEY
    )

    // Mock timestamp - 3 seconds after work was generated
    mockedTimestamp = mockNow(new Date(mockedTimestamp + 3000))
    mockRandom([0.12137218313968567])

    // Mine new block
    const solution = mine(
      work,
      TEST_MINER_KEY,
      newBlock.getMerkleRoot(),
      new BN(newBlock.getDifficulty()).div(new BN(100000, 16)).toString() // divide diff in test by huge number to finish quickly
    )

    // Remove Date.now() mock
    Date.now.mockRestore()

    // Mocked timestamp - 1 second after mining started
    const newBlockTimestamp = mockedTimestamp + 1000

    // Set timestamp after minings
    newBlock.setTimestamp(newBlockTimestamp)
    newBlock.setDistance(solution.distance)
    newBlock.setNonce(solution.nonce)

    const newBlockObject = newBlock.toObject()
    expect(newBlockObject).toEqual({
      hash: '39bc7bbd2b182eddac2d18d5c998808f64423176975fb5a715d57f8599a4104f',
      height: 2,
      merkleRoot: '53c85bcd43ade65bba9d2e2d2b5944116526b7c05ba7b7d6425699128548f5ae',
      difficulty: 11860447342465,
      chainRoot: 'daf4c73925e7eb4e67a86cabfb7cc1e257a7af63f6a3f0b3f5991839891fc796',
      distance: 185633463518405,
      nonce: '0.12137218313968567',
      txCount: 0,
      miner: TEST_MINER_KEY,
      timestamp: newBlockTimestamp,
      transactionsList: [],
      childBlockchainCount: 5,
      childBlockHeadersList: [
        { blockchain: 'btc',
          hash: '0000000000000000003a77d5927982946004cb0ffdabc356ebf3c1de8cfa82c3',
          previousHash: '00000000000000000029fa0e75be83699a632ed531a882f7f04e26392c372bf5',
          childBlockConfirmationsInParentCount: genesisHeaders[0].getChildBlockConfirmationsInParentCount() + 1,
          merkleRoot: 'ea5f5cd60d98846778d39d02a7a49844a93c2bb1608e602eaf6a93675effa5d5',
          height: 518390,
          timestamp: 1523829019 },
        { blockchain: 'eth',
          childBlockConfirmationsInParentCount: 1,
          hash: testEthBlock.hash,
          previousHash: testEthBlock.previousHash,
          merkleRoot: testEthBlock.merkleRoot,
          height: testEthBlock.height,
          timestamp: (testEthBlock.timestamp / 1000) },
        { blockchain: 'lsk',
          childBlockConfirmationsInParentCount: genesisHeaders[2].getChildBlockConfirmationsInParentCount() + 1,
          hash: '2875516409288438346',
          previousHash: '6899263519938768036',
          merkleRoot: '2875516409288438346',
          height: 5743193,
          timestamp: 1523894800 },
        { blockchain: 'neo',
          childBlockConfirmationsInParentCount: genesisHeaders[3].getChildBlockConfirmationsInParentCount() + 1,
          hash: '3a7faa52678c965680c65222149e077e9fed1316aa11c05e5f61c9efd9874224',
          previousHash: 'c734ed02a391207ad22a732d5318b8625bc6ec0a4d7772fcdda2191adb8e4f4f',
          merkleRoot: '205231ee785064e0407a77553120ca044c5c643f52aa23731a99e008ac719a16',
          height: 2141254,
          timestamp: 1523645134 },
        { blockchain: 'wav',
          childBlockConfirmationsInParentCount: genesisHeaders[4].getChildBlockConfirmationsInParentCount() + 1,
          hash: '2zBdKozsif6AQMfnfRsCiiiviBQsSaX2p5mmobwDoCUJ6veuSWGZrf9CuNzjhUw4cjpAmiZxvYzgjdVQHvxjMzhU',
          previousHash: '57DGUE3gEjKo5WEYLKkHn2dnLiCoZKiEqGvEGZCbiANFYov4qRk3hgh8CruLZ5gYzjYNsFnWuoNmwjzK7GJ9iPmh',
          merkleRoot: '2zBdKozsif6AQMfnfRsCiiiviBQsSaX2p5mmobwDoCUJ6veuSWGZrf9CuNzjhUw4cjpAmiZxvYzgjdVQHvxjMzhU',
          height: 962470,
          timestamp: 1523901811 }
      ]
    })
  })
})
