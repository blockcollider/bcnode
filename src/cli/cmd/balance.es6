/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { config } = require('../../config')
const DATA_DIR = process.env.BC_DATA_DIR || config.persistence.path

const { Command } = require('commander')

export const cmd = (program: typeof Command, address: string) => {
  const RocksDb = require('../../persistence').RocksDb
  const db = new RocksDb(DATA_DIR)
  console.log('Loading balance for address ' + address)
  return db.open()
    .then(() => db.getBtAddressBalance(address))
    .then((res) => {
      const divider = 100000000
      const { confirmed, unconfirmed } = res
      console.log(`confirmed: ${confirmed / divider}, unconfirmed: ${unconfirmed / divider}`)
      db.close()
    })
    .catch((err) => {
      db.close()
      throw new Error(err)
    })
}
