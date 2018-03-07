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
        id: 1
      }
    }

    // This function sets req.rpcBody
    middleware(req, null, jest.fn())

    expect(req.rpcBody).toEqual({
      method: 'subtract',
      params: [42, 23],
      msgType: Object
    })
  })

  it('Properly handle invalid request', () => {
    const req = {
      body: {
        jsonrpc: '3.0',
        method: 'subtract',
        params: [ 42, 23 ],
        id: 1
      }
    }
    // This function sets req.rpcBody
    const mockRes = {
      writeHead: jest.fn(),
      end: jest.fn()
    }
    middleware(req, mockRes, jest.fn())

    expect(mockRes.writeHead).toBeCalledWith(400, {"Content-Length": 27, "Content-Type": "application/json"})
    expect(mockRes.end).toBeCalledWith('{"error":"Invalid request"}')
  })
})
