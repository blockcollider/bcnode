/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const msg = require('./msg')

const logging = require('../../logger')
const logger = logging.getLogger(__filename)

export const dispatcher = (server: Object, client: Object, payload: Object) => {
  const type = payload.type
  if (!type) {
    logger.warn('No action specified')
    return false
  }

  const parts = payload.type.split('.')
  if (parts.length < 2) {
    logger.warn('Invalid type format')
    return false
  }

  const m = msg[parts[0]]
  if (!m) {
    logger.warn('Invalid module specified')
    return false
  }

  const action = m[parts[1]]
  if (!action) {
    logger.warn('Invalid action specified')
    return false
  }

  action(server, client, payload)

  return true
}
