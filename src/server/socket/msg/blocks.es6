/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { range, reverse } = require('ramda')
const logging = require('../../../logger')
const logger = logging.getLogger(__filename)

const blockGet = (persistence: Object, id: string) => persistence.get(`bc.block.${id}`)

module.exports = {
  get: (server: Object, client: Object, payload: Object) => {
    let firstBlock = null
    const persistence = server._engine.persistence
    blockGet(persistence, payload.data.id)
      .then((block) => {
        firstBlock = block
        const firstBlockHeight = firstBlock.getHeight()
        const count = Math.min(payload.data.count || 10, firstBlockHeight) - 1
        return Promise.all(
          reverse(
            range(firstBlockHeight - count, firstBlockHeight)
              .map((id) => blockGet(persistence, id.toString()))
          )
        )
      })
      .then((blocks) => {
        client.send(JSON.stringify({
          type: 'blocks.set',
          data: [
            (firstBlock && firstBlock.toObject()),
            ...blocks.map((block) => block.toObject())
          ]
        }))
      })
      .catch((err) => {
        if (err) {
          logger.error("Unable to 'get.blocks'")
          console.log(err)
        }
      })
  }
}
