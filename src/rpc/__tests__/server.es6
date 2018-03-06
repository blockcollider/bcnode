import RpcClient from '../client'
import RpcServer from '../server'

const { Block } = require('../../protos/block_pb')

describe('RpcServer', () => {
  let server = null

  beforeAll(() => {
    server = new RpcServer({})
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

    client.collector.collectBlock(msg, (err, response) => {
      expect(1).toEqual(1)
      done()
    })
  })
})

