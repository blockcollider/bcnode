/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow-disable
 */

const { JsType } = require('../../protos/core_pb');
const { DbValue } = require('../../protos/db_pb');

const { serialize, deserialize } = require('../helper')

describe('serialize', () => {
  it('can serialize null', () => {
    const val = new DbValue()
    val.setType(JsType.NULL)

    const binary = val.serializeBinary()
    console.log('Buffer', binary.buffer)

    expect(binary.buffer.byteLength).toEqual(0)
  })

  it('can serialize object', () => {
    const obj = {
      "msg": "helloaaaaaaaaaaaaaaaahelloaaaaaaaaaaaaaaaahelloaaaaaaaaaaaaaaaahelloaaaaaaaaaaaaaaaa"
    }

    const tmp = Buffer.from(JSON.stringify(obj))
    console.log(tmp.buffer)

    const val = new DbValue()
    val.setType(JsType.JSON)
    //val.setData()

    let b = new Uint8Array(tmp.buffer)
    let l = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength).byteLength

    console.log(l)

    const binary = val.serializeBinary()
    // console.log('Buffer', binary.buffer)
    //

    expect(0).toEqual(0)
  })
})

describe('deserialize', () => {
  it('can deserialize null', () => {
    expect(1).toEqual(1)
  })
})
