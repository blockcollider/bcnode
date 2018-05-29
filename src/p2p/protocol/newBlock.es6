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

const debug = require('debug')('bcnode:protocol:newblock')
const pull = require('pull-stream')

const { BcBlock } = require('../../protos/core_pb')
const { shouldBlockBeAddedToMetaverse } = require('../../engine/helper')

const { PROTOCOL_PREFIX } = require('./version')

export const register = (manager: PeerManager, bundle: Bundle) => {
  const uri = `${PROTOCOL_PREFIX}/newblock`
  debug(`Registering protocol - ${uri}`)

  bundle.handle(uri, (protocol, conn) => {
    pull(
      conn,
      pull.collect((err, wireData) => {
        if (err) {
          debug('Error when collecting data', err, wireData)
          return
        }

        try {
          const bytes = wireData[0]
          const raw = new Uint8Array(bytes)
          const block = BcBlock.deserializeBinary(raw)
          manager.engine.blockFromPeer(block)
          if (manager.isQuorumSynced()) {
            manager._lastQuorumSync = new Date()
            manager._quorumSyncing = true
            shouldBlockBeAddedToMetaverse(block, manager.peerNode.metaverse, manager.peerNode.triggerBlockSync)
          }
        } catch (e) {
          debug(`Error decoding block from peer, reason: ${e.message}`)
        }
      })
    )
  })
}
