/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { RpcServer } from '../../server'

const { GetBalanceRequest, GetBalanceResponse } = require('../../../protos/bc_pb')
const { internalToHuman, COIN_FRACS: { NRG } } = require('../../../core/coin')
const { Wallet } = require('../../../bc/wallet')

export default function getBalance (context: RpcServer, call: Object, callback: Function) {
  const getBalanceReq: GetBalanceRequest = call.request
  const address = getBalanceReq.getAddress()
  context.logger.info(`Trying to get balance of: ${address}`)

  const wallet = new Wallet(context.server.engine.persistence, context.server.engine.unsettledTxManager)

  wallet.getBalanceData(address).then((balanceData) => {
    const { confirmed, unconfirmed, collateralized } = balanceData
    const response = new GetBalanceResponse([
      internalToHuman(confirmed, NRG),
      internalToHuman(unconfirmed, NRG),
      internalToHuman(collateralized, NRG),
      'nrg'
    ])
    callback(null, response)
  }).catch((err) => {
    callback(err)
  })
}
