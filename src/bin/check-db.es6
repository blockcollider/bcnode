/* eslint-disable */

const { aperture, reverse } = require('ramda')
const { default: RocksDb } = require('../persistence/rocksdb')
const { isValidBlock, validateBlockSequence } = require('../bc/validation')

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
  const dbp = path.resolve(process.argv[2])
  if (!fs.existsSync(dbp)) {
    console.log(`Data folder ${dbp} does not exist`)
    process.exit(1)
  }
  const p = new RocksDb(dbp)
  await p.open()
  let next = await p.get('bc.block.1')

  while (next) {
    console.log(`Validating block ${next.getHeight()}`)
    let isValid = isValidBlock(next)
    if (!isValid) {
      console.log(`Block "${next.getHeight()}" is not valid`)
    }

    let nextKey = `bc.block.${next.getHeight() + 1}`

    try {
      next = await p.get(nextKey)
      blocks.push(next)
    } catch (e) {
      console.log(`Could not get block "${nextKey}"`)
      next = undefined
    }
  }

  for (let seq of aperture(3, reverse(blocks))) {
    console.log(`validating sequence from ${seq[0].getHeight()} to ${seq[seq.length - 1].getHeight()}`)
    if (!validateBlockSequence(seq)) {
      console.log(`ERROR: Invalid sequence from ${seq[0].getHeight()} to ${seq[seq.length - 1].getHeight()}`)
    }
  }

  // const latest = await p.getBulk(['bc.block.40', 'bc.block.41'])
  // console.log(inspect(latest.map(b => b.toObject()), {depth: 3}))
})()
