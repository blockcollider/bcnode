/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const fs = require('fs')
const path = require('path')
const { randomBytes } = require('crypto')
const { transpose } = require('ramda')
const { getGenesisBlock } = require('../genesis')

const FIXTURES_DIR = path.resolve(__dirname, '..', '..', '..', 'test', 'data')

const BLOCK_FILE_NAMES = {
  btc: [
    '1523836600000-000000000000000000477638181f4dce851cfeb33d98ee296ec082abe1cea867.json',
    '1523836687000-0000000000000000001983279ff39b40154a17761936cda4fe0ec9b897f710f7.json',
    '1523836704000-000000000000000000470e5b34f8d45201ff0660fb81d94d61a2562ba3d319cb.json',
    '1523837949000-00000000000000000038c7f5a1dfaa6427cdc2be436dddfdc9c247b9e4e538fe.json',
    '1523838233000-000000000000000000417e40a85468a00fe943fdfca05e865ec06dfa1d0c38e9.json'
  ],
  eth: [
    '1523894958000-0xb9835f19d0abbc7142850df04d4e878f49c556bbcbc92eab9f07d8fb448b3f68.json',
    '1523894968000-0x5ea3859a785636dc4894a03e02633f33160269d2fb50366c997e0f3e1e3d0010.json',
    '1523895004000-0x2ca0f0fd9b938f720b67db72f3ed07608f267d1991ec8737d0ade9d4ee3a5d1b.json',
    '1523895014000-0x11b95e4753b2bb23104cdd0954bdd96531e4856ec64e34d415a7b69fa85a29e7.json',
    '1523895035000-0x9cd2040a796a66bb60b211ac43aeaa9dedf42882bdd422e828817cf8a262a6f4.json'
  ],
  lsk: [
    '1523894810000-9157999903771143710.json',
    '1523894820000-4812068630600159331.json',
    '1523894830000-9545237768975583403.json',
    '1523894840000-5557211302564878524.json',
    '1523894850000-2985628982063709003.json'
  ],
  neo: [
    '1523637954000-0xf495221def18cce061179f96dbb7714d5ecd7bc7cfda3ba7da581dfb99221e59.json',
    '1523893664000-0x05ec08428ade42d81ffa4637f460f700396e10dd09937139ded1b9486f3e0037.json',
    '1523894134000-0x67def08fa8737e52115622c8b9d66152c827e31def75bfc1c6165f3a2fcd23a2.json',
    '1523894154000-0x303e89f1340bdb3c011a6917ae6d84746157f9beb75f2588c53bb6a29234898f.json',
    '1523894466000-0x702a2107b4954657a08435994e96641b0c0acfa80188e73c7922014bbaa2cfe0.json'
  ],
  wav: [
    '1523894716003-5t9Q8AmkwqA2jGiYmXYQZSTJGUewUygGSyXWRRBLTzHCN4wVdwuqRZUBfmD5835nV8abWVfUd37taBeizS7prVqY.json',
    '1523894800008-3jcqysbHx1Zz6akvFC5gVfLjwebx6YvDj8oub5ZvvrgQVJBY8FtHRTnckdAr3rv6vQLV7WxDCNMsyMCQ8UKQjPLd.json',
    '1523894968009-3aUknEDG4vV7KqyR55fc9o7GZjS5CsEQosAPb751QXK9VzSHTy7Cgyfxkeo8uJC76a3DEEsVpurBcgm1CvbUb55C.json',
    '1523895067990-D6C783XnVySzzYEgUHqjybKztRZpRNUd5ugJrNBQj9QpPjpdhdiR77p6ZGRsBZQAw7tYr4XPJFzAmT6GqhByagu.json',
    '1523895224011-XLojD5mh4wDRE9B9ajoPfJLdFsbodEi5YgvHdQdxEtetBapEeV1ts3aYj1jmjKcZQLEK3bEAVkyQt3o6Sqa9zG9.json'
  ]
}

const BLOCKCHAIN_NAMES = Object.keys(BLOCK_FILE_NAMES)

const BLOCK_PATHS = BLOCKCHAIN_NAMES.reduce((acc, val) => {
  const paths = BLOCK_FILE_NAMES[val].map((fn) => {
    return path.join(FIXTURES_DIR, val, 'block', 'unified', fn)
  })

  acc[val] = paths
  return acc
}, {})

const BLOCKS_MAP = BLOCKCHAIN_NAMES.reduce((acc, val) => {
  const blocks = BLOCK_PATHS[val].map((p) => {
    return JSON.parse(fs.readFileSync(p).toString())
  })

  acc[val] = blocks
  return acc
}, {})

const BLOCKS_ARRAY = BLOCKCHAIN_NAMES.map((name) => {
  return BLOCKS_MAP[name]
})

const MINEABLE_BLOCKS = transpose(BLOCKS_ARRAY)

const GENESIS_KEY = randomBytes(32).toString('hex')

const GENESIS_BLOCK = getGenesisBlock(GENESIS_KEY).toObject()

describe('Mining Algorithm', () => {
  test('test data', () => {
    expect(MINEABLE_BLOCKS.length).toEqual(5)

    MINEABLE_BLOCKS.forEach((mb) => {
      expect(mb.length).toEqual(5)
    })

    expect(GENESIS_BLOCK).not.toBeNull()
  })
})
