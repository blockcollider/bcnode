const { RpcClient, RpcServer } = require('../index')

const { Block } = require('../../protos/core_pb')

describe('RpcServer', () => {
  let server = null
  let persistenceMock

  beforeEach(() => {
    persistenceMock = {
      put: jest.fn().mockReturnValue(Promise.resolve(true))
    }

    server = new RpcServer({
      persistence: persistenceMock
    })
  })

  afterEach((done) => {
    server.server.tryShutdown(() => {
      server = null
      done()
    })
  })

  it('works', (done) => {
    const client = new RpcClient()

    const msg = new Block(['abc', '123456'])
    // msg.setBlockchain('abc')
    // msg.setHash('123456')

    client.rover.collectBlock(msg, (err, response) => {
      expect(persistenceMock.put).toHaveBeenCalledWith('abc.block.latest', '123456')
      done()
    })
  })
})
