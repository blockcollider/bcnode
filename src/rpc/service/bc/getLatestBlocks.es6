/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { Block } = require('../../../protos/core_pb')
const { GetLatestBlocksResponse } = require('../../../protos/bc_pb')

const rovers = require('../../../rover/manager').rovers

export default function getLatestBlocks(context: Object, call: Object, callback: Function) {
  const keys = Object.keys(rovers).map((rover) => {
    return `${rover}.block.latest`
  })

  const promises = keys.map((key) => {
    return context.server.engine.persistence.get(key)
      .then((res) => {
        return [key, res.toString()]
      })
      .catch((err) => {
        return null
      })
  })

  const result = Promise.all(promises)
    .then((blocks) => {
      const reply = new GetLatestBlocksResponse()
      reply.setBlocksList(blocks.filter(a => a).map((block) => {
        const [key, hash] = block
        return new Block([key.split('.')[0],hash])
      }))
      callback(null, reply)
    })
    .catch((err) => {
      context.logger.error(`Could not get block, reason: ${err}'`)
    })
}
