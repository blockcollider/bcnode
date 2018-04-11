const Miner = require('../').Miner


const { BlockchainHash, BlockIn } = require('../../protos/miner_pb')
const native = require('../../../native/index.node')

describe('Miner', () => {
  beforeAll(() => {
    return native.initLogger();
  })

  it('can instantiate self', () => {
    expect(new Miner()).toBeInstanceOf(Miner)
  })

  test('mine()', () => {
    const blockIn = new BlockIn()

    blockIn.setThreshold(0.5);
    const hashes = [
      new BlockchainHash(["btc", "123"]),
      new BlockchainHash(["eth", "234"]),
      new BlockchainHash(["neo", "345"]),
      new BlockchainHash(["wav", "456"]),
      new BlockchainHash(["lsk", "567"]),
    ]
    blockIn.setHashesList(hashes);

    const miner = new Miner();
    const blockOut = miner.mine(blockIn)

    expect(parseInt(blockOut.getNonce())).not.toBe(null)
  })
})

