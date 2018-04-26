const BN = require('bn.js')
const { Block } = require('../../protos/core_pb')

const {
  calculateHandicap,
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
  test('calculateHandicap() return 0 if any timestamp differs', () => {
    const headers1 = getGenesisBlock().getChildBlockHeadersList()
    const headers2 = getGenesisBlock().getChildBlockHeadersList()

    headers2[0].setTimestamp((Date.now() / 1000) << 0)
    const handicap = calculateHandicap(headers1, headers2)
    expect(handicap).toEqual(0)
  })

  test('calculateHandicap() return 4 if all timestamps are same', () => {
    const genesisBlock = getGenesisBlock()
    const genesisHeaders = genesisBlock.getChildBlockHeadersList()

    const handicap = calculateHandicap(genesisHeaders, genesisHeaders)
    expect(handicap).toEqual(4)
  })

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

    // Mock timestamp - 5 seconds after genesis block
    let mockedTimestamp = mockNow(new Date((genesisBlock.getTimestamp() * 1000) + 5 * 1000)) / 1000 << 0

    // Prepare work for miner
    const work = prepareWork(genesisBlock, headers)

    // Create (not yet existing) block
    const newBlock = prepareNewBlock(
      mockedTimestamp,
      genesisBlock,
      { 'btc': genesisBlock, 'eth': genesisBlock, 'lsk': genesisBlock, 'neo': genesisBlock, 'wav': genesisBlock },
      headers,
      headers[1],
      [], // transactions
      TEST_MINER_KEY
    )

    // Mock timestamp - 3 seconds after work was generated
    mockedTimestamp = mockNow(new Date(mockedTimestamp + 3000)) / 1000 << 0
    mockRandom([0.12137218313968567])

    // Mine new block
    const solution = mine(
      mockedTimestamp,
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
      difficulty: 11801972029398,
      chainRoot: 'daf4c73925e7eb4e67a86cabfb7cc1e257a7af63f6a3f0b3f5991839891fc796',
      distance: 186475791516929,
      nonce: '0.12137218313968567',
      txCount: 0,
      miner: TEST_MINER_KEY,
      timestamp: newBlockTimestamp,
      transactionsList: [],
      childBlockchainCount: 5,
      childBlockHeadersList: [
        { blockchain: 'btc',
          childBlockConfirmationsInParentCount: genesisHeaders[0].getChildBlockConfirmationsInParentCount() + 1,
          hash: genesisHeaders[0].getHash(),
          previousHash: genesisHeaders[0].getPreviousHash(),
          merkleRoot: genesisHeaders[0].getMerkleRoot(),
          height: genesisHeaders[0].getHeight(),
          timestamp: genesisHeaders[0].getTimestamp() },
        { blockchain: 'eth',
          childBlockConfirmationsInParentCount: 1,
          hash: testEthBlock.hash,
          previousHash: testEthBlock.previousHash,
          merkleRoot: testEthBlock.merkleRoot,
          height: testEthBlock.height,
          timestamp: (testEthBlock.timestamp / 1000) },
        { blockchain: 'lsk',
          childBlockConfirmationsInParentCount: genesisHeaders[2].getChildBlockConfirmationsInParentCount() + 1,
          hash: genesisHeaders[2].getHash(),
          previousHash: genesisHeaders[2].getPreviousHash(),
          merkleRoot: genesisHeaders[2].getMerkleRoot(),
          height: genesisHeaders[2].getHeight(),
          timestamp: genesisHeaders[2].getTimestamp() },
        { blockchain: 'neo',
          childBlockConfirmationsInParentCount: genesisHeaders[3].getChildBlockConfirmationsInParentCount() + 1,
          hash: genesisHeaders[3].getHash(),
          previousHash: genesisHeaders[3].getPreviousHash(),
          merkleRoot: genesisHeaders[3].getMerkleRoot(),
          height: genesisHeaders[3].getHeight(),
          timestamp: genesisHeaders[3].getTimestamp() },
        { blockchain: 'wav',
          childBlockConfirmationsInParentCount: genesisHeaders[4].getChildBlockConfirmationsInParentCount() + 1,
          hash: genesisHeaders[4].getHash(),
          previousHash: genesisHeaders[4].getPreviousHash(),
          merkleRoot: genesisHeaders[4].getMerkleRoot(),
          height: genesisHeaders[4].getHeight(),
          timestamp: genesisHeaders[4].getTimestamp() }
      ]
    })
  })

  test('prepareNewBlock()', () => {
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

    // Pick btc header

    let testBtcHeader = TEST_DATA.btc[0]
    // expect(testBtcHeader.previousHash).toEqual(oldHeader.getHash())
    // Change hash, previousHash, timestamp and height
    let newHeader = new Block([
      testBtcHeader.blockchain,
      testBtcHeader.hash, // <-------  the new block would update his previous block
      testBtcHeader.previousHash, // the previous hash from above
      testBtcHeader.timestamp / 1000,
      testBtcHeader.height,
      testBtcHeader.merkleRoot
    ])

    // Update changed header in header list
    headers[0] = newHeader

    // Mock timestamp - 3600 seconds (1 hour) after genesis block
    let mockedTimestamp = mockNow(new Date((genesisBlock.getTimestamp() * 1000) + 3600 * 1000))

    // Create (not yet existing) block
    let newBlock = prepareNewBlock(
      mockedTimestamp,
      genesisBlock,
      { 'btc': genesisBlock, 'eth': genesisBlock, 'lsk': genesisBlock, 'neo': genesisBlock, 'wav': genesisBlock },
      headers,
      headers[0],
      [], // transactions
      TEST_MINER_KEY
    )
    expect(newBlock.getChildBlockHeadersList()[0].getChildBlockConfirmationsInParentCount()).toBe(1)
    expect(newBlock.getChildBlockHeadersList()[1].getChildBlockConfirmationsInParentCount()).toBe(2)
    expect(newBlock.getChildBlockHeadersList()[2].getChildBlockConfirmationsInParentCount()).toBe(2)
    expect(newBlock.getChildBlockHeadersList()[3].getChildBlockConfirmationsInParentCount()).toBe(2)
    expect(newBlock.getChildBlockHeadersList()[4].getChildBlockConfirmationsInParentCount()).toBe(2)

    testBtcHeader = TEST_DATA.btc[1]
    // expect(testBtcHeader.previousHash).toEqual(oldHeader.getHash())
    // Change hash, previousHash, timestamp and height
    newHeader = new Block([
      testBtcHeader.blockchain,
      testBtcHeader.hash, // <-------  the new block would update his previous block
      testBtcHeader.previousHash, // the previous hash from above
      testBtcHeader.timestamp / 1000,
      testBtcHeader.height,
      testBtcHeader.merkleRoot
    ])

    // Update changed header in header list
    headers[0] = newHeader

    // Mock timestamp - 3600 seconds (1 hour) after genesis block
    mockedTimestamp = mockNow(new Date((genesisBlock.getTimestamp() * 1000) + 3600 * 1000))

    // Create (not yet existing) block
    let newBlock2 = prepareNewBlock(
      mockedTimestamp,
      newBlock,
      { 'btc': newBlock, 'eth': genesisBlock, 'lsk': genesisBlock, 'neo': genesisBlock, 'wav': genesisBlock },
      headers,
      headers[0],
      [], // transactions
      TEST_MINER_KEY
    )
    expect(newBlock2.getChildBlockHeadersList()[0].getChildBlockConfirmationsInParentCount()).toBe(1)
    expect(newBlock2.getChildBlockHeadersList()[1].getChildBlockConfirmationsInParentCount()).toBe(3)
    expect(newBlock2.getChildBlockHeadersList()[2].getChildBlockConfirmationsInParentCount()).toBe(3)
    expect(newBlock2.getChildBlockHeadersList()[3].getChildBlockConfirmationsInParentCount()).toBe(3)
    expect(newBlock2.getChildBlockHeadersList()[4].getChildBlockConfirmationsInParentCount()).toBe(3)

    let testLskHeader = TEST_DATA.lsk[0]
    // expect(testBtcHeader.previousHash).toEqual(oldHeader.getHash())
    // Change hash, previousHash, timestamp and height
    newHeader = new Block([
      testLskHeader.blockchain,
      testLskHeader.hash, // <-------  the new block would update his previous block
      testLskHeader.previousHash, // the previous hash from above
      testLskHeader.timestamp / 1000,
      testLskHeader.height,
      testLskHeader.merkleRoot
    ])

    // Update changed header in header list
    headers[2] = newHeader

    // Mock timestamp - 3600 seconds (1 hour) after genesis block
    mockedTimestamp = mockNow(new Date((genesisBlock.getTimestamp() * 1000) + 3600 * 1000))

    // Create (not yet existing) block
    let newBlock3 = prepareNewBlock(
      mockedTimestamp,
      newBlock2,
      { 'btc': newBlock, 'eth': genesisBlock, 'lsk': newBlock2, 'neo': genesisBlock, 'wav': genesisBlock },
      headers,
      headers[2],
      [], // transactions
      TEST_MINER_KEY
    )
    expect(newBlock3.getChildBlockHeadersList()[0].getChildBlockConfirmationsInParentCount()).toBe(2)
    expect(newBlock3.getChildBlockHeadersList()[1].getChildBlockConfirmationsInParentCount()).toBe(4)
    expect(newBlock3.getChildBlockHeadersList()[2].getChildBlockConfirmationsInParentCount()).toBe(1)
    expect(newBlock3.getChildBlockHeadersList()[3].getChildBlockConfirmationsInParentCount()).toBe(4)
    expect(newBlock3.getChildBlockHeadersList()[4].getChildBlockConfirmationsInParentCount()).toBe(4)
  })
})
