const { RocksDb } = require('../')

describe('RocksDb', () => {
  it('can instantiate self', () => {
    expect(new RocksDb()).toBeInstanceOf(RocksDb)
  })

  test('put', () => {
    const db = new RocksDb('_data_test')

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
      .catch((err) => {
        expect(err).toEqual(null)
      })
  })
})
