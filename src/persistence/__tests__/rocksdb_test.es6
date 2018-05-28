/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow-disable
 */
const { resolve } = require('path')
const rimraf = require('rimraf')

const { RocksDb } = require('../')

const TEST_DATA_DIR = resolve(__filename, '..', '..', '..', '_data_test')

describe('RocksDb', () => {
  it('can instantiate self', () => {
    expect(new RocksDb()).toBeInstanceOf(RocksDb)
  })

  test('get (batch)', done => {
    const dataDir = `${TEST_DATA_DIR}_get`
    const db = new RocksDb(dataDir)

    const nums = [...Array(100)].map((v, i) => i)
    db.open()
      .then(() => {
        const promises = nums.map((num) => db.put(num, num))
        return Promise.all(promises)
      })
      .then(() => {
        const promises = nums.map((num) => db.get(num))
        return Promise.all(promises)
      })
      .then((res) => {
        nums.forEach((val, index) => {
          expect(val).toEqual(res[index])
        })
        done()
      })
  })

  test('put', done => {
    const dataDir = `${TEST_DATA_DIR}_put`
    const db = new RocksDb(dataDir)

    const key = 'msg'
    const value = 'hello'

    db.open()
      .then(() => db.put(key, value))
      .then(() => db.get(key))
      .then((res) => {
        expect(res).toEqual(value)
        return db.del(key)
      })
      .then((res) => {
        expect(res).toEqual(true)
        return db.close()
      })
      .then(() => {
        done()
      })
      .catch((err) => {
        expect(err).toEqual(null)
      })
  })

  afterAll(done => {
    rimraf(`${TEST_DATA_DIR}*`, () => {
      done()
    })
  })
})
