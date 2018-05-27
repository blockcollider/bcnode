const BN = require('bn.js')
const { Block } = require('../../protos/core_pb')

const {
  prepareNewBlock,
  prepareWork,
  mine,
  getNewPreExpDifficulty,
  getNewBlockCount
} = require('../miner')

const { getGenesisBlock, GENESIS_MINER_KEY } = require('../genesis')

const { mockRandom } = require('jest-mock-random')
const mockNow = require('jest-mock-now')

const TEST_MINER_KEY = GENESIS_MINER_KEY // crypto.randomBytes(32)

const TEST_DATA = require('../data').BLOCKS_MAP

describe('Miner', () => {
  test('mine()', () => {
    const genesisBlock = getGenesisBlock()
    const genesisHeaders = genesisBlock.getChildBlockHeaders()

    // Convert genesis headers back to raw Block which is returned by miner
    const headers = Object.values(genesisHeaders.toObject()).reduce((acc, curr) => acc.concat(curr), [])
      .map((oldHeader) => {
        return new Block([
          oldHeader.blockchain,
          oldHeader.hash,
          oldHeader.previousHash,
          oldHeader.timestamp,
          oldHeader.height,
          oldHeader.merkleRoot
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
    const [newBlock, _] = prepareNewBlock( // eslint-disable-line
      mockedTimestamp,
      genesisBlock,
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
      difficulty: 141129464479256,
      chainRoot: 'daf4c73925e7eb4e67a86cabfb7cc1e257a7af63f6a3f0b3f5991839891fc796',
      distance: 186475791516929,
      nonce: '0.12137218313968567',
      txCount: 0,
      miner: TEST_MINER_KEY,
      timestamp: newBlockTimestamp,
      transactionsList: [],
      childBlockchainCount: 5,
      childBlockHeaders: {
        btcList: [{ blockchain: 'btc',
          childBlockConfirmationsInParentCount: genesisHeaders.getBtcList()[0].getChildBlockConfirmationsInParentCount() + 1,
          hash: genesisHeaders.getBtcList()[0].getHash(),
          previousHash: genesisHeaders.getBtcList()[0].getPreviousHash(),
          merkleRoot: genesisHeaders.getBtcList()[0].getMerkleRoot(),
          height: genesisHeaders.getBtcList()[0].getHeight(),
          timestamp: genesisHeaders.getBtcList()[0].getTimestamp() } ],
        ethList: [{ blockchain: 'eth',
          childBlockConfirmationsInParentCount: 1,
          hash: testEthBlock.hash,
          previousHash: testEthBlock.previousHash,
          merkleRoot: testEthBlock.merkleRoot,
          height: testEthBlock.height,
          timestamp: (testEthBlock.timestamp / 1000) } ],
        lskList: [{ blockchain: 'lsk',
          childBlockConfirmationsInParentCount: genesisHeaders.getLskList()[0].getChildBlockConfirmationsInParentCount() + 1,
          hash: genesisHeaders.getLskList()[0].getHash(),
          previousHash: genesisHeaders.getLskList()[0].getPreviousHash(),
          merkleRoot: genesisHeaders.getLskList()[0].getMerkleRoot(),
          height: genesisHeaders.getLskList()[0].getHeight(),
          timestamp: genesisHeaders.getLskList()[0].getTimestamp() } ],
        neoList: [{ blockchain: 'neo',
          childBlockConfirmationsInParentCount: genesisHeaders.getNeoList()[0].getChildBlockConfirmationsInParentCount() + 1,
          hash: genesisHeaders.getNeoList()[0].getHash(),
          previousHash: genesisHeaders.getNeoList()[0].getPreviousHash(),
          merkleRoot: genesisHeaders.getNeoList()[0].getMerkleRoot(),
          height: genesisHeaders.getNeoList()[0].getHeight(),
          timestamp: genesisHeaders.getNeoList()[0].getTimestamp() } ],
        wavList: [{ blockchain: 'wav',
          childBlockConfirmationsInParentCount: genesisHeaders.getWavList()[0].getChildBlockConfirmationsInParentCount() + 1,
          hash: genesisHeaders.getWavList()[0].getHash(),
          previousHash: genesisHeaders.getWavList()[0].getPreviousHash(),
          merkleRoot: genesisHeaders.getWavList()[0].getMerkleRoot(),
          height: genesisHeaders.getWavList()[0].getHeight(),
          timestamp: genesisHeaders.getWavList()[0].getTimestamp() } ]
      }
    })
  })

  test('prepareNewBlock()', () => {
    const genesisBlock = getGenesisBlock()
    const genesisHeaders = genesisBlock.getChildBlockHeaders()

    // Convert genesis headers back to raw Block which is returned by miner
    const headers = Object.values(genesisHeaders.toObject()).reduce((acc, curr) => acc.concat(curr), [])
      .map((oldHeader) => {
        return new Block([
          oldHeader.blockchain,
          oldHeader.hash,
          oldHeader.previousHash,
          oldHeader.timestamp,
          oldHeader.height,
          oldHeader.merkleRoot
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
    let [newBlock, _] = prepareNewBlock( // eslint-disable-line
      mockedTimestamp,
      genesisBlock,
      headers,
      headers[0],
      [], // transactions
      TEST_MINER_KEY
    )
    expect(newBlock.getChildBlockHeaders().getBtcList()[0].getChildBlockConfirmationsInParentCount()).toBe(1)
    expect(newBlock.getChildBlockHeaders().getEthList()[0].getChildBlockConfirmationsInParentCount()).toBe(2)
    expect(newBlock.getChildBlockHeaders().getLskList()[0].getChildBlockConfirmationsInParentCount()).toBe(2)
    expect(newBlock.getChildBlockHeaders().getNeoList()[0].getChildBlockConfirmationsInParentCount()).toBe(2)
    expect(newBlock.getChildBlockHeaders().getWavList()[0].getChildBlockConfirmationsInParentCount()).toBe(2)

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
    let [newBlock2, _2] = prepareNewBlock( // eslint-disable-line
      mockedTimestamp,
      newBlock,
      headers,
      headers[0],
      [], // transactions
      TEST_MINER_KEY
    )
    expect(newBlock2.getChildBlockHeaders().getBtcList()[0].getChildBlockConfirmationsInParentCount()).toBe(1)
    expect(newBlock2.getChildBlockHeaders().getEthList()[0].getChildBlockConfirmationsInParentCount()).toBe(3)
    expect(newBlock2.getChildBlockHeaders().getLskList()[0].getChildBlockConfirmationsInParentCount()).toBe(3)
    expect(newBlock2.getChildBlockHeaders().getNeoList()[0].getChildBlockConfirmationsInParentCount()).toBe(3)
    expect(newBlock2.getChildBlockHeaders().getWavList()[0].getChildBlockConfirmationsInParentCount()).toBe(3)

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
    let [newBlock3, _3] = prepareNewBlock( // eslint-disable-line
      mockedTimestamp,
      newBlock2,
      headers,
      headers[2],
      [], // transactions
      TEST_MINER_KEY
    )
    expect(newBlock3.getChildBlockHeaders().getBtcList()[0].getChildBlockConfirmationsInParentCount()).toBe(2)
    expect(newBlock3.getChildBlockHeaders().getEthList()[0].getChildBlockConfirmationsInParentCount()).toBe(4)
    expect(newBlock3.getChildBlockHeaders().getLskList()[0].getChildBlockConfirmationsInParentCount()).toBe(1)
    expect(newBlock3.getChildBlockHeaders().getNeoList()[0].getChildBlockConfirmationsInParentCount()).toBe(4)
    expect(newBlock3.getChildBlockHeaders().getWavList()[0].getChildBlockConfirmationsInParentCount()).toBe(4)

    // test adding block to an unfinished block
    let testLskHeader2 = TEST_DATA.lsk[1]
    // expect(testBtcHeader.previousHash).toEqual(oldHeader.getHash())
    // Change hash, previousHash, timestamp and height
    newHeader = new Block([
      testLskHeader2.blockchain,
      testLskHeader2.hash, // <-------  the new block would update his previous block
      testLskHeader2.previousHash, // the previous hash from above
      testLskHeader2.timestamp / 1000,
      testLskHeader2.height,
      testLskHeader2.merkleRoot
    ])

    // Update changed header in header list
    headers[2] = newHeader

    // Mock timestamp - 3600 seconds (1 hour) after genesis block
    mockedTimestamp = mockNow(new Date((genesisBlock.getTimestamp() * 1000) + 3600 * 1000))

    // Create (not yet existing) block
    let [newBlock4, _4] = prepareNewBlock( // eslint-disable-line
      mockedTimestamp,
      newBlock2,
      headers,
      headers[2],
      [], // transactions
      TEST_MINER_KEY,
      newBlock3
    )

    expect(newBlock4.getChildBlockHeaders().getLskList()).toHaveLength(2)
  })

  test('getNewPreExpDifficulty()', () => {
    const genesisBlock = getGenesisBlock()
    const genesisHeaders = genesisBlock.getChildBlockHeaders()

    // Convert genesis headers back to raw Block which is returned by miner
    const headers = Object.values(genesisHeaders.toObject()).reduce((acc, curr) => acc.concat(curr), [])
      .map((oldHeader) => {
        return new Block([
          oldHeader.blockchain,
          oldHeader.hash,
          oldHeader.previousHash,
          oldHeader.timestamp,
          oldHeader.height,
          oldHeader.merkleRoot
        ])
      })

    const oldHeader = headers[1]

    // Change hash, previousHash, timestamp and height
    const newHeader = new Block([
      'eth',
      '0x5ea3859a785636dc4894a03e02633f33160269d2fb50366c997e0f3e1e3d0010', // <-------  the new block would update his previous block
      oldHeader.getHash(), // the previous hash from above
      oldHeader.getTimestamp() + 2 * 1000, // <-- new ETH block came 2s after previous one
      oldHeader.getHeight() + 1,
      '0xb1f411fc1bf9a951b33c9c730ff44310782f587828dd89f2d56e40565cdcd488'
    ])

    // Update changed header in header list
    headers[1] = newHeader

    // Mock timestamp - 5 seconds after genesis block
    let mockedTimestamp = mockNow(new Date((genesisBlock.getTimestamp() * 1000) + 2015)) / 1000 << 0 // <-- now is 15 ms after the ETH block came in

    // Create (not yet existing) block
    let [newBlock, _] = prepareNewBlock( // eslint-disable-line
      mockedTimestamp,
      genesisBlock,
      headers,
      headers[1],
      [], // transactions
      TEST_MINER_KEY
    )

    const newBlockCount = getNewBlockCount(genesisBlock.getChildBlockHeaders(), newBlock.getChildBlockHeaders())

    expect(newBlockCount).toBe(1)

    const preExpDiff1 = getNewPreExpDifficulty(
      mockedTimestamp,
      genesisBlock,
      newBlockCount
    )

    expect(preExpDiff1.toNumber()).toBe(142083041941953)

    const preExpDiff2 = getNewPreExpDifficulty(
      mockedTimestamp + 1000,
      genesisBlock,
      newBlockCount
    )
    expect(preExpDiff2.toNumber()).toBe(46725295672253) // <-- stales on this difficulty

    const preExpDiff3 = getNewPreExpDifficulty(
      mockedTimestamp + 2000,
      genesisBlock,
      newBlockCount + 1
    )
    // TODO probably not correct - should be even lower (1s after previous one and +1 block changed)
    expect(preExpDiff3.toNumber()).toBe(46725295672253)
  })
})
