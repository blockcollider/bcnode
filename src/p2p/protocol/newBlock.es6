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
const { shouldBlockBeAddedToMultiverse } = require('../../engine/helper')
const { isValidBlock } = require('../../bc/validation')

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
          if (!isValidBlock(block)) {
            debug('Received block was not valid')
            // TODO this peer should make to the the blacklist
            return
          }
          //manager.engine._processMinedBlock(block)
          manager.engine.blockFromPeer(block)
          //const shouldBeAdded = shouldBlockBeAddedToMultiverse(block, manager.peerNode.multiverse, manager.peerNode.triggerBlockSync)
          // TODO add getter
          //manager.peerNode._blockPool._syncEnabled = !shouldBeAdded

          if (manager.engine.peerIsSyncing === true) {
            manager._lastQuorumSync = new Date()
            manager._quorumSyncing = true

            if (manager.peerNode._blockPool._syncEnabled === true) {
              manager.peerNode._blockPool.addBlock(block)
            }
          }
        } catch (e) {
          debug(`Error decoding block from peer, reason: ${e.message}`)
        }
      })
    )
  })
}
