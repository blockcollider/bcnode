/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const logging = require('../../../logger')
const logger = logging.getLogger(__filename)

module.exports = {
  get: (server: Object, client: Object, payload: Object) => {
    const id = `bc.block.${payload.data.id}`
    const persistence = server._engine.persistence
    persistence.get(id)
      .then((block) => {
        client.send(JSON.stringify({
          type: 'block.set',
          data: block.toObject()
        }))
      })
      .catch((err) => {
        if (err) {
          logger.error("Unable to 'get.block'")
          console.log(err)
        }
      })
  }
}
