const MTX = require('../mtx')

describe('MTX', () => {
  test('can create instance', () => {
    const uut = new MTX()
    expect(uut).toBeInstanceOf(MTX)
  })
})
