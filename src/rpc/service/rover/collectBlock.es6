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

const { Null } = require('../../../protos/core_pb')
const logging: Logger = require('../../../logger')

const log = logging.getLogger(__filename)

export default function (context: RpcServer, call: Object, callback: Function) {
  const block = call.request
  const blockchain = block.getBlockchain()
  const key = `${blockchain}.block.latest`
  const heightKey = `${blockchain}.block.${block.getHeight()}`

  const { server: { engine: { persistence } } } = context
  persistence.get(key).then(oldLatest => {
    // there is older latest block, make previous from it
    log.debug(`We have old latest ${key}`)
    return persistence.put(`${blockchain}.block.previous`, oldLatest).then(() => {
      log.debug(`Stored previous for ${blockchain}`)
      return persistence.put(key, block).then(() => {
        log.debug(`Stored latest for ${blockchain}`)
      }).then(() => {
        return persistence.put(heightKey, block).then(() => {
          log.debug(`Stored height ${block.getHeight()} for ${blockchain}`)
          callback(null, new Null())
        })
      })
    })
  }, _ => { // there is no older latest block, just store
    log.debug(`Did not have latest for ${blockchain}`)
    return persistence.put(key, block).then(() => {
      log.debug(`Stored latest for ${blockchain}`)
    }).then(() => {
      return persistence.put(heightKey, block).then(() => {
        log.debug(`Stored height ${block.getHeight()} for ${blockchain}`)
        callback(null, new Null())
      })
    })
  }).then(() => {
    if (context.pubsub && context.pubsub.publish) {
      context.pubsub.publish('rover.block', block)
    }

    context.emitter.emit('collectBlock', { block })
  })
}
