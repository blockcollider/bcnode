
/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type { BcBlockObject } from '../types'
const { readFileSync } = require('fs')

const { BcBlock, BlockchainHeader, BlockchainHeaders } = require('../protos/core_pb')

export function getBootBlock (path: string): BcBlock {
  const DATA: BcBlockObject = JSON.parse(readFileSync(path, 'ascii'))
  const BLOCK_HEADERS_MAP = new BlockchainHeaders()
  Object.entries(DATA.blockchainHeaders)
    .forEach(([chain, headerList]) => {
      const methodName = `set${chain[0].toUpperCase() + chain.slice(1)}` // e.g. setBtcList
      // $FlowFixMe flow typing of Object.entries is not generic
      BLOCK_HEADERS_MAP[methodName](headerList.map(header => {
        return new BlockchainHeader([
          header.blockchain,
          header.hash,
          header.previousHash,
          header.timestamp,
          header.height,
          header.merkleRoot,
          header.blockchainConfirmationsInParentCount
        ])
      }))
    })

  const BLOCK = new BcBlock([
    DATA.hash,
    DATA.previousHash,
    DATA.version,
    DATA.schemaVersion,
    DATA.height,
    DATA.miner,
    DATA.difficulty,
    DATA.timestamp,
    DATA.merkleRoot,
    DATA.chainRoot,
    DATA.distance,
    DATA.totalDistance,
    DATA.nonce,
    DATA.nrgGrant,
    DATA.targetHash,
    DATA.targetHeight,
    DATA.targetMiner,
    DATA.targetSignature,
    DATA.twn,
    // $FlowFixMe - bcBlock.toObject returns a twsList but in JSON there is tws
    DATA.tws,
    DATA.emblemWeight,
    DATA.emblemChainBlockHash,
    DATA.emblemChainFingerprintRoot,
    DATA.emblemChainAddress,
    DATA.txCount,
    DATA.txFeeBase,
    DATA.txDistanceSumLimit,
    5, // blockchain_fingerprints_count,
    BLOCK_HEADERS_MAP,
    DATA.blockchainFingerprintsRoot
  ])
  BLOCK.setBlockchainHeaders(BLOCK_HEADERS_MAP)

  return BLOCK
}
