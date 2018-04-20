/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type EventEmitter from 'events'
const RpcServer = require('../server').default

const { collectBlock } = require('./rover/index')

export default class CollectorServiceImpl {
  _server: RpcServer; // eslint-disable-line no-undef
  _emitter: EventEmitter

  constructor (server: RpcServer, emitter: EventEmitter) {
    this._server = server
    this._emitter = emitter
  }

  get server () : RpcServer {
    return this._server
  }

  /**
   * Implements the collectBlock RPC method.
   */
  collectBlock (call: Object, callback: Function) {
    collectBlock(this._getContext(), call, callback)
  }

  _getContext () : Object {
    return {
      server: this._server,
      emitter: this._emitter
    }
  }
}
