/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type PeerInfo from 'peer-info'
import type { Bundle } from './../bundle'

const debug = require('debug')('bcnode:peer:peer')
const pull = require('pull-stream')

const { PROTOCOL_PREFIX } = require('../protocol/version')

export class Peer {
  _bundle: Bundle
  _peerId: PeerInfo

  constructor (bundle: Bundle, peerId: PeerInfo) {
    this._bundle = bundle
    this._peerId = peerId
  }

  get bundle (): Bundle {
    return this._bundle
  }

  get peerId (): PeerInfo {
    return this._peerId
  }

  getHeaders (from: number = 1, to: number = 10): Promise<*> {
    debug(`getHeaders(${from}, ${to})`, this.peerId.id.toB58String())

    return new Promise((resolve, reject) => {
      this.bundle.dialProtocol(this.peerId, `${PROTOCOL_PREFIX}/rpc`, (err, conn) => {
        if (err) {
          return reject(err)
        }

        const msg = {
          jsonrpc: '2.0',
          method: 'getHeaders',
          params: [from, to],
          id: 42
        }

        pull(pull.values([JSON.stringify(msg)]), conn)

        pull(
          conn,
          pull.collect((err, wireData) => {
            if (err) {
              return reject(err)
            }

            try {
              const msg = JSON.parse(wireData)
              resolve(msg)
            } catch (e) {
              return reject(e)
            }
          })
        )
      })
    })
  }

  getLatestHeader (): Promise<*> {
    debug('getLatestHeader()', this.peerId.id.toB58String())

    return new Promise((resolve, reject) => {
      this.bundle.dialProtocol(this.peerId, `${PROTOCOL_PREFIX}/rpc`, (err, conn) => {
        if (err) {
          return reject(err)
        }

        const msg = {
          jsonrpc: '2.0',
          method: 'getLatestHeader',
          params: [],
          id: 42
        }

        pull(pull.values([JSON.stringify(msg)]), conn)

        pull(
          conn,
          pull.collect((err, wireData) => {
            if (err) {
              return reject(err)
            }

            try {
              const msg = JSON.parse(wireData)
              resolve(msg)
            } catch (e) {
              return reject(e)
            }
          })
        )
      })
    })
  }

  getLatestHeaders (count: number = 10): Promise<*> {
    debug(`getLatestHeaders(${count})`, this.peerId.id.toB58String())

    return new Promise((resolve, reject) => {
      this.bundle.dialProtocol(this.peerId, `${PROTOCOL_PREFIX}/rpc`, (err, conn) => {
        if (err) {
          return reject(err)
        }

        const msg = {
          jsonrpc: '2.0',
          method: 'getLatestHeaders',
          params: [count],
          id: 42
        }

        pull(pull.values([JSON.stringify(msg)]), conn)

        pull(
          conn,
          pull.collect((err, wireData) => {
            if (err) {
              return reject(err)
            }

            try {
              const msg = JSON.parse(wireData)
              resolve(msg)
            } catch (e) {
              return reject(e)
            }
          })
        )
      })
    })
  }

  getMetaverse (): Promise<*> {
    debug(`getMetaverse()`, this.peerId.id.toB58String())

    return new Promise((resolve, reject) => {
      this.bundle.dialProtocol(this.peerId, `${PROTOCOL_PREFIX}/rpc`, (err, conn) => {
        if (err) {
          return reject(err)
        }

        const msg = {
          jsonrpc: '2.0',
          method: 'getMetaverse',
          params: [],
          id: 42
        }

        pull(pull.values([JSON.stringify(msg)]), conn)

        pull(
          conn,
          pull.collect((err, wireData) => {
            if (err) {
              return reject(err)
            }

            try {
              const msg = JSON.parse(wireData)
              resolve(msg)
            } catch (e) {
              return reject(e)
            }
          })
        )
      })
    })
  }
}

export default Peer
