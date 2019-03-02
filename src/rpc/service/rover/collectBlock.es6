/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Logger } from 'winston'
import type { RpcServer } from '../../server'

const { Null, Block } = require('../../../protos/core_pb')
const logging: Logger = require('../../../logger')
const { blockchainHeadersAreChain } = require('../../../bc/validation')

const log = logging.getLogger(__filename)

export default function (context: RpcServer, call: Object, callback: Function) {
  const block: Block = call.request
  const blockchain = block.getBlockchain()
  const latestKey = `${blockchain}.block.latest`
  const heightKey = `${blockchain}.block.${block.getHeight()}`

  const { server: { engine: { persistence } } } = context
  persistence.get(latestKey).then(oldLatest => {
    if (oldLatest === null) { // no latest
      log.debug(`Did not have latest for ${blockchain}`)
      return persistence.put(latestKey, block).then(() => {
        log.debug(`Stored latest for ${blockchain}`)
      }).then(() => {
        return persistence.put(heightKey, block).then(() => {
          log.debug(`Stored height ${block.getHeight()} for ${blockchain}`)
          callback(null, new Null())
        })
      })
    }

    // there is older latest block, make previous from it
    // $FlowFixMe
    const latestAndNewFormAChain = blockchainHeadersAreChain([block], [oldLatest])
    log.debug(`We have old latest ${latestKey}`)
    return persistence.put(heightKey, block).then(() => {
      log.debug(`Stored height ${block.getHeight()} for ${blockchain}`)
    }).then(() => {
      if (latestAndNewFormAChain) {
        return persistence.put(latestKey, block).then(() => {
          log.debug(`Stored latest for ${blockchain}`)
          callback(null, new Null())
        })
      } else {
        log.debug(`Did not store latest for ${blockchain}, new block does not form a chain with previous latest one`)
        callback(null, new Null())
      }
    })
  }, (error) => { // there is no older latest block, just store
    log.error(error)
    throw new Error(error.message)
  }).then(() => {
    if (context.pubsub && context.pubsub.publish) {
      context.pubsub.publish('rover.block', block)
    }

    context.emitter.emit('collectBlock', { block })
  })
}
