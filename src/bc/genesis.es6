/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { BcBlock, ChildBlockHeader, ChildBlockHeaders } = require('../protos/core_pb')

export const GENESIS_MINER_KEY = '0x93490z9j390fdih2390kfcjsd90j3uifhs909ih3'

export function getGenesisBlock () {
  const GENESIS_DATA = require('./genesis.raw')
  const GENESIS_BLOCK_HEADERS_MAP = new ChildBlockHeaders()
  Object.entries(GENESIS_DATA.childBlockHeadersMap)
    .forEach(([chain, headerList]) => {
      const methodName = `set${chain[0].toUpperCase() + chain.slice(1)}List` // e.g. setBtcList
      // $FlowFixMe flow typing of Object.entries is not generic
      GENESIS_BLOCK_HEADERS_MAP[methodName](headerList.map(header => {
        return new ChildBlockHeader([
          header.blockchain,
          header.hash,
          header.previousHash,
          header.timestamp,
          header.height,
          header.merkleRoot,
          header.childBlockConfirmationsInParentCount
        ])
      }))
    })

  const GENESIS_BLOCK = new BcBlock([
    GENESIS_DATA.hash,
    GENESIS_DATA.height,
    GENESIS_DATA.miner,
    GENESIS_DATA.difficulty,
    GENESIS_DATA.timestamp,
    GENESIS_DATA.merkleRoot,
    GENESIS_DATA.chainRoot,
    GENESIS_DATA.distance,
    GENESIS_DATA.nonce,
    GENESIS_DATA.txCount,
    GENESIS_DATA.transactionsList,
    Object.keys(GENESIS_BLOCK_HEADERS_MAP.toObject()).length
  ])
  GENESIS_BLOCK.setChildBlockHeaders(GENESIS_BLOCK_HEADERS_MAP)

  return GENESIS_BLOCK
}
