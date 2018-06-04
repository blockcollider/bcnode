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
import type { HeaderIdentifier } from '../../peer/peer'
import type { BcBlock } from '../../../protos/core_pb'

const debug = require('debug')('bcnode:protocol:rpc')
const pull = require('pull-stream')
const { last } = require('ramda')

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
  // Params: e.g. from [7, b20377...60f444], [25, 592209...8cdd8d]
  // returns array of base64 encoded serialized BcBlocks
  getHeaders: (manager: PeerManager, from: HeaderIdentifier, to: HeaderIdentifier): Promise<string[]> => {
    const [fromHeight, fromHash] = from
    const [toHeight, toHash] = to

    if (fromHeight > toHeight) {
      return Promise.reject(new Error(`From: ${fromHeight} > to: ${toHeight}`))
    }

    if (toHeight - fromHeight > MAX_BLOCKS_COUNT) {
      return Promise.reject(new Error(`Cannot return more than ${MAX_BLOCKS_COUNT} blocks`))
    }

    const ids = []
    for (let i = fromHeight; i <= toHeight; i++) {
      ids.push(`bc.block.${i}`)
    }

    return manager.engine.persistence.get(ids)
      .then((blocks) => {
        // validate if first returned block.hash is fromHash and last is toHash
        if (blocks[0].getHash() !== fromHash) {
          return Promise.reject(new Error(`Wrong hash of from block, requested ${fromHash}, got ${blocks[0].getHash()}`))
        }

        if (last(blocks).getHash() !== toHash) {
          return Promise.reject(new Error(`Wrong hash of to block, requested ${toHash}, got ${last(blocks).getHash()}`))
        }
      }, (err) => { // beware, rocksdb rejects when not found
        return Promise.reject(new Error(`Could not retrieve some block between height ${fromHeight} and ${toHeight} from persistence, err: ${err}`))
      })
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

  getMultiverse: (manager: PeerManager) => {
    // TODO: @schnorr Can we delete this?
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
