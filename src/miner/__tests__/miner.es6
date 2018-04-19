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

describe('Miner', () => {
  test('mine()', () => {
    const genesisBlock = getGenesisBlock()

    // Convert genesis headers back to raw Block which is returned by miner
    const headers = genesisBlock.getChildBlockHeadersList()
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

    // Change hash, previousHash, timestamp and height
    const newHeader = new Block([
      oldHeader.getBlockchain(),
      '0xksjiefjisefmnsef', // <-------  the new block would update his previous block
      oldHeader.getHash(), // the previous hash from above
      oldHeader.getTimestamp() + 80000000,
      oldHeader.getHeight() + 1,
      oldHeader.getMerkleRoot()
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

    expect(newBlock.toObject()).toEqual({
      hash: '27f96ca47666d836d9eac0bd17f30c5bb43e969ebfe0927f33ced1800da3af51',
      height: 2,
      merkleRoot: '75bb4b50a919ef4c3341368668d129b6fcb41429c05812e893b7db2bada383f0',
      difficulty: 11801971879903,
      chainRoot: '7fd42cbc938e0f90383d8c8aa31d0f8f356d7e12ec63261cbae73f7fbea483dc',
      distance: 177300997373305,
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
          childBlockConfirmationsInParentCount: 2,
          merkleRoot: 'ea5f5cd60d98846778d39d02a7a49844a93c2bb1608e602eaf6a93675effa5d5',
          height: 518390,
          timestamp: 1523829019 },
        { blockchain: 'eth',
          childBlockConfirmationsInParentCount: 1,
          hash: '0xksjiefjisefmnsef',
          previousHash: '0xa0c8290fbbefa0410ea7e727ce1f2a7ee7c6db1495a92e0f8778201c13dcef2b',
          merkleRoot: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
          height: 5451805,
          timestamp: 1603844539 },
        { blockchain: 'lsk',
          childBlockConfirmationsInParentCount: 2,
          hash: '2875516409288438346',
          previousHash: '6899263519938768036',
          merkleRoot: '2875516409288438346',
          height: 5743193,
          timestamp: 1523894800 },
        { blockchain: 'neo',
          childBlockConfirmationsInParentCount: 2,
          hash: '3a7faa52678c965680c65222149e077e9fed1316aa11c05e5f61c9efd9874224',
          previousHash: 'c734ed02a391207ad22a732d5318b8625bc6ec0a4d7772fcdda2191adb8e4f4f',
          merkleRoot: '205231ee785064e0407a77553120ca044c5c643f52aa23731a99e008ac719a16',
          height: 2141254,
          timestamp: 1523645134 },
        { blockchain: 'wav',
          childBlockConfirmationsInParentCount: 2,
          hash: '2zBdKozsif6AQMfnfRsCiiiviBQsSaX2p5mmobwDoCUJ6veuSWGZrf9CuNzjhUw4cjpAmiZxvYzgjdVQHvxjMzhU',
          previousHash: '57DGUE3gEjKo5WEYLKkHn2dnLiCoZKiEqGvEGZCbiANFYov4qRk3hgh8CruLZ5gYzjYNsFnWuoNmwjzK7GJ9iPmh',
          merkleRoot: '2zBdKozsif6AQMfnfRsCiiiviBQsSaX2p5mmobwDoCUJ6veuSWGZrf9CuNzjhUw4cjpAmiZxvYzgjdVQHvxjMzhU',
          height: 962470,
          timestamp: 1523901811 }
      ]
    })
  })
})
