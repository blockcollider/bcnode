/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* global $Values */
import type { BcBlock, Transaction } from '../protos/core_pb'

const { intersperse, is } = require('ramda')
const debug = require('debug')('bcnode:p2p:codec')

const { MESSAGES, MSG_SEPARATOR } = require('./protocol')

export const encodeTypeAndData = (type: $Values<typeof MESSAGES>, data: BcBlock|BcBlock[]|Transaction|Transaction[]): Buffer => {
  debug(`encodeTypeAndData(), t: ${type}`)
  const sep = MSG_SEPARATOR[type]
  const prefix = Buffer.from(type + sep)
  let msg

  const serializeData = (d) => {
    if (d.serializeBinary) {
      return d.serializeBinary()
    }

    return Buffer.from(JSON.stringify(d))
  }

  if (is(Array, data)) {
    // creates array in shape of [msg[1].binary, sep, msg[2].binary, sep, ...]
    msg = Buffer.concat(intersperse(Buffer.from(sep), data.map(m => serializeData(m))))
  } else {
    msg = serializeData(data)
  }

  debug(`encodeTypeAndData(), dlength: ${prefix.length + msg.length}`)

  return Buffer.concat([prefix, msg])
}

export const encodeMessageToWire = (data: Buffer): Buffer => {
  const msgHeader = Buffer.allocUnsafe(4)
  msgHeader.writeUInt32BE(data.length, 0)

  return Buffer.concat([msgHeader, data])
}
