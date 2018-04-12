const Miner = require('../').Miner


const { BlockFingerprint, MinerRequest } = require('../../protos/miner_pb')
const native = require('../../../native/index.node')

describe('Miner', () => {
  beforeAll(() => {
    return native.initLogger();
  })

  it('can instantiate self', () => {
    expect(new Miner()).toBeInstanceOf(Miner)
  })

  test('mine()', () => {
    const request = new MinerRequest()

    const blocks = {
      btc: '00000000000000000026651a7e8638c65ec69991d8f5e437ee54867adbf07c49',
      eth: '0x63ef70aa2161f7e23f35996c1f420c8b24a67be231b2ec9147477f6c4c3d868e',
      neo: '0x27a022e66691fc40d264ef615cd1299c9247814fde451390c602160ae954881b',
      wav: '2YzcfeKZW65PvzQP42ocD6XYJMKibRrj2xcvJJwZTqnmrhCyj4TZBymNmh9FAFXBaghvfGbGmpUvg5DjQ5xS3W6C',
      lsk: '4571951483005954606'
    }

    const fingerprints = [
      new BlockFingerprint(['btc', blocks.btc, Date.now(), true]),
      new BlockFingerprint(['eth', blocks.eth, Date.now(), true]),
      new BlockFingerprint(['neo', blocks.neo, Date.now(), true]),
      new BlockFingerprint(['wav', blocks.wav, Date.now(), true]),
      new BlockFingerprint(['lsk', blocks.lsk, Date.now(), true])
    ]
    request.setFingerprintsList(fingerprints)

    const miner = new Miner();
    const response = miner.mine(request)

    expect(parseInt(response.getNonce())).not.toBe(null)
  })
})

