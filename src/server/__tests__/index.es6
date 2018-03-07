const { jsonRpcMiddleware } = require('../index')

describe('jsonRpcMiddleware', () => {
  const mapping = {
    subtract: Object
  }



  let middleware = null

  beforeEach(() =>  {
    middleware = jsonRpcMiddleware(mapping)
  })

  it('Properly converts incoming json rpc payload', () => {
    const req = {
      body: {
        jsonrpc: '2.0',
        method: 'subtract',
        params: [ 42, 23 ],
        id: 42
      }
    }

    // This function sets req.rpcBody
    middleware(req, null, jest.fn())

    expect(req.rpcBody).toEqual({
      method: 'subtract',
      params: [42, 23],
      MsgType: Object,
      id: 42
    })
  })

  it('Properly handle invalid request', () => {
    const req = {
      body: {
        jsonrpc: '3.0',
        method: 'subtract',
        params: [ 42, 23 ],
        id: 42
      }
    }
    // This function sets req.rpcBody
    const mockRes = {
      json: jest.fn(),
    }
    middleware(req, mockRes, jest.fn())

    expect(mockRes.json).toBeCalledWith({code: -32600, message: 'Invalid Request'})
  })
})
