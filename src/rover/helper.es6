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
const { RoverClient } = require('../protos/rover_grpc_pb')
const { SettleTxCheckReq } = require('../protos/rover_pb')
const { getLogger } = require('../logger')
const logger = getLogger(__filename)

// const stringifyObject = (obj) => JSON.stringify(obj, null, 2)

async function createUnifiedBlock (isStandalone: boolean, block: Object, roverRpc: RoverClient, transform: Function): Block {
  const unifiedBlock = await transform(roverRpc, block, isStandalone)
  const obj = unifiedBlock.toObject()

  const dir = path.join(obj.blockchain, 'block')
  const filename = `${obj.timestamp}-${obj.hash}.json`

  debugSaveObject(path.join(dir, 'raw', filename), block)
  debugSaveObject(path.join(dir, 'unified', filename), unifiedBlock.toObject())

  // $FlowFixMe
  let hash = (obj.blockchain === 'btc' ? obj.hash.replace(/^0*/, '').slice(0, 8) : obj.hash.slice(0, 8))
  logger.info(`unified block built from ${obj.blockchain}: ${hash}, markedTxsListLength: ${obj.markedTxsList.length}`)

  return unifiedBlock
}

function isBeforeSettleHeight (addrFrom: string, addrTo: string, bridgedChain: string, roverRpc: RoverClient): Promise<boolean> {
  let req = new SettleTxCheckReq()
  req.setAddrFrom(addrFrom)
  req.setAddrTo(addrTo)
  req.setBridgedChain(bridgedChain)

  return new Promise((resolve) => {
    roverRpc.isBeforeSettleHeight(req, (err, response) => {
      if (err) {
        logger.error('isBeforeSettleHeight-response-err:', err.toString(), JSON.stringify(req.toObject()))
        resolve(false)
      } else {
        resolve(response.getIsBeforeSettlementHeight())
      }
    })
  })
}

module.exports = {
  createUnifiedBlock: createUnifiedBlock,
  isBeforeSettleHeight: isBeforeSettleHeight
}
