const BN = require('bn.js')
const { Block, BlockchainHeader, BlockchainHeaders } = require('../../protos/core_pb')
const { blake2b, blake2bl } = require('../../utils/crypto')

const {
  prepareNewBlock,
  prepareWork,
  mine,
  getExpFactorDiff,
  getNewPreExpDifficulty,
  getDiff,
  getNewBlockCount,
  getChildrenRootHash,
  distance,
  createMerkleRoot
} = require('../primitives')

const { getGenesisBlock, GENESIS_MINER_KEY } = require('../../bc/genesis')

const { mockRandom } = require('jest-mock-random')
const mockNow = require('jest-mock-now')

const TEST_MINER_KEY = GENESIS_MINER_KEY // crypto.randomBytes(32)

const TEST_DATA = require('../../bc/data').BLOCKS_MAP

describe('getChildrenRootHash', () => {
  it('calculates hash', () => {
    const A_B_CHILDREN_ROOT = '930af0a9ddc0507cc4b3b719f434109d2a894286119b98f4ff77ee7ff358735e'
    expect(getChildrenRootHash([blake2bl('a'), blake2bl('b')]).toString('hex')).toEqual(A_B_CHILDREN_ROOT)
  })

  it('calculates hash 2', () => {
    const A_B_CHILDREN_ROOT = '8539e6b7ce2860e17e6987fe7cb6d1082506ffe9cedcaadae33d9b1486b8030f'
    expect(getChildrenRootHash([blake2bl('hashA' + 'merkleA'), blake2bl('hashB' + 'merkleB')]).toString('hex')).toEqual(A_B_CHILDREN_ROOT)
  })
})

describe('prepareWork', () => {
  it('calculates hash', () => {
    const EMPTY_A_B_WORK = '8de3817a34dd915841536dbf49a38c18271310465df3bc7cf7e5963c51479d53'
    const h = new BlockchainHeader()
    h.setHash('a')
    h.setMerkleRoot('b')
    const hs = new BlockchainHeaders()
    hs.setBtcList([h])
    expect(prepareWork('', hs).toString('hex')).toEqual(EMPTY_A_B_WORK)
  })
})

describe('getExpFactorDiff', () => {
  it('calculates difficulty factor', () => {
    expect(getExpFactorDiff(new BN('290112262029012', 10), 66000000 * 3).toString()).toBe('290112262029014')
  })
})
describe('createMerkleRoot', () => {
  it('calculates merkleRoot', () => {
    expect(createMerkleRoot(['hashA', 'hashB', 'hashC'])).toBe('fd7bedabd562f78058e81c602f5b32fbde8a91f862aee96c849832b0f2ed75e0')
  })
})

describe('prepareWork', () => {
  it('calculates work', () => {
    const headers = new BlockchainHeaders()
    const btcHeader = new BlockchainHeader()
    btcHeader.setHash('btcHashA')
    btcHeader.setMerkleRoot('btcMerkleRootA')
    headers.setBtcList([btcHeader])

    const previousHash = '9b80fc5cba6238801d745ca139ec639924d27ed004c22609d6d9409f1221b8ce'
    const expected = 'fe636d1fcc2d22cc896f8c0c9a48f8c8c19aaa5b945c963c6642683954c05102'

    expect(prepareWork(previousHash, headers)).toBe(expected)
  })
})

describe('getDiff', () => {
  it('calculates difficulty', () => {
    const newestHeader = new BlockchainHeader()
    newestHeader.setTimestamp(1534956353000)
    expect(getDiff(
      1534956535000,
      1534956531000,
      '290112262029015',
      '290112262029012',
      3,
      newestHeader.toObject()
    ).toString()).toBe('8528842191046319905908')
  })
})

describe('distance', () => {
  it('calculates distance correctly', () => {
    const a = '9b80fc5cba6238801d745ca139ec639924d27ed004c22609d6d9409f1221b8ce'
    const b = '781ff33f4d7d36b3f599d8125fd74ed37e2a1564ddc3f06fb22e1b0bf668a4f7'
    expect(distance(a, b)).toBe(238729181486792)
  })
})

