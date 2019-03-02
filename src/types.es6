/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type BlockLike = {
}

export type BlockLikeObject = {
  blockchain: 'btc'|'eth'|'lsk'|'neo'|'wav',
  hash: string,
  previousHash: string,
  timestamp: number,
  height: number,
  merkleRoot: string
}

export type BcBlockObject = {
  hash: string,
  previousHash: string,
  version: number,
  schemaVersion: number,
  height: number,
  miner: string,
  difficulty: string,
  timestamp: number,
  merkleRoot: string,
  chainRoot: string,
  distance: string,
  totalDistance: string,
  nonce: string,
  nrgGrant: number,
  targetHash: string,
  targetHeight: number,
  targetMiner: string,
  targetSignature: string,
  twn: number,
  twsList: string[],
  emblemWeight: number,
  emblemChainBlockHash: string,
  emblemChainFingerprintRoot: string,
  emblemChainAddress: string,
  txCount: number,
  txFeeBase: number,
  txDistanceSumLimit: number,
  blockchainHeadersCount: number,
  blockchainHeaders: BlockLikeObject[],
  blockchainFingerprintsRoot: string
}
