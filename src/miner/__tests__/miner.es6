const Miner = require('../').Miner


const { Block } = require('../../protos/core_pb')

describe('Miner', () => {
  it('can instantiate self', () => {
    expect(new Miner()).toBeInstanceOf(Miner)
  })

  test('mine()', () => {
    const msg = new Block()
    msg.setBlockchain('btc')
    msg.setHash('123456')

    const miner = new Miner();
    const block = miner.mine(msg)

    expect(block.getBlockchain()).toEqual("bc")
  })
})
