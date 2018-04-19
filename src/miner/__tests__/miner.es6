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
      '0x000x00000'
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
      hash: 'fc3d9ba19e4ad2cdcf3dc488a8d167aeb6352e4f647aecd825ff95d706e44427',
      height: 2,
      merkleRoot: '6afe889d6f083c70df22ff7fc5fd02e66d2ade95b214839661046681d6e9592f',
      difficulty: 32300133975127,
      chainRoot: '132f52a2ae403c18fd6b5d232af8b6860e7d6f5f52df9504e58c2f39c49d7dd4',
      distance: 149658936150412,
      nonce: '0.12137218313968567',
      txCount: 0,
      miner: TEST_MINER_KEY,
      timestamp: newBlockTimestamp,
      transactionsList: [],
      childBlockchainCount: 5,
      childBlockHeadersList: [
        { blockchain: 'btc',
          hash: '0x39499390034',
          previousHash: '0xxxxxxxxxxxxxxxxx',
          childBlockConfirmationsInParentCount: 2,
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 },
        { blockchain: 'eth',
          childBlockConfirmationsInParentCount: 1,
          hash: '0xksjiefjisefmnsef',
          previousHash: 'ospoepfkspdfs',
          merkleRoot: '0x000x00000',
          height: 3,
          timestamp: 1480000000 },
        { blockchain: 'lsk',
          childBlockConfirmationsInParentCount: 2,
          hash: '0x39300923i42034',
          previousHash: '0xxxxxxxxxxxxxxxxx',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 },
        { blockchain: 'wav',
          childBlockConfirmationsInParentCount: 2,
          hash: '0xsjdfo3i2oifji3o2',
          previousHash: '0xxxxxxxxxxxxxxxxx',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 },
        { blockchain: 'neo',
          childBlockConfirmationsInParentCount: 2,
          hash: '0xw3jkfok2jjvijief',
          previousHash: '0xxxxxxxxxxxxxxxxx',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 }
      ]
    })
  })
})
