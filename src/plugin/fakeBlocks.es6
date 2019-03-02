/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable */
const { Engine } = require('../engine/index')
const { BcBlock, BlockchainHeader, BlockchainHeaders } = require('../protos/core_pb')
const GENESIS_DATA = require('../bc/genesis.raw')
const BLOCKS_TO_CREATE = 100000

module.exports = {
  main: async (engine: Engine) => {

    let i = 2
    const rndString = () => Number(Math.random().toString().slice(2)).toString(36)
    const createMockBlockchainHeader = (height) => new BlockchainHeader([
      rndString(), // string blockchain = 1;
      rndString(), // string hash = 2;
      rndString(), // string previous_hash = 3;
      Date.now() + (i * 1000 << 0), // uint64 timestamp = 4;
      height, // uint64 height = 5;
      rndString(), // string merkle_root = 6;
      1 // uint64 blockchain_confirmations_in_parent_count = 7;
    ])

    const createMockBlock = (childrenHeights: [number[], number[], number[], number[], number[]]): BcBlock => {
      const block = new BcBlock()
      const blockchainHeaders = new BlockchainHeaders()
      const [btcHeights, ethHeights, lskHeights, neoHeights, wavHeights] = childrenHeights
      blockchainHeaders.setBtcList(btcHeights.map(h => createMockBlockchainHeader(h)))
      blockchainHeaders.setEthList(ethHeights.map(h => createMockBlockchainHeader(h)))
      blockchainHeaders.setLskList(lskHeights.map(h => createMockBlockchainHeader(h)))
      blockchainHeaders.setNeoList(neoHeights.map(h => createMockBlockchainHeader(h)))
      blockchainHeaders.setWavList(wavHeights.map(h => createMockBlockchainHeader(h)))

      block.setHash(rndString())
      block.setHeight(1)
      block.setBlockchainHeaders(blockchainHeaders)
      block.setDistance(100)
      block.setPreviousHash(rndString())
      block.setTotalDistance('101')

      return block
    }

    const GENESIS_BLOCK_HEADERS_MAP = new BlockchainHeaders()
    let block = new BcBlock([
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
      GENESIS_DATA.txCount,
      GENESIS_DATA.txsList,
      GENESIS_DATA.txFeeBase,
      GENESIS_DATA.txDistanceSumLimit,
      5, // blockchain_fingerprints_count,
      GENESIS_BLOCK_HEADERS_MAP,
      GENESIS_DATA.blockchainFingerprintsRoot
    ])

    while (i < BLOCKS_TO_CREATE) {
      i++
      const newBlock = createMockBlock([[6000000 + i], [6000000 + i], [6000000 + i], [6000000 + i], [6000000 + i]])
      newBlock.setHeight(i)
      newBlock.setHash(`${i}`)
      newBlock.setPreviousHash(block.getHash())
      newBlock.getBlockchainHeaders().getBtcList()[0].setHash('btc_a')
      newBlock.getBlockchainHeaders().getBtcList()[0].setPreviousHash('btc_1')
      newBlock.getBlockchainHeaders().getEthList()[0].setHash(`eth_${i}`)
      newBlock.getBlockchainHeaders().getEthList()[0].setPreviousHash(`eth_${i - 1}`)
      newBlock.getBlockchainHeaders().getLskList()[0].setHash('lsk_a')
      newBlock.getBlockchainHeaders().getLskList()[0].setPreviousHash('lsk_1')
      newBlock.getBlockchainHeaders().getNeoList()[0].setHash('neo_a')
      newBlock.getBlockchainHeaders().getNeoList()[0].setPreviousHash('neo_1')
      newBlock.getBlockchainHeaders().getWavList()[0].setHash('wav_a')
      newBlock.getBlockchainHeaders().getWavList()[0].setPreviousHash('wav_1')

      console.log('Generating block', i)

      await engine.persistence.put('bc.block.' + newBlock.getHeight(), newBlock)

      block = newBlock
    }

    await engine.persistence.put('bc.block.latest', block)
  }
}
