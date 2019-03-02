/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const BN = require('bn.js')
const { humanToInternal, internalToHuman, humanToBN, COIN_FRACS, COIN_DIVISORS } = require('../coin')
const { NRG, WEIBETTER, BOSON } = COIN_FRACS

describe('coin utils', () => {
  const errorTests = [
    { value: '0.9', unit: BOSON, msg: 'Invalid val' },
    { value: '0.02345', unit: WEIBETTER, msg: 'Can not represent such value - out of bounds' },
    { value: '0.02.345', unit: WEIBETTER, msg: 'Invalid value' },
    { value: '9800000001', unit: NRG, msg: 'Can not represent such value - out of bounds' }
  ]
  for (let { value, unit, msg } of errorTests) {
    it(`test errors with value ${value} ${unit}`, () => {
      expect(() => {
        humanToInternal(value, unit)
      }).toThrowError(msg)
    })
  }

  const tests = [
    { value: '1', unit: BOSON, expected: new BN(1) },
    { value: '10', unit: BOSON, expected: new BN(10) },

    { value: '2', unit: WEIBETTER, expected: new BN(20) },
    { value: '10', unit: WEIBETTER, expected: new BN(100) },
    { value: '11', unit: NRG, expected: new BN(11).mul(new BN(10).pow(new BN(COIN_DIVISORS[NRG]))) },

    { value: '0.2', unit: WEIBETTER, expected: new BN(2) },
    { value: '0.2845', unit: WEIBETTER, expected: new BN(2) },
    { value: '10.2', unit: WEIBETTER, expected: new BN(102) },
    { value: '10.2345', unit: WEIBETTER, expected: new BN(102) },

    { value: '0.1', unit: NRG, expected: new BN(1).mul(new BN(10).pow(new BN(COIN_DIVISORS[NRG] - 1))) },
    { value: '0.001', unit: NRG, expected: new BN(1).mul(new BN(10).pow(new BN(COIN_DIVISORS[NRG] - 3))) },
    { value: '10.2', unit: NRG, expected: new BN(102).mul(new BN(10).pow(new BN(COIN_DIVISORS[NRG] - 1))) },
    { value: '10.02', unit: NRG, expected: new BN(1002).mul(new BN(10).pow(new BN(COIN_DIVISORS[NRG] - 2))) },
    { value: '10.21', unit: NRG, expected: new BN(1021).mul(new BN(10).pow(new BN(COIN_DIVISORS[NRG] - 2))) }
  ]

  for (let { value, unit, expected } of tests) {
    it(`converts human defined value ${value} ${unit} to BN`, () => {
      expect(humanToBN(value, unit).eq(expected)).toBe(true)
    })
  }

  const internalToHumanTests = [
    { value: Buffer.from('01', 'hex'), unit: BOSON, expected: '1' },

    { value: Buffer.from('01', 'hex'), unit: WEIBETTER, expected: '0.1' },
    { value: Buffer.from('0a', 'hex'), unit: WEIBETTER, expected: '1' },
    { value: Buffer.from('0c', 'hex'), unit: WEIBETTER, expected: '1.2' },
    { value: Buffer.from('64', 'hex'), unit: WEIBETTER, expected: '10' },
    { value: Buffer.from('044c', 'hex'), unit: WEIBETTER, expected: '110' },
    { value: (new BN('1116')).toBuffer(), unit: WEIBETTER, expected: '111.6' },

    { value: (new BN('9799999998999999999999998766')).toBuffer(), unit: NRG, expected: '9799999998.999999999999998766' },
    { value: (new BN('9799999998000000000000000000')).toBuffer(), unit: NRG, expected: '9799999998' },
    { value: (new BN('9799999998010000000000000000')).toBuffer(), unit: NRG, expected: '9799999998.01' },
    { value: (new BN('9799999998010800000000000000')).toBuffer(), unit: NRG, expected: '9799999998.0108' },
    { value: (new BN('8000000000000000000')).toBuffer(), unit: NRG, expected: '8' },
    { value: (new BN('900000000000000000')).toBuffer(), unit: NRG, expected: '0.9' },
    { value: (new BN('90000000000000000')).toBuffer(), unit: NRG, expected: '0.09' },
    { value: (new BN('90010000000000000')).toBuffer(), unit: NRG, expected: '0.09001' },
    { value: (new BN('9010000000000000')).toBuffer(), unit: NRG, expected: '0.00901' },
    { value: (new BN('0')).toBuffer(), unit: NRG, expected: '0' },
    { value: (new BN('0000')).toBuffer(), unit: NRG, expected: '0' }
  ]

  for (let { value, unit, expected } of internalToHumanTests) {
    it(`converts internal defined value ${value.toString('hex')} ${unit} to human`, () => {
      expect(internalToHuman(value, unit)).toEqual(expected)
    })
  }

  it('converts human defined value to internal representation', () => {
    // boson
    // the smallest possible fraction
    expect(humanToInternal('1', BOSON)).toEqual(Buffer.from('01', 'hex'))
    expect(humanToInternal('15', BOSON)).toEqual(Buffer.from('0f', 'hex'))

    // weibetter
    expect(humanToInternal('1', WEIBETTER)).toEqual(Buffer.from('0a', 'hex'))
    expect(humanToInternal('23', WEIBETTER)).toEqual(Buffer.from('e6', 'hex'))

    // nrg
    expect(humanToInternal('1', NRG)).toEqual(Buffer.from('0de0b6b3a7640000', 'hex'))
    // nrg max supply
    expect(humanToInternal('9800000000', NRG)).toEqual(Buffer.from('1faa5eb88494e8bb48000000', 'hex'))
  })

  it('converts internal value to human representation', () => {
    // boson
    expect(internalToHuman(Buffer.from('01', 'hex'), BOSON)).toEqual('1')
    expect(internalToHuman(Buffer.from('0f', 'hex'), BOSON)).toEqual('15')

    // weibetter
    expect(internalToHuman(Buffer.from('0a', 'hex'), WEIBETTER)).toEqual('1')
    expect(internalToHuman(Buffer.from('e6', 'hex'), WEIBETTER)).toEqual('23')

    // nrg
    expect(internalToHuman(Buffer.from('0de0b6b3a7640000', 'hex'), NRG)).toEqual('1')
    // nrg max supply
    expect(internalToHuman(Buffer.from('1faa5eb88494e8bb48000000', 'hex'), NRG)).toEqual('9800000000')
  })
})
