/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const path = require('path')

const { objFromFileSync } = require('../helper/json')
const { BcBlock } = require('../protos/core_pb')

export const GENESIS_MINER_KEY = '0x93490z9j390fdih2390kfcjsd90j3uifhs909ih3'

export function getGenesisBlock () {
  // const genesisBlock = GENESIS_BLOCK
  // const oldBestBlockchainHeaderHashes = getChildrenBlocksHashes(headers)
  // const oldChainRoot = blake2bl(getChildrenRootHash(oldBestBlockchainHeaderHashes).toString())
  // const genesisTimestamp = ((Date.now() / 1000) << 0) - 70
  // genesisBlock.setMiner(minerPublicAddress)
  // genesisBlock.setMerkleRoot(
  //   createMerkleRoot(
  //     oldBestBlockchainHeaderHashes.concat(
  //       oldTransactions.concat([minerPublicAddress, '1'])
  //     )
  //   )
  // )
  // genesisBlock.setChainRoot(oldChainRoot)
  // genesisBlock.setChildBlockHeadersList(oldBestBlockchainsBlockHeaders)
  // return genesisBlock

  const GENESIS_DATA = objFromFileSync(path.join(__dirname, 'genesis.raw.json'))

  const GENESIS_BLOCK_HEADERS = GENESIS_DATA.childBlockHeadersList
    .map((header) => {
      return [
        header.blockchain,
        header.hash,
        header.previousHash,
        header.timestamp,
        header.height,
        header.merkleRoot,
        header.childBlockConfirmationsInParentCount
      ]
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
    GENESIS_BLOCK_HEADERS.length,
    GENESIS_BLOCK_HEADERS
  ])

  return GENESIS_BLOCK
}
