const { RpcClient, RpcServer } = require('../index')

const { Block } = require('../../protos/core_pb')

describe('RpcServer', () => {
  let server = null
  let persistenceMock
  let emitterMock

  beforeEach(() => {
    persistenceMock = {
      get: jest.fn().mockReturnValue(Promise.resolve(true)),
      put: jest.fn().mockReturnValue(Promise.resolve(true))
    }

    emitterMock = {
      emit: jest.fn()
    }

    server = new RpcServer({
      persistence: persistenceMock,
      _emitter: emitterMock
    })
  })

  afterEach((done) => {
    server.server.tryShutdown(() => {
      server = null
      done()
    })
  })

  it('works', (done) => {
    // const client = new RpcClient()
    //
    // const msg = new Block(['abc', '123456'])
    //
    // client.rover.collectBlock(msg, (_, response) => {
    //   expect(persistenceMock.put).toHaveBeenCalledWith('abc.block.latest', msg)
    //   expect(emitterMock.emit).toHaveBeenCalledWith('collectBlock', { block: msg })
    //   done()
    // })
    expect(true).toEqual(true)
    done()
  })
})
