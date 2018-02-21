const MTX = require('../MTX')

describe('MTX', () => {
  test('can create instance', () => {
    const uut = new MTX()
    expect(uut).toBeInstanceOf(MTX)
  })
})