describe.skip('Miner', () => {
  test('mine()', () => {
    const genesisBlock = getGenesisBlock()
    const genesisHeaders = genesisBlock.getBlockchainHeaders()

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
      blockchainCount: 5,
      blockchainHeaders: {
        btcList: [{ blockchain: 'btc',
          blockchainConfirmationsInParentCount: genesisHeaders.getBtcList()[0].getBlockchainConfirmationsInParentCount() + 1,
          hash: genesisHeaders.getBtcList()[0].getHash(),
          previousHash: genesisHeaders.getBtcList()[0].getPreviousHash(),
          merkleRoot: genesisHeaders.getBtcList()[0].getMerkleRoot(),
          height: genesisHeaders.getBtcList()[0].getHeight(),
          timestamp: genesisHeaders.getBtcList()[0].getTimestamp() } ],
        ethList: [{ blockchain: 'eth',
          blockchainConfirmationsInParentCount: 1,
          hash: testEthBlock.hash,
          previousHash: testEthBlock.previousHash,
          merkleRoot: testEthBlock.merkleRoot,
          height: testEthBlock.height,
          timestamp: (testEthBlock.timestamp / 1000) } ],
        lskList: [{ blockchain: 'lsk',
          blockchainConfirmationsInParentCount: genesisHeaders.getLskList()[0].getBlockchainConfirmationsInParentCount() + 1,
          hash: genesisHeaders.getLskList()[0].getHash(),
          previousHash: genesisHeaders.getLskList()[0].getPreviousHash(),
          merkleRoot: genesisHeaders.getLskList()[0].getMerkleRoot(),
          height: genesisHeaders.getLskList()[0].getHeight(),
          timestamp: genesisHeaders.getLskList()[0].getTimestamp() } ],
        neoList: [{ blockchain: 'neo',
          blockchainConfirmationsInParentCount: genesisHeaders.getNeoList()[0].getBlockchainConfirmationsInParentCount() + 1,
          hash: genesisHeaders.getNeoList()[0].getHash(),
          previousHash: genesisHeaders.getNeoList()[0].getPreviousHash(),
          merkleRoot: genesisHeaders.getNeoList()[0].getMerkleRoot(),
          height: genesisHeaders.getNeoList()[0].getHeight(),
          timestamp: genesisHeaders.getNeoList()[0].getTimestamp() } ],
        wavList: [{ blockchain: 'wav',
          blockchainConfirmationsInParentCount: genesisHeaders.getWavList()[0].getBlockchainConfirmationsInParentCount() + 1,
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
    const genesisHeaders = genesisBlock.getBlockchainHeaders()

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
    expect(newBlock.getBlockchainHeaders().getBtcList()[0].getBlockchainConfirmationsInParentCount()).toBe(1)
    expect(newBlock.getBlockchainHeaders().getEthList()[0].getBlockchainConfirmationsInParentCount()).toBe(2)
    expect(newBlock.getBlockchainHeaders().getLskList()[0].getBlockchainConfirmationsInParentCount()).toBe(2)
    expect(newBlock.getBlockchainHeaders().getNeoList()[0].getBlockchainConfirmationsInParentCount()).toBe(2)
    expect(newBlock.getBlockchainHeaders().getWavList()[0].getBlockchainConfirmationsInParentCount()).toBe(2)

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
    expect(newBlock2.getBlockchainHeaders().getBtcList()[0].getBlockchainConfirmationsInParentCount()).toBe(1)
    expect(newBlock2.getBlockchainHeaders().getEthList()[0].getBlockchainConfirmationsInParentCount()).toBe(3)
    expect(newBlock2.getBlockchainHeaders().getLskList()[0].getBlockchainConfirmationsInParentCount()).toBe(3)
    expect(newBlock2.getBlockchainHeaders().getNeoList()[0].getBlockchainConfirmationsInParentCount()).toBe(3)
    expect(newBlock2.getBlockchainHeaders().getWavList()[0].getBlockchainConfirmationsInParentCount()).toBe(3)

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
    expect(newBlock3.getBlockchainHeaders().getBtcList()[0].getBlockchainConfirmationsInParentCount()).toBe(2)
    expect(newBlock3.getBlockchainHeaders().getEthList()[0].getBlockchainConfirmationsInParentCount()).toBe(4)
    expect(newBlock3.getBlockchainHeaders().getLskList()[0].getBlockchainConfirmationsInParentCount()).toBe(1)
    expect(newBlock3.getBlockchainHeaders().getNeoList()[0].getBlockchainConfirmationsInParentCount()).toBe(4)
    expect(newBlock3.getBlockchainHeaders().getWavList()[0].getBlockchainConfirmationsInParentCount()).toBe(4)

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

    expect(newBlock4.getBlockchainHeaders().getLskList()).toHaveLength(2)
  })

  test('getNewPreExpDifficulty()', () => {
    const genesisBlock = getGenesisBlock()
    const genesisHeaders = genesisBlock.getBlockchainHeaders()

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

    const newBlockCount = getNewBlockCount(genesisBlock.getBlockchainHeaders(), newBlock.getBlockchainHeaders())

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
