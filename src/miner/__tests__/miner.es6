const BN = require('bn.js')
const _ = require('lodash')

const {
  blake,
  createMerkleRoot,
  getDiff,
  getExpFactorDiff,
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
      {
        hash: '0x39499390034',
        prevHash: '0xxxxxxxxxxxxxxxxx',
        merkleRoot: '0x000x00000',
        height: 2,
        timestamp: 1400000000
      },
      {
        hash: 'ospoepfkspdfs',
        prevHash: '0xxxxxxxxxxxxxxxxx',
        merkleRoot: '0x000x00000',
        height: 2,
        timestamp: 1400000000
      },
      {
        hash: '0x39300923i42034',
        prevHash: '0xxxxxxxxxxxxxxxxx',
        merkleRoot: '0x000x00000',
        height: 2,
        timestamp: 1400000000
      },
      {
        hash: '0xsjdfo3i2oifji3o2',
        prevHash: '0xxxxxxxxxxxxxxxxx',
        merkleRoot: '0x000x00000',
        height: 2,
        timestamp: 1400000000
      },
      {
        hash: '0xw3jkfok2jjvijief',
        prevHash: '0xxxxxxxxxxxxxxxxx',
        merkleRoot: '0x000x00000',
        height: 2,
        timestamp: 1400000000
      }
    ]

    const oldBestBlockchainHeaderHashes = oldBestBlockchainsBlockHeaders.map(
      function (b) {
        return blake(b.hash + b.merkleRoot)
      }
    )

    const oldChainRoot = oldBestBlockchainHeaderHashes.reduce(function (all, b) {
      return all.xor(new BN(Buffer.from(b, 'hex')))
    }, new BN(0))

    const genesisBlock = {
      hash: '0xxxxxxxxxxxxxxxxxxxxxxxxx', /// BLAKE("prevHashAddress" + "merkleRoot")
      height: 1,
      miner: minerPublicAddress,
      difficulty: 141129464479256,
      timestamp: ((Date.now() / 1000) << 0) - 70,
      merkleRoot: createMerkleRoot(
        oldBestBlockchainHeaderHashes.concat(
          oldTransactions.concat([minerPublicAddress, 1])
        )
      ), // blockchains, transactions, miner address, height
      chainRoot: blake(oldChainRoot.toString()),
      distance: 1, // <--- sign its a genesis block
      nTransactions: 0,
      transactions: oldTransactions,
      nBlockchains: 5,
      blockchainBlockHeaders: oldBestBlockchainsBlockHeaders
    }

    console.log(genesisBlock)

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
      {
        hash: '0x39499390034',
        prevHash: "0xxxxxxxxxxxxxxxxx'",
        merkleRoot: '0x000x00000',
        height: 2,
        timestamp: 1400000000
      },
      {
        hash: '0xksjiefjisefmnsef', // <-------  the new block would update his previous block
        prevHash: 'ospoepfkspdfs', // the previous hash from above
        merkleRoot: '0x000x00000',
        height: 3,
        timestamp: 1480000000
      },
      {
        hash: '0x39300923i42034',
        prevHash: "0xxxxxxxxxxxxxxxxx'",
        merkleRoot: '0x000x00000',
        height: 2,
        timestamp: 1400000000
      },
      {
        hash: '0xsjdfo3i2oifji3o2',
        prevHash: "0xxxxxxxxxxxxxxxxx'",
        merkleRoot: '0x000x00000',
        height: 2,
        timestamp: 1400000000
      },
      {
        hash: '0xw3jkfok2jjvijief',
        prevHash: "0xxxxxxxxxxxxxxxxx'",
        merkleRoot: '0x000x00000',
        height: 2,
        timestamp: 1400000000
      }
    ]

    const blockHashes = newBestBlockchainsBlockHeaders.map(function (header) {
      return blake(header.hash + header.merkleRoot)
    })

    const newChainRoot = blockHashes.reduce(function (all, hash) {
      return all.xor(new BN(Buffer.from(hash, 'hex')))
    }, new BN(0))

    const work = blake(
      newChainRoot
        .xor(
          new BN(
            Buffer.from(
              blake(genesisBlock.hash + genesisBlock.merkleRoot),
              'hex'
            )
          )
        )
        .toString()
    )

    let handicap = 0 // if BC address only, greatly increase difficulty (cataclysmic event)
    const parentColliderBlockDifficulty = new BN(genesisBlock.difficulty, 16) // Assumes parent's difficulty is 141129464479256
    const parentShareDiff = parentColliderBlockDifficulty.div(
      new BN(blockHashes.length + 1, 16)
    )

    const minimumDiff = new BN(11801972029393, 16)
    const minimumDiffShare = minimumDiff.div(new BN(blockHashes.length, 16)) // Standard deviation 100M cycles divided by the number of chains
    const timestampEquality = [
      oldBestBlockchainsBlockHeaders[0].timestamp ===
      newBestBlockchainsBlockHeaders[0].timestamp, // these would be equal
      oldBestBlockchainsBlockHeaders[1].timestamp ===
      newBestBlockchainsBlockHeaders[1].timestamp, // this would be different
      oldBestBlockchainsBlockHeaders[2].timestamp ===
      newBestBlockchainsBlockHeaders[2].timestamp, // this would be equal
      oldBestBlockchainsBlockHeaders[3].timestamp ===
      newBestBlockchainsBlockHeaders[3].timestamp, // this would be equal
      oldBestBlockchainsBlockHeaders[4].timestamp ===
      newBestBlockchainsBlockHeaders[4].timestamp // this would be equal
    ]

    if (_.every(timestampEquality) === true) {
      // If none of the chains have increased in height
      handicap = 4
    }

    const blockColliderShareDiff = getDiff(
      (Date.now() / 1000) << 0,
      genesisBlock.timestamp,
      minimumDiffShare,
      parentShareDiff,
      handicap
    )

    const newDifficulty = newBestBlockchainsBlockHeaders.reduce(function (sum, header, i) {
      return sum.add(
        getDiff(
          header.timestamp,
          oldBestBlockchainsBlockHeaders[i].timestamp,
          parentShareDiff,
          minimumDiffShare
        )
      )
    }, new BN(0))

    newDifficulty.add(blockColliderShareDiff) // Add the Block Collider's chain to the values

    const preExpDiff = getDiff(
      (Date.now() / 1000) << 0,
      genesisBlock.timestamp,
      minimumDiff,
      newDifficulty
    ) // Calculate the final pre-singularity difficulty adjustment

    const newMerkleRoot = createMerkleRoot(
      blockHashes.concat(oldTransactions.concat([minerPublicAddress, 1]))
    ) // blockchains, transactions, miner address, height

    const newBlock = {
      hash: blake(genesisBlock.hash + newMerkleRoot),
      height: genesisBlock.height + 1,
      merkleRoot: newMerkleRoot,
      difficulty: newDifficulty,
      chainRoot: blake(newChainRoot.toString()),
      distance: 0,
      nonce: 0,
      nTransactions: 0,
      transactions: newTransactions,
      nBlockchains: 5,
      blockchainBlockHeaders: newBestBlockchainsBlockHeaders
    }

    newBlock.difficulty = getExpFactorDiff(preExpDiff, genesisBlock.height) // Final difficulty post-singularity calculators <--- this is the threshold hold the work provided must beat

    const solution = mine(
      work,
      minerPublicAddress,
      newMerkleRoot,
      newBlock.difficulty.div(new BN(100000, 16)).toString(), // divide diff in test by huge number to finish quickly
      () => 0.12137218313968567 // fake rng to produce stable test result
    )

    newBlock.distance = solution.distance
    newBlock.nonce = solution.nonce
    newBlock.difficulty = newBlock.difficulty.toString()

    expect(newBlock).toEqual({
      hash: '9b997d19c13614c9745da60e0407136493098b948ea0d80a3678d10169acbeee',
      height: 2,
      merkleRoot: 'c2ee334dc882a6c910eaccd55732eef3f2053fa4dc8c781c4cf4e508646ed10c',
      difficulty: '169690252393619',
      chainRoot: '8f256b08516fd7f4c69539680efd7371553a9f32c94107a793d1e96b899fbd24',
      distance: 146237851348249,
      nonce: '0.12137218313968567',
      nTransactions: 0,
      transactions: [],
      nBlockchains: 5,
      blockchainBlockHeaders: [
        { hash: '0x39499390034',
          prevHash: '0xxxxxxxxxxxxxxxxx\'',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 },
        { hash: '0xksjiefjisefmnsef',
          prevHash: 'ospoepfkspdfs',
          merkleRoot: '0x000x00000',
          height: 3,
          timestamp: 1480000000 },
        { hash: '0x39300923i42034',
          prevHash: '0xxxxxxxxxxxxxxxxx\'',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 },
        { hash: '0xsjdfo3i2oifji3o2',
          prevHash: '0xxxxxxxxxxxxxxxxx\'',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 },
        { hash: '0xw3jkfok2jjvijief',
          prevHash: '0xxxxxxxxxxxxxxxxx\'',
          merkleRoot: '0x000x00000',
          height: 2,
          timestamp: 1400000000 }
      ]
    })
  })
})
