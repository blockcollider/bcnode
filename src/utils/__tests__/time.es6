/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const mockNow = require('jest-mock-now')

jest.mock('sntp')
const Sntp = require('sntp')

const ts = require('../time').default
const MOCK_DATE_UNIX = 1523000000000 // 2018-04-06T07:33:20.000Z

describe('time', () => {
  it('has correct default state', () => {
    expect(ts.isStarted).toBe(false)
    expect(ts.offset).toBe(0)
  })

  describe('running', () => {
    beforeEach(() => {
      mockNow(new Date(MOCK_DATE_UNIX))
      Sntp.time = jest.fn((opts, callback) => { callback(null, { t: 1142.221312 }) })
      ts.start()
    })

    afterEach(() => {
      ts.stop()
      Date.now.mockRestore()
    })

    describe('sync', () => {
      it('returns dates with shift', () => {
        expect(ts.offset).toBe(1142)
        expect(ts.now()).toBe(1523000001142)
        expect(ts.iso()).toBe('2018-04-06T07:33:21Z')
        expect(ts.getDate()).toEqual(new Date('2018-04-06T07:33:21.142Z'))
      })
    })

    describe('offsetOverride', () => {
      it('allows to override offset', () => {
        ts.offsetOverride(1142)
        expect(ts.now()).toBe(1523000001142)
        expect(ts.iso()).toBe('2018-04-06T07:33:21Z')
        expect(ts.getDate()).toEqual(new Date('2018-04-06T07:33:21.142Z'))
      })
    })
  })
})
