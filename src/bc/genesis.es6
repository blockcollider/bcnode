/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const BN = require('bn.js')
const fs = require('fs')

const { blake2bl, blake2b } = require('../utils/crypto')
const { humanToBN, COIN_FRACS: { NRG } } = require('../core/coin')
const { txHash, COINBASE_MATURITY } = require('../core/txUtils')
const { BcBlock, BlockchainHeader, BlockchainHeaders, Transaction, TransactionOutput } = require('../protos/core_pb')

function loadATMinerGrantsTx (ATBalanceDigest: string, genesisMinerKey: string): Transaction {
  const content = fs.readFileSync(`${__dirname}/at_genesis_balances.csv`, 'utf8')
  const contentStr = content.split('\n').map(l => l.trim()).join('')
  if (blake2b(contentStr) !== ATBalanceDigest) {
    throw new Error('Invalid AT digest')
  }
  const minerBalance = []
  const lines = content.split('\n').map(l => l.trim())
  lines.forEach((line) => {
    const [key, nrg] = line.split(',').map(l => l.trim())
    if (key.startsWith('0x') && key.length === 42) {
      minerBalance.push([key, nrg])
    }
  })

  const tx = new Transaction()

  const txOutputs = minerBalance.map((pair) => {
    const [minerAddress, nrgs] = pair

    const grant = humanToBN(`${nrgs}`, NRG)
    const unit = new BN(1).toBuffer()
    const newOutputLockScript = [
      'OP_BLAKE2BL',
      blake2bl(blake2bl(minerAddress)),
      'OP_EQUALVERIFY',
      'OP_CHECKSIGVERIFY'
    ].join(' ')

    const txOutput = new TransactionOutput([
      new Uint8Array(grant.toBuffer()),
      new Uint8Array(unit),
      newOutputLockScript.length,
      new Uint8Array(Buffer.from(newOutputLockScript, 'ascii'))
    ])
    return txOutput
  })

  tx.setOutputsList(txOutputs)
  tx.setNoutCount(txOutputs.length)
  tx.setInputsList([])
  tx.setNinCount(0)

  tx.setNonce(genesisMinerKey)
  tx.setOverline('0')
  tx.setLockTime(COINBASE_MATURITY)
  tx.setVersion(1)

  tx.setHash(txHash(tx))
  return tx
}

export function getGenesisBlock (): BcBlock {
  const GENESIS_DATA = require('./genesis.raw')
  const GENESIS_BLOCK_HEADERS_MAP = new BlockchainHeaders()
  Object.entries(GENESIS_DATA.blockchainHeadersMap)
    .forEach(([chain, headerList]) => {
      const methodName = `set${chain[0].toUpperCase() + chain.slice(1)}List` // e.g. setBtcList
      // $FlowFixMe flow typing of Object.entries is not generic
      GENESIS_BLOCK_HEADERS_MAP[methodName](headerList.map(header => {
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

  const BTMinersNrgGrantTx = loadATMinerGrantsTx(GENESIS_DATA.ATBalanceDigest, GENESIS_DATA.minerAddress)
  const genesisTxs = [BTMinersNrgGrantTx]
  const GENESIS_BLOCK = new BcBlock([
    GENESIS_DATA.hash,
    GENESIS_DATA.previousHash,
    GENESIS_DATA.version,
    GENESIS_DATA.schemaVersion,
    GENESIS_DATA.height,
    GENESIS_DATA.miner,
    GENESIS_DATA.difficulty,
    GENESIS_DATA.timestamp,
    GENESIS_DATA.merkleRoot,
    GENESIS_DATA.chainRoot,
    GENESIS_DATA.distance,
    GENESIS_DATA.totalDistance,
    GENESIS_DATA.nonce,
    GENESIS_DATA.nrgGrant,
    GENESIS_DATA.targetHash,
    GENESIS_DATA.targetHeight,
    GENESIS_DATA.targetMiner,
    GENESIS_DATA.targetSignature,
    GENESIS_DATA.twn,
    GENESIS_DATA.tws,
    GENESIS_DATA.emblemWeight,
    GENESIS_DATA.emblemChainBlockHash,
    GENESIS_DATA.emblemChainFingerprintRoot,
    GENESIS_DATA.emblemChainAddress,
    genesisTxs.length,
    genesisTxs,
    GENESIS_DATA.txFeeBase,
    GENESIS_DATA.txDistanceSumLimit,
    5, // blockchain_fingerprints_count,
    GENESIS_BLOCK_HEADERS_MAP,
    GENESIS_DATA.blockchainFingerprintsRoot
  ])
  GENESIS_BLOCK.setTxsList(genesisTxs)
  GENESIS_BLOCK.setBlockchainHeaders(GENESIS_BLOCK_HEADERS_MAP)

  return GENESIS_BLOCK
}
