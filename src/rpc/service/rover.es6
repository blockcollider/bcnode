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
const { UnsettledTxManager } = require('../../bc/unsettledTxManager')

const { collectBlock } = require('./rover/index')
const { SettleTxCheckResponse } = require('../../protos/rover_pb')

const { getLogger } = require('../../logger')
const logger = getLogger(__filename)

export default class CollectorServiceImpl {
  _server: RpcServer; // eslint-disable-line no-undef
  _emitter: EventEmitter
  _unsettledTxManager: UnsettledTxManager

  constructor (server: RpcServer, emitter: EventEmitter) {
    this._server = server
    this._emitter = emitter
    let persistence = server.engine.persistence
    this._unsettledTxManager = new UnsettledTxManager(persistence)
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

  isBeforeSettleHeight (call: Object, callback: Function) {
    const req = call.request
    const addrFrom = req.getAddrFrom()
    const addrTo = req.getAddrTo()
    const bridgedChain = req.getBridgedChain()

    const grpcResult = new SettleTxCheckResponse()
    this._unsettledTxManager.isBeforeSettleHeight(addrFrom, addrTo, bridgedChain, null).then((result) => {
      grpcResult.setIsBeforeSettlementHeight(result)
      callback(null, grpcResult)
    }).catch((e) => {
      logger.error(`isBeforeSettleHeight-grpc-error: ${e}, ${addrFrom}, ${addrTo}, ${bridgedChain}`)
      grpcResult.setIsBeforeSettlementHeight(false)
      callback(null, grpcResult)
    })
  }

  join (call: Object, callback: Function) {
    this.server.engine.rovers.roverRpcJoined(call)
  }

  _getContext () : Object {
    return {
      server: this._server,
      emitter: this._emitter
    }
  }
}
