/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Logger } from 'winston'

const { getLogger } = require('../../logger')

const { blake2bl } = require('../../utils/crypto')
const RpcServer = require('../server').default

const {
  GetBlake2blRequest, GetBlake2blResponse,
  RpcTransactionResponse, PlaceMakerOrderRequest, PlaceTakerOrderRequest,
  RpcTransactionResponseStatus,
  GetOpenOrdersResponse, MakerOrderInfo,
  GetMatchedOpenOrdersResponse, MatchedOpenOrder, TakerOrderInfo,
  VanityConvertResponse, VanityConvertRequest
} = require('../../protos/bc_pb')

const Vanity = require('../../bc/vanity')

const {
  getLatestBlocks,
  help,
  stats,
  newTx,
  getBalance
} = require('./bc/index')

export default class BcServiceImpl {
  _logger: Logger; // eslint-disable-line no-undef
  _server: RpcServer; // eslint-disable-line no-undef

  constructor (server: RpcServer) {
    this._server = server
    this._logger = getLogger(__filename)
  }

  get server () : RpcServer {
    return this._server
  }

  /**
   * GetLatestBlocks
   */
  getLatestBlocks (call: Object, callback: Function) {
    getLatestBlocks(this._getContext(), call, callback)
  }

  /**
   * Help
   */
  help (call: Object, callback: Function) {
    help(this._getContext(), call, callback)
  }

  /**
   * Statistics
   */
  stats (call: Object, callback: Function) {
    stats(this._getContext(), call, callback)
  }

  /**
   * Create new TX
   */
  newTx (call: Object, callback: Function) {
    newTx(this._getContext(), call, callback)
  }

  /**
   * Get balance of NRG for address
   */
  getBalance (call: Object, callback: Function) {
    getBalance(this._getContext(), call, callback)
  }

  getBlake2bl (call: Object, callback: Function) {
    const req: GetBlake2blRequest = call.request
    const times = req.getTimes()
    let res = req.getToBeHashed()

    for (let i = 0; i < times; i++) {
      res = blake2bl(res)
    }
    callback(null, new GetBlake2blResponse([res]))
  }

  placeMakerOrder (call: Object, callback: Function) {
    const placeMakerOrderReq: PlaceMakerOrderRequest = call.request

    // TODO: should find a better way to do this
    const shift = placeMakerOrderReq.getShiftStartsAt()
    const deposit = placeMakerOrderReq.getDepositEndsAt()
    const settle = placeMakerOrderReq.getSettleEndsAt()

    const payWithChainId = placeMakerOrderReq.getPaysWithChainId()
    const wantChainId = placeMakerOrderReq.getWantsChainId()
    const receiveAddress = placeMakerOrderReq.getWantsChainAddress()
    const makerWantsUnit = placeMakerOrderReq.getWantsUnit()
    const makerPaysUnit = placeMakerOrderReq.getPaysUnit()

    const makerBCAddress = placeMakerOrderReq.getBcAddress()
    const makerBCPrivateKeyHex = placeMakerOrderReq.getBcPrivateKeyHex()

    const collateralizedNrg = placeMakerOrderReq.getCollateralizedNrg()
    const nrgUnit = placeMakerOrderReq.getNrgUnit()
    let additionalTxFee = placeMakerOrderReq.getTxFee()
    if (additionalTxFee === '') {
      additionalTxFee = '0'
    }
    const response = new RpcTransactionResponse()

    if (isNaN(parseFloat(additionalTxFee))) {
      response.setStatus(RpcTransactionResponseStatus.FAILURE)
      response.setError(`Invalid tx_fee: ${additionalTxFee}`)
      callback(null, response)
      return
    }


    this._server.engine.createCrossChainMakerTx(
      shift, deposit, settle,
      payWithChainId, wantChainId, receiveAddress, makerWantsUnit, makerPaysUnit,
      makerBCAddress, makerBCPrivateKeyHex,
      collateralizedNrg, nrgUnit, additionalTxFee
    ).then(res => {
      response.setStatus(res.status)
      response.setTxHash(res.txHash)
      if (res.status !== 0 && res.error) {
        response.setError(res.error.toString())
      }
      callback(null, response)
    }).catch((err) => {
      callback(err)
    })
  }

