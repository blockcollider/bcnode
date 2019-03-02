/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { inspect } = require('util')

const { RpcClient } = require('../../rpc/client')
const { GetBalanceRequest, GetBalanceResponse } = require('../../protos/bc_pb')
const { getLogger } = require('../../logger')

const { Command } = require('commander')

export const cmd = (program: typeof Command, address: string) => {
  const rpcClient = new RpcClient()
  const log = getLogger(__filename)
  const req = new GetBalanceRequest([address.toLowerCase()])

  log.info(`Sending: ${inspect(req.toObject())}`)

  return rpcClient.bc.getBalance(req, (err, res: GetBalanceResponse) => {
    if (err) {
      log.error(`Unable to get balance for ${address}, reason (${err.code}) ${err.toString()}`)
    } else {
      const unit = res.getUnit()
      const logMsg = {
        'ConfirmedBalance': `${res.getConfirmed()} ${unit}`,
        'UnconfirmedBalance': `${res.getUnconfirmed()} ${unit}`,
        'CollateralizedBalance': `${res.getCollateralized()} ${unit}`
      }
      const outputLine = Object.keys(logMsg).map(k => `${k}: ${logMsg[k]}`).join(', ')
      log.info(`Balance: { ${outputLine} }`)
    }
  })
}
