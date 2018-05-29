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

  test('getBtAddressBalance', done => {
    const dataDir = `${TEST_DATA_DIR}_balances`
    const db = new RocksDb(dataDir)
    const rawGenesisBlock = require('../../bc/genesis.raw.es6')
    const goodAddress = '0x676932A26A3e9Ee9A23F836C939805433e60066F'
    // const badAddress = '32A26A3e9Ee9A23F836C939805433e600'

    db.open()
      .then(() => db.put('bc.block.latest', rawGenesisBlock))
      .then(() => db.put('bc.block.1', rawGenesisBlock))
      .then(() => Promise.resolve(db.getBtAddressBalance(goodAddress)))
      .then((res) => {
        expect(res).toEqual({ unconfirmed: 0, confirmed: 0 })
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
    rimraf(TEST_DATA_DIR, () => {
      done()
    })
  })
})
