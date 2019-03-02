/**
 * Copyright (c) 2018-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const toBuffer = require('to-buffer')

export const leftPadBuffer = (maybeBuffer: string|Buffer, length: number): Buffer => {
  const zeros = Buffer.allocUnsafe(length).fill(0)
  const buf = toBuffer(maybeBuffer, 'hex')

  if (buf.length < length) {
    buf.copy(zeros, length - buf.length)
    return zeros
  }
  return buf.slice(-length)
}

export const intToBuffer = (n: number): Buffer => {
  let hex = n.toString(16)
  if (hex.length % 2) {
    hex = `0${hex}`
  }

  return Buffer.from(hex, 'hex')
}

export const bufferToInt = (buf: string|Buffer): number => {
  return parseInt(buf.toString('hex'), 16)
}
