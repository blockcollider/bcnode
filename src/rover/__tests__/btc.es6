const Controller = require('../btc').Controller
const Network = require('../btc').Network

describe('Controller', () => {
  it('can instantiate self', () => {
    expect(new Controller()).toBeInstanceOf(Controller)
  })
})

describe('Network', () => {
  it('can instantiate self', () => {
    expect(new Network()).toBeInstanceOf(Network)
  })
})
