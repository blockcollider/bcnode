/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { type, path } = require('ramda')

const { DbValue } = require('../protos/db_pb')
const { Block, BcBlock, ChildBlockHeader } = require('../protos/core_pb')

const BC_MESSAGE_TYPE_REGEX = new RegExp(/^proto\.bc\.(.*)/)
const _isBCMessageType = (type: string) => BC_MESSAGE_TYPE_REGEX.test(type)
const _getBCConstructorName = (type: string) => BC_MESSAGE_TYPE_REGEX.exec(type)[1]
const DB_VALUES_VERSION = 1

const BC_MESSAGES_MAP = {
  'Block': Block,
  'BcBlock': BcBlock,
  'ChildBlockHeader': ChildBlockHeader
}

/**
 * Provides functions for serializing plain JS types and BC protobuf messages to a Buffer
 * suitable for saving to persistence (currently RocksDB) and deserializing the buffer from persistence
 * back to either BC protobuf message or plain JS value.
 *
 * Buffer returned by serialize reprents DbValue protobuf message which wraps the payload and rememebers metadata about it
 * (namely type, version - for possibility of migrations in the future and the payload itself). The payload itself is
 *  - in case of plain JS object = json stringified value
 *  - in case of BC proto msg = Uint8Array of bytes from message internal serialization process
 *
 * Deserialize always takes Buffer as input because intended use with RocksDB and handles conversion
 * to Uint8Array for Protobuf internal deserialization itself
 */

/**
 * Serializes value into Buffer
 *
 * @param val Value to be serialized
 */
export function serialize (val: Object): Buffer {
  if (val === undefined) {
    throw new Error('Cannot serialize undefined')
  }

  let dbValue
  let valueType = path(['constructor', 'displayName'], val)

  // Serialize BC protobuf messages
  if (valueType && _isBCMessageType(valueType)) {
    dbValue = new DbValue([_getBCConstructorName(valueType), val.serializeBinary(), DB_VALUES_VERSION, false])
  } else { // Serialize native JS types
    valueType = type(val)
    dbValue = new DbValue([
      valueType,
      Buffer.from(JSON.stringify(val)).toString('base64'),
      DB_VALUES_VERSION, true
    ])
  }

  return Buffer.from(dbValue.serializeBinary())
}

/**
 * Deserializes Buffer into appropriate value (with proper type)
 *
 * @param bytes Value to be deserialized
 * @return {{}}
 */
export function deserialize (bytes: Buffer): Object|Error {
  let raw = new Uint8Array(bytes)
  let dbValue
  try {
    dbValue = DbValue.deserializeBinary(raw)

    if (dbValue.getIsNative()) {
      return JSON.parse(Buffer.from(dbValue.getData_asB64(), 'base64').toString())
    }

    return BC_MESSAGES_MAP[dbValue.getType()].deserializeBinary(dbValue.getData())
  } catch (e) {
    if (e instanceof TypeError && dbValue) {
      throw new TypeError(`Could not find '${dbValue.getType()}' in BC_MESSAGES_MAP`)
    }

    throw e
  }
}
