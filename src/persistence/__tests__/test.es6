const Persistence = require('../').default

describe('RocksDb', () => {
  it('can instantiate self', () => {
    expect(new Persistence()).toBeInstanceOf(Persistence)
  })

  test('put', () => {
    const db = new Persistence('_data_test')

    db.open()
      .then(() => {
        return db.put('msg', 'hello')
      })
      .then(() => {
        return db.get('msg')
      })
      .then((value) => {
        expect(value.toString()).toEqual('hello')
      })
  })
})
