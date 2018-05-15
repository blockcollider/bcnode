import { DATETIME_STARTED_AT } from '../manager/manager'

/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Bundle } from '../bundle'
import type { PeerManager } from '../manager/manager'

const debug = require('debug')('bcnode:protocol:status')
const pull = require('pull-stream')

const { getVersion } = require('../../helper/version')
const { PROTOCOL_PREFIX, NETWORK_ID } = require('./version')

export const register = (manager: PeerManager, bundle: Bundle) => {
  const uri = `${PROTOCOL_PREFIX}/status`
  debug(`Registering protocol - ${uri}`)

  bundle.handle(uri, (protocol, conn) => {
    const status = {
      p2p: {
        networkId: NETWORK_ID
      },
      ts: {
        startedAt: DATETIME_STARTED_AT
      },
      version: {
        protocol: PROTOCOL_PREFIX,
        ...getVersion()
      }
    }

    pull(pull.values([JSON.stringify(status)]), conn)
  })
}
