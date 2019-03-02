/* eslint-disable */

const { default: RocksDb } = require('../persistence/rocksdb')
const { internalToHuman, COIN_FRACS: { NRG, BOSON } } = require('../core/coin')

const { is } = require('ramda')
const process = require('process')
const path = require('path')
const fs = require('fs')
// const { inspect } = require('util')

process.env.BC_LOG = 'error'
process.env.BC_DEBUG = true

process.on('unhandledRejection', (e) => {
  console.error(e.stack)
});

(async function () {
  const blocks = []
  if (process.argv.length < 4) {
    console.log(`Usage: node ./lib/bin/check-balance.js <persistence_data_folder> <bc_adress>`)
    process.exit(1)
  }

  const dbp = path.resolve(process.argv[2])
  if (!fs.existsSync(dbp)) {
    console.log(`Data folder ${dbp} does not exist`)
    process.exit(2)
  }

  if (!is(String, process.argv[3])) {
    console.log(`Address not valid`)
    process.exit(4)
  }

  const p = new RocksDb(dbp)
  await p.open()
  const address = process.argv[3] // TODO validate address
  const balanceData = await p.getBalanceData(address.toLowerCase())
  console.log(internalToHuman(balanceData.confirmed, NRG), internalToHuman(balanceData.unconfirmed, NRG))
})()