  placeTakerOrder (call: Object, callback: Function) {
    const placeTakerOrderReq: PlaceTakerOrderRequest = call.request

    const wantsAddress = placeTakerOrderReq.getWantsChainAddress()
    const sendsAddress = placeTakerOrderReq.getSendsChainAddress()

    const makerTxHash = placeTakerOrderReq.getMakerTxHash()
    const makerTxOutputIndex = placeTakerOrderReq.getMakerTxOutputIndex()

    const bCAddress = placeTakerOrderReq.getBcAddress()
    const bCPrivateKeyHex = placeTakerOrderReq.getBcPrivateKeyHex()

    const collateralizedNrg = placeTakerOrderReq.getCollateralizedNrg()
    let additionalTxFee = placeTakerOrderReq.getTxFee()
    if (additionalTxFee === '') {
      additionalTxFee = '0'
    }
    const response = new RpcTransactionResponse()

    if (isNaN(parseFloat(additionalTxFee))) {
      response.setStatus(RpcTransactionResponseStatus.FAILURE)
      response.setError(`Invalid tx_fee: ${additionalTxFee}`)
      callback(null, response)
      return
    }

    this._server.engine.createCrossChainTakerTx(
      wantsAddress, sendsAddress,
      makerTxHash, makerTxOutputIndex,
      bCAddress, bCPrivateKeyHex,
      collateralizedNrg, additionalTxFee
    ).then(res => {
      response.setStatus(res.status)
      response.setTxHash(res.txHash)
      if (res.status !== 0 && res.error) {
        response.setError(res.error.toString())
      }
      callback(null, response)
    }).catch((err) => {
      this._logger.error(err)
      callback(err)
    })
  }

  getOpenOrders (call: Object, callback: Function) {
    this._server.engine.dexLib.getOpenOrders().then(openOrders => {
      const grpcRes = new GetOpenOrdersResponse()
      const orders = openOrders.map((openOrder) => {
        const order = new MakerOrderInfo()
        Object.keys(openOrder).forEach((key) => {
          const func = `set${key[0].toUpperCase()}${key.slice(1)}`
          order[func](openOrder[key])
        })
        return order
      })

      grpcRes.setOpenOrdersList(orders)

      callback(null, grpcRes)
    }).catch((err) => {
      callback(err)
    })
  }

  getMatchedOpenOrders (call: Object, callback: Function) {
    this._server.engine.dexLib.getMatchedOpenOrders().then(openOrders => {
      const grpcRes = new GetMatchedOpenOrdersResponse()

      const orders = openOrders.map((openOrder) => {
        const order = new MatchedOpenOrder()
        const makerInfo = new MakerOrderInfo()
        const takerInfo = new TakerOrderInfo()

        Object.keys(openOrder.maker).forEach((key) => {
          const func = `set${key[0].toUpperCase()}${key.slice(1)}`
          makerInfo[func](openOrder.maker[key])
        })
        Object.keys(openOrder.taker).forEach((key) => {
          const func = `set${key[0].toUpperCase()}${key.slice(1)}`
          takerInfo[func](openOrder.taker[key])
        })

        order.setMaker(makerInfo)
        order.setTaker(takerInfo)

        return order
      })

      grpcRes.setOrdersList(orders)

      callback(null, grpcRes)
    }).catch((err) => {
      this._logger.error(err)
      callback(err.toString())
    })
  }

  getBcAddressViaVanity (call: Object, callback: Function) {
    const vanityConvertReq: VanityConvertRequest = call.request
    Vanity.convertVanity(vanityConvertReq.getVanity(), (err, bCAddress) => {
      const res = new VanityConvertResponse()
      if (err) {
        res.setError(err.message)
      } else {
        res.setBcAddress(bCAddress)
      }
      callback(null, res)
    })
  }

  _getContext () : Object {
    return {
      logger: this._logger,
      server: this._server
    }
  }
}
