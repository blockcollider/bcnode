const MinerNative = require('../').MinerNative

const { BlockFingerprint, MinerRequest } = require('../../protos/miner_pb')
const native = require('../../../native/index.node')

describe('MinerNative', () => {
  beforeAll(() => {
    return native.initLogger()
  })

  it('can instantiate self', () => {
    expect(new MinerNative()).toBeInstanceOf(MinerNative)
  })

  test('mine()', () => {
    const minerRequest = new MinerRequest()

    minerRequest.setMerkleRoot('a00422a2bf6dda69b028a53d89fc4c3173190f737bdb1cc441a9fd87aba59169')
    const hashes = [
      new BlockFingerprint(['btc', '7e91edb85d3e293363e5b1b51283a1286f83f671e897ac20078c8791f7e819c6', 1523689935512, true]),
      new BlockFingerprint(['eth', '44a30e5bdbebb77b0616e4cf3038522bb234383a4ee1b3b3944ff6d1024b211a', 1523689953623, true]),
      new BlockFingerprint(['neo', 'fcc819b77d2e0a3369dc82b64970d8339f47fcd0a76481d54109d22134184c88', 1523689953721, true]),
      new BlockFingerprint(['wav', '5658b14f03e0173016c7336858baddb1ca49da3f63856abffba06a2fbd9138c2', 1523689942171, true]),
      new BlockFingerprint(['lsk', '86d2fc436f9ac6f2ce1368a39fc7185a6b93dc784e9a21413f672fa33560b024', 1523689953523, true])
    ]
    minerRequest.setFingerprintsList(hashes)

    const miner = new MinerNative()
    const minerResponse = miner.mine(minerRequest)
    expect(parseInt(minerResponse.getNonce())).not.toBe(null)
  })
})
