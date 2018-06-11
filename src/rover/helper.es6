/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const path = require('path')
const { debugSaveObject } = require('../debug')
const { Block } = require('../protos/core_pb')
const { getLogger } = require('../logger')
const logger = getLogger(__filename)

// const stringifyObject = (obj) => JSON.stringify(obj, null, 2)

export function createUnifiedBlock (block: Object, transform: Function): Block {
  const unifiedBlock = transform(block)
  const obj = unifiedBlock.toObject()

  const dir = path.join(obj.blockchain, 'block')
  const filename = `${obj.timestamp}-${obj.hash}.json`

  debugSaveObject(path.join(dir, 'raw', filename), block)
  debugSaveObject(path.join(dir, 'unified', filename), unifiedBlock.toObject())

  // $FlowFixMe
  logger.info(`unified block built from ${obj.blockchain} ${obj.hash.slice(0, 8)}`)

  return unifiedBlock
}
