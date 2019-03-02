/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { equals, keys, type, path } = require('ramda')
const debug = require('debug')('bcnode:persistence:serializer')

const { DbValue } = require('../protos/db_pb')
const { Block,
  BcBlock,
  BlockchainHeader,
  BlockchainHeaders,
  Transaction,
  MarkedTransaction,
  TransactionOutput,
  TransactionInput,
  OutPoint
} = require('../protos/core_pb')

const { InitialPeer } = require('../protos/p2p_pb')

const BC_MESSAGE_TYPE_REGEX = new RegExp(/^proto\.bc\.(.*)/)
const _isBCMessageType = (type: string) => BC_MESSAGE_TYPE_REGEX.test(type)
const _getBCConstructorName = (type: string) => BC_MESSAGE_TYPE_REGEX.exec(type)[1]
const DB_VALUES_VERSION = 1

const BC_MESSAGES_MAP = {
  'Block': Block,
  'BcBlock': BcBlock,
  'BlockchainHeader': BlockchainHeader,
  'BlockchainHeaders': BlockchainHeaders,
  'Transaction': Transaction,
  'MarkedTransaction': MarkedTransaction,
  'TransactionOutput': TransactionOutput,
  'TransactionInput': TransactionInput,
  'OutPoint': OutPoint,
  'InitialPeer': InitialPeer
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

// these are exceptions to rule plain JS object should not be stored into persistence
// DO NOT ADD OTHER EXCEPTIONS - create a protobuf message!
const isVersionDataObj = (obj: { version: string, commit: string, db_version: number }) => {
  return equals(keys(obj).sort(), ['commit', 'db_version', 'version'])
}

const isDhtIdObj = (obj: { id: string, timestamp: number }) => {
  return equals(keys(obj).sort(), ['id', 'timestamp'])
}
// end of plain object serialization exceptions

/**
 * Serializes value into Buffer
 *
 * @param val Value to be serialized
 */
export function serialize (val: Object): Buffer {
  debug('serialize() start')
  if (val === undefined) {
    throw new Error('Cannot serialize undefined')
  }

  let dbValue
  let valueType = path(['constructor', 'displayName'], val)
  debug(`valueType: ${valueType}`)

  // Serialize BC protobuf messages
  if (valueType && _isBCMessageType(valueType)) {
    debug(`is BCMessage type, contructor: ${_getBCConstructorName(valueType)}`)
    dbValue = new DbValue([_getBCConstructorName(valueType), val.serializeBinary(), DB_VALUES_VERSION, false])
  } else { // Serialize native JS types
    valueType = type(val)
    debug(`is native type: ${valueType}`)
    if (valueType === 'Null') {
      throw new Error('Cannot store null as a value')
    }

    if (valueType === 'Object' && (!isVersionDataObj(val) && !isDhtIdObj(val))) {
      throw new Error('Cannot store untyped object as a value - introduce new protobuf message for this data')
    }

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
