/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { RpcServer } from '../../server'

const { RpcTransaction, RpcTransactionResponse } = require('../../../protos/bc_pb')

export default function newTx (context: RpcServer, call: Object, callback: Function) {
  const newTxReq: RpcTransaction = call.request
  context.logger.info(`Trying to create new TX from: ${newTxReq.getFromAddr()} to: ${newTxReq.getToAddr()}`)
  const response = new RpcTransactionResponse()
  context.server.engine.createTx(newTxReq).then(res => {
    response.setStatus(res.status)
    response.setTxHash(res.txHash)
    response.setError('')
    callback(null, response)
  }).catch((err) => {
    console.log(err)
    response.setStatus(1)
    response.setError(err.toString())
    callback(null, response)
  })
}
