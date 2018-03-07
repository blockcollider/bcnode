const { RpcClient, RpcServer } = require('../index')

const { Block } = require('../../protos/core_pb')

describe('RpcServer', () => {
  let server = null

  beforeAll(() => {
    server = new RpcServer({
      persistence: {
        put: (key, value) => Promise.resolve(true)
      }
    })
  })

  afterAll((done) => {
    server.server.tryShutdown(() => {
      server = null
      done()
    })
  })

  it('works', (done) => {
    const client = new RpcClient()

    const msg = new Block()
    msg.setBlockchain('abc')
    msg.setHash('123456')

    client.rover.collectBlock(msg, (err, response) => {
      expect(1).toEqual(1)
      done()
    })
  })
})

