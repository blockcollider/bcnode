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
const { Block } = require('../protos/core_pb')

const BC_MESSAGE_TYPE_REGEX = new RegExp(/^proto\.bc\.(.*)/)
const _isBCMessageType = (type: string) => BC_MESSAGE_TYPE_REGEX.test(type)
const _getBCConstructorName = (type: string) => BC_MESSAGE_TYPE_REGEX.exec(type)[1]
const DB_VALUES_VERSION = 1

const BC_MESSAGES_MAP = {
  'proto.bc.Block': Block
}

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
  if (valueType && _isBCMessageType(type)) {
    dbValue = new DbValue([_getBCConstructorName(valueType), val.serializeBinary(), DB_VALUES_VERSION, false])
  } else { // Serialize native JS types
    valueType = type(val)
    dbValue = new DbValue([
      valueType,
      Buffer.from(JSON.stringify(val)).toString('base64'),
      DB_VALUES_VERSION, true
    ])
  }

  return dbValue.serializeBinary()
}

/**
 * Deserializes Buffer into appropriate value (with proper type)
 *
 * @param bytes Value to be deserialized
 * @return {{}}
 */
export function deserialize (bytes: Buffer): Object|Error {
  const dbValue = DbValue.deserializeBinary(bytes)

  if (dbValue.getIsNative()) {
    return JSON.parse(Buffer.from(dbValue.getData_asB64(), 'base64').toString())
  }

  try {
    return BC_MESSAGES_MAP[dbValue.getType()].deserializeBinary(dbValue.getData())
  } catch (e) {
    if (e instanceof TypeError) {
      throw new TypeError(`Could not find ${dbValue.getType()} in BC_MESSAGES_MAP`)
    }

    throw e
  }
}
