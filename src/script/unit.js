/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
var debug = require('debug')('bcnode:script:units')

var isSafeInteger = function (n) {
  return (typeof n === 'number' &&
        Math.round(n) === n &&
        Number.MIN_SAFE_INTEGER <= n &&
        n <= Number.MAX_SAFE_INTEGER)
}

var Unit = {
  divAssert (a: number, b: number) {
    var aM = a * 100000000
    debug('divSafe: ' + a + ' + ' + b)
    if (!a || a === '0' || Number.isNaN(Number(a)) || Number(a) < 0 || !isFinite(a) || !isSafeInteger(aM)) {
      debug('divSafe: a is invalid -> ' + a)
      return false
    }
    var bM = b * 100000000
    if (!b || b === '0' || Number.isNaN(Number(b)) || Number(b) < 0 || !isFinite(b) || !isSafeInteger(bM)) {
      debug('divSafe: b is invalid -> ' + b)
      return false
    }
    var divValue = parseFloat((a / b).toFixed(8))
    if (divValue === 0) {
      debug('divSafe: div result is 0 ')
      return false
    }
    if (divValue === 0) {
      debug('divSafe: div result is 0 ')
      return false
    }
    return divValue
  },
  div (n: number, d: number, force: boolean) {
    debug(`div: ${n} / ${d}`)
    var val = Unit.divAssert(n, d)
    if (!force && !val) {
      throw Error('operation attempted unsafe unit division')
    }
    return val
  }
}

module.exports = Unit
