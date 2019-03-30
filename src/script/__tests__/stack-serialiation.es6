/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const config = require('../config')
const BN = require('bn.js')

// TODO remove this, import from script-stack
var serialize = (data) => {
  return data.toString(config.base)
}
var deserialize = (data) => {
  return new BN(data, config.base)
}

describe('stack serialization and deserialization', () => {
  it('serializes correctly', () => {
    // const ethAddr = '0xfd54078badd5653571726c3370afb127351a6f26'
    // expect(deserialize(serialize(ethAddr))).toBe(ethAddr)

    const data1 = '08192f8e2089ce8afdf11af66ff2bfb1574259a4dccc4150d27cfa489b236e880e2121d6dc3310c853d234129fe0023edaa341ab407c76e0dd243ed2fbbb5f0301'
    expect(deserialize(serialize(data1)).toBuffer().toString('hex')).toBe(data1)

    const data2 = '02514ce489b1aa35ea4c2fda9486f5ef9fb4b5a70bd9650533560d2ef9c2bb8d70'
    expect(deserialize(serialize(data2)).toBuffer().toString('hex')).toBe(data2)

    const data3 = '0992df33fd79c90da6b9db9c86eaa7bd44af96b2d30a2c477c0a89784c4ed744'
    expect(deserialize(serialize(data3)).toBuffer().toString('hex')).toBe(data3)

    // const btcBlockHash = '0000000000000000020ce32303060cd71a212ea97b202deb52309a9880940d4'
    // expect(deserialize(serialize(btcBlockHash)).toBuffer().toString('hex')).toBe(btcBlockHash)
  })
})
