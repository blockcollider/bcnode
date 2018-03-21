const Miner = require('../').Miner


const { BlockIn } = require('../../protos/miner_pb')

describe('Miner', () => {
  it('can instantiate self', () => {
    expect(new Miner()).toBeInstanceOf(Miner)
  })

  test('mine()', () => {
    const blockIn = new BlockIn()
    blockIn.setBlockchain('btc')
    blockIn.setHash('123456')

    const miner = new Miner();
    const blockOut = miner.mine(blockIn)

    expect(blockOut.getBlockchain()).toEqual('btc')
  })
})
