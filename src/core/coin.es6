/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* global $Keys */
const BN = require('bn.js')

export const COIN_FRACS = {
  BOSON: 'boson',
  WEIBETTER: 'weibetter',
  NRG: 'nrg'
}

export const COIN_DIVISORS = {
  [COIN_FRACS.BOSON]: 0,
  [COIN_FRACS.WEIBETTER]: 1,
  [COIN_FRACS.NRG]: 18
}

export const MIN_POSSIBLE_VALUE = new BN(1)

// 9.8 billion NRG in boson
export const MAX_NRG_VALUE = 9800000000
export const MAX_POSSIBLE_VALUE = new BN(MAX_NRG_VALUE).mul(new BN(10).pow(new BN(18)))

function getDivisor (unit) {
  if (unit in COIN_DIVISORS) {
    return COIN_DIVISORS[unit]
  }
  throw new Error('invalid unit')
}

function stringMul (val: string, powTen: number): BN {
  const parts = val.split('.')
  if (parts.length === 1) {
    return (new BN(val)).mul(new BN(10).pow(new BN(powTen)))
  } else if (parts.length === 2) {
    const decimalPart = parts[1]
    if (decimalPart.length >= powTen) {
      const res = parts[0] + parts[1].slice(0, powTen)
      return new BN(res)
    } else {
      const remainderPow = powTen - decimalPart.length
      return (new BN(parts.join(''))).mul(new BN(10).pow(new BN(remainderPow)))
    }
  } else {
    throw new Error(`Invalid value: ${val}`)
  }
}

// converts user supplied value as string and unit to BN
export const humanToBN = (val: string, unit: $Keys<typeof COIN_DIVISORS>): BN => {
  const divisor = getDivisor(unit)
  if (unit === COIN_FRACS.BOSON && val.includes('.')) {
    throw new Error(`Invalid val: ${val}, since boson is the minimum supported unit`)
  }
  const amt = stringMul(val, divisor)
  if (amt.lt(MIN_POSSIBLE_VALUE) || amt.gt(MAX_POSSIBLE_VALUE)) {
    throw new Error('Can not represent such value - out of bounds')
  }

  return amt
}

export const humanToInternal = (val: string, unit: $Keys<typeof COIN_DIVISORS>): Buffer => {
  const amt = humanToBN(val, unit)
  return amt.toBuffer()
}

// supports decimal
export const internalToHuman = (internal: Buffer, unit: $Keys<typeof COIN_DIVISORS>): string => {
  const divisor = getDivisor(unit)
  const valStr = (new BN(internal)).toString(10)

  if (divisor === 0) {
    return valStr
  }

  // valBN / divisor
  if (valStr.length >= divisor) {
    const intPart = valStr.slice(0, valStr.length - divisor)

    const floatPart = valStr.slice(valStr.length - divisor).replace(/0+$/, '')
    if (floatPart === '') {
      return intPart
    } else {
      if (intPart === '') {
        return '0.' + floatPart
      } else {
        return intPart + '.' + floatPart
      }
    }
  } else {
    return ['0', ('0'.repeat(divisor - valStr.length) + valStr).replace(/0+$/, '')].filter(p => p).join('.')
  }
}

export const internalToBN = (internal: Buffer, unit: typeof COIN_FRACS.BOSON): BN => {
  if (unit !== COIN_FRACS.BOSON) {
    throw new Error('internalToBN only supports BOSON')
  }
  return new BN(internal)
}
