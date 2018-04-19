/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { ChildBlockHeader, BcBlock } = require('../protos/core_pb')
const {
  createMerkleRoot,
  getChildrenBlocksHashes,
  getChildrenRootHash
} = require('./miner')
const { blake2bl } = require('../utils/crypto')

export function getGenesisBlock (minerPublicAddress: string) {
  const oldTransactions = []

  const oldBestBlockchainsBlockHeaders: ChildBlockHeader[] = [
    new ChildBlockHeader([
      'btc',
      '0x39499390034',
      '0xxxxxxxxxxxxxxxxx',
      1400000000,
      2,
      '0x000x00000',
      1
    ]),
    new ChildBlockHeader([
      'eth',
      'ospoepfkspdfs',
      '0xxxxxxxxxxxxxxxxx',
      1400000000,
      2,
      '0x000x00000',
      1
    ]),
    new ChildBlockHeader([
      'lsk',
      '0x39300923i42034',
      '0xxxxxxxxxxxxxxxxx',
      1400000000,
      2,
      '0x000x00000',
      1
    ]),
    new ChildBlockHeader([
      'wav',
      '0xsjdfo3i2oifji3o2',
      '0xxxxxxxxxxxxxxxxx',
      1400000000,
      2,
      '0x000x00000',
      1
    ]),
    new ChildBlockHeader([
      'neo',
      '0xw3jkfok2jjvijief',
      '0xxxxxxxxxxxxxxxxx',
      1400000000,
      2,
      '0x000x00000',
      1
    ])
  ]

  const oldBestBlockchainHeaderHashes = getChildrenBlocksHashes(oldBestBlockchainsBlockHeaders)

  const oldChainRoot = blake2bl(getChildrenRootHash(oldBestBlockchainHeaderHashes).toString())

  const genesisTimestamp = ((Date.now() / 1000) << 0) - 70
  const genesisBlock = new BcBlock()
  genesisBlock.setHash('0xxxxxxxxxxxxxxxxxxxxxxxxx')
  genesisBlock.setHeight(1)
  genesisBlock.setMiner(minerPublicAddress)
  genesisBlock.setDifficulty(141129464479256)
  genesisBlock.setTimestamp(genesisTimestamp)
  // blockchains, transactions, miner address, height
  genesisBlock.setMerkleRoot(
    createMerkleRoot(
      oldBestBlockchainHeaderHashes.concat(
        oldTransactions.concat([minerPublicAddress, '1'])
      )
    )
  )
  genesisBlock.setChainRoot(oldChainRoot)
  genesisBlock.setDistance(1)
  genesisBlock.setTxCount(0)
  genesisBlock.setNonce(0) // TODO
  genesisBlock.setTransactionsList(oldTransactions)
  genesisBlock.setChildBlockchainCount(5)
  genesisBlock.setChildBlockHeadersList(oldBestBlockchainsBlockHeaders)

  return genesisBlock
}
