/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Bundle } from '../../bundle'
import type { PeerManager } from '../../manager/manager'

const debug = require('debug')('bcnode:protocol:rpc')
const pull = require('pull-stream')

const { PROTOCOL_PREFIX } = require('../version')

// --> data sent to Server
// <-- data sent to Client
//
//
// rpc call with positional parameters:
//
// --> {"jsonrpc": "2.0", "method": "subtract", "params": [42, 23], "id": 1}
// <-- {"jsonrpc": "2.0", "result": 19, "id": 1}
//
// --> {"jsonrpc": "2.0", "method": "subtract", "params": [23, 42], "id": 2}
// <-- {"jsonrpc": "2.0", "result": -19, "id": 2}
//
//
// rpc call with named parameters:
//
// --> {"jsonrpc": "2.0", "method": "subtract", "params": {"subtrahend": 23, "minuend": 42}, "id": 3}
// <-- {"jsonrpc": "2.0", "result": 19, "id": 3}
//
// --> {"jsonrpc": "2.0", "method": "subtract", "params": {"minuend": 42, "subtrahend": 23}, "id": 4}
// <-- {"jsonrpc": "2.0", "result": 19, "id": 4}

const MAX_BLOCKS_COUNT = 100000

const handlers = {
  getHeaders: (manager: PeerManager, from: number, to: number) => {
    const start = Math.min(from, to)
    const end = Math.min(start + MAX_BLOCKS_COUNT, Math.max(from, to))

    const ids = []
    for (let i = start; i <= end; i++) {
      ids.push(`bc.block.${i}`)
    }

    return manager.engine.persistence.get(ids)
      .then((res) => res.map((block) => block.serializeBinary().toString('base64')))
  },

  getLatestHeader: (manager: PeerManager) => {
    return manager.engine.persistence.get('bc.block.latest')
      .then((res) => res.serializeBinary().toString('base64'))
  },

  getLatestHeaders: (manager: PeerManager, count: number) => {
    return manager.engine.persistence.get('bc.block.latest')
      .then((block) => {
        if (!block) {
          return Promise.reject(new Error('No blocks in persistence'))
        }

        const height = block.getHeight()
        const blocksCount = Math.min(Math.min(count, height), MAX_BLOCKS_COUNT)
        const ids = []
        for (let i = 0; i < blocksCount; i++) {
          ids.push(`bc.block.${height - i}`)
        }

        return manager.engine.persistence.get(ids)
          .then((res) => res.map((block) => block.serializeBinary().toString('base64')))
      })
  },

  getMetaverse: (manager: PeerManager) => {
    // if (false && manager.isQuorumSyncing()) {
    //   return Promise.resolve([])
    // }

    return manager.engine.persistence.get('bc.block.latest')
      .then((block) => {
        if (!block) {
          return Promise.resolve([])
        }

        const height = block.getHeight()
        const blocksCount = Math.min(7, height)
        const ids = []
        for (let i = 0; i < blocksCount; i++) {
          ids.push(`bc.block.${height - i}`)
        }

        return manager.engine.persistence.get(ids)
          .then((res) => res.map((block) => block.serializeBinary().toString('base64')))
      })
  }
}

export const register = (manager: PeerManager, bundle: Bundle) => {
  const uri = `${PROTOCOL_PREFIX}/rpc`
  debug(`Registering protocol - ${uri}`)

  bundle.handle(uri, (protocol, conn) => {
    pull(
      conn,
      pull.collect((err, wireData) => {
        if (err) {
          debug(`Error occurred in ${uri}, reason: ${err.message}`)
          return
        }

        try {
          const msg = JSON.parse(wireData)
          const method = handlers[msg.method]
          method(manager, ...msg.params).then((res) => {
            pull(pull.values([JSON.stringify(res)]), conn)
          })
        } catch (e) {
          console.log('ERROR', e)
        }
      })
    )
  })
}
