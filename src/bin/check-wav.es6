/* eslint-disable */
const { aperture, sum } = require('ramda')
const WavesAPI = require('waves-api')

process.env.BC_LOG = 'error'
process.env.BC_DEBUG = true

process.on('unhandledRejection', (e) => {
  console.error(e.stack)
});

const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

(async function () {
  const api = WavesAPI.create(WavesAPI.MAINNET_CONFIG)
  const last = await api.API.Node.v1.blocks.height()

  const timeStamps = []
  const lastTimestamp = last.timestamp
  timeStamps.push(lastTimestamp)
  let height = last.height - 10
  console.log(`Last height is ${height}`)

  while (height >= (last.height - 110)) {
    console.log(`Getting height ${height}`)
    try {
      const b = await api.API.Node.v1.blocks.at(height)
      timeStamps.push(b.timestamp)
    } catch (e) {
      console.log(`Failed`)
    }
    height -= 1
    await sleep(1000)
  }

  const pairs = aperture(2, timeStamps)

  const diffs = pairs.map(([l, r]) => Math.abs(l - r)).filter(n => !Number.isNaN(n))
  console.log(diffs, sum(diffs), diffs.length)
  console.log(`Average block time is ${sum(diffs)/diffs.length} ms`)
})()
