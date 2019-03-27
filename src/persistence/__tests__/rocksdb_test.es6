/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { join } = require('path')
const { tmpdir } = require('os')
const rimraf = require('rimraf')

const { RocksDb } = require('../')
const { BcBlock } = require('../../protos/core_pb')

const TEST_DATA_DIR = join(tmpdir(), 'bcnode_db_test')

describe('RocksDb', () => {
  it('can instantiate self', () => {
    expect(new RocksDb()).toBeInstanceOf(RocksDb)
  })

  test('get', done => {
    const dataDir = `${TEST_DATA_DIR}_get`
    const db = new RocksDb(dataDir)
    const key = 'key'
    const value = 'value'

    db.open()
      .then(() => {
        return db.put(key, value)
      })
      .then(() => {
        return db.get('key')
      })
      .then((res) => {
        expect(res).toEqual(value)
        done()
      })
  })

  test('get (not found)', (done) => {
    const dataDir = `${TEST_DATA_DIR}_get_not_found`
    const db = new RocksDb(dataDir)
    const key = 'does.not.exist'
    db.open()
      .then(() => {
        return db.get(key)
      })
      .then((res) => {
        expect(res).toBe(null)
        done()
      })
  })

  test('get (bulk)', done => {
    const dataDir = `${TEST_DATA_DIR}_get_bulk`
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

  test('get (bulk array)', done => {
    const dataDir = `${TEST_DATA_DIR}_get_bulk_array`
    const db = new RocksDb(dataDir)

    const nums = [...Array(100)].map((v, i) => i)
    db.open()
      .then(() => {
        const promises = nums.map((num) => db.put(num, num))
        return Promise.all(promises)
      })
      .then(() => {
        return db.getBulk(nums)
      })
      .then((res) => {
        nums.forEach((val, index) => {
          expect(val).toEqual(res[index])
        })
        done()
      })
  })

  test('get (bulk array) missing', done => {
    const dataDir = `${TEST_DATA_DIR}_get_bulk_missing`
    const db = new RocksDb(dataDir)

    const vals = [1, 2]
    db.open()
      .then(() => {
        const promises = vals.map((val) => db.put(val, val))
        return Promise.all(promises)
      })
      .then(() => {
        return db.getBulk([...vals, 3])
      })
      .then((res) => {
        vals.forEach((val, index) => {
          expect(val).toEqual(res[index])
        })
        done()
      })
  })

  test('get (bulk array) missing', done => {
    const dataDir = `${TEST_DATA_DIR}_get_bulk_array_missing`
    const db = new RocksDb(dataDir)

    const vals = [1, 2]
    db.open()
      .then(() => {
        const promises = vals.map((val) => db.put(val, val))
        return Promise.all(promises)
      })
      .then(() => {
        const promises = vals.map((num) => db.get(num))
        return Promise.all(promises)
      })
      .then((res) => {
        vals.forEach((val, index) => {
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

  describe('scheduled operations', () => {
    test('are stored correctly', async () => {
      const OP1 = [37, 'del', 'testing.key.123', 'bc']
      const OP2 = [37, 'put', 'block.key.123', 'test_value', 'bc']
      const dataDir = `${TEST_DATA_DIR}_scheduled_common`
      const db = new RocksDb(dataDir)
      await db.open()
      await db.scheduleAtBlockHeight(OP1[0], OP1[1], OP1[2])
      let ops = await db.get('bc.schedule.37')
      expect(ops).toEqual([OP1])

      // same operation will not be scheduled twice
      await db.scheduleAtBlockHeight(OP1[0], OP1[1], OP1[2])
      ops = await db.get('bc.schedule.37')
      expect(ops).toEqual([OP1])

      // different op gets stored
      await db.scheduleAtBlockHeight(OP2[0], OP2[1], OP2[2], OP2[3])
      ops = await db.get('bc.schedule.37')
      expect(ops).toEqual([OP1, OP2])
    })

    describe('get', () => {
      it('gets does nothing', async () => {
        const dataDir = `${TEST_DATA_DIR}_scheduled_get`
        const db = new RocksDb(dataDir)
        await db.open()
        await db.put('testing.key.123', 'trololo')
        await db.scheduleAtBlockHeight(37, 'get', 'testing.key.123')
        await db.runScheduledOperations(36)
        let val = await db.get('testing.key.123')
        expect(val).toBe('trololo')
        await db.runScheduledOperations(37)
        val = await db.get('testing.key.123')
        expect(val).toBe('trololo')
      })
    })

    describe('put', () => {
      it('puts defined value as scheduled height at defined key', async () => {
        const dataDir = `${TEST_DATA_DIR}_scheduled_put_1`
        const db = new RocksDb(dataDir)
        await db.open()
        await db.scheduleAtBlockHeight(37, 'put', 'testing.key.123', 'tralala')
        await db.runScheduledOperations(36)
        let val = await db.get('testing.key.123')
        expect(val).toBe(null)
        await db.runScheduledOperations(37)
        val = await db.get('testing.key.123')
        expect(val).toBe('tralala')
      })

      it('fails with Block or any other protobuf because operation is not a protobuf itself now', async () => {
        const dataDir = `${TEST_DATA_DIR}_scheduled_put_2`
        const db = new RocksDb(dataDir)
        await db.open()
        await db.scheduleAtBlockHeight(37, 'put', 'testing.key.123', new BcBlock())
        // see https://github.com/facebook/jest/issues/1700 for explanation why can't use toThrow matcher
        await expect(db.runScheduledOperations(37)).rejects.toThrow()
      })
    })

    describe('del', () => {
      it('deletes scheduled key at defined height', async () => {
        const dataDir = `${TEST_DATA_DIR}_scheduled_del`
        const db = new RocksDb(dataDir)
        await db.open()
        await db.put('testing.key.123', 'trololo')
        await db.scheduleAtBlockHeight(37, 'del', 'testing.key.123')
        await db.runScheduledOperations(36)
        let op = await db.get('testing.key.123')
        expect(op).toBe('trololo')
        await db.runScheduledOperations(37)
        op = await db.get('testing.key.123')
        expect(op).toBe(null)
      })
    })

    describe('delfromlist', () => {
      it('deletes scheduled item from array under key at defined height', async () => {
        const dataDir = `${TEST_DATA_DIR}_scheduled_delfromlist`
        const db = new RocksDb(dataDir)
        await db.open()
        await db.put('testing.key.123', ['a', 'b'])
        const ok = await db.scheduleAtBlockHeight(37, 'delfromlist', 'testing.key.123', 'a')
        expect(ok).toBe(true)
        await db.runScheduledOperations(36)
        let val = await db.get('testing.key.123')
        expect(val).toEqual(['a', 'b'])
        await db.runScheduledOperations(37)
        val = await db.get('testing.key.123')
        expect(val).toEqual(['b'])
      })
    })
  })

  afterAll(done => {
    rimraf(`${TEST_DATA_DIR}*`, () => {
      done()
    })
  })
})
