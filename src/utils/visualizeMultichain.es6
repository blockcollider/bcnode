
process.on('uncaughtError', (err) => {
  console.trace(err)
})
const { config } = require('../config')
const PersistenceRocksDb = require('../persistence').RocksDb
const BC_NETWORK: 'main'|'test' = process.env.BC_NETWORK || 'main'
const dataDirSuffix = (BC_NETWORK === 'main') ? '' : `_${BC_NETWORK}net`
console.log(BC_NETWORK)
console.log(dataDirSuffix)
const DATA_DIR = `${process.env.BC_DATA_DIR || config.persistence.path}${dataDirSuffix}`
const FILTER = '.block.'

const scan = async () => {
  const layer = new PersistenceRocksDb(DATA_DIR)
  await layer.open()

  const iter = layer.db.iterator({
    highWaterMark: 100000000,
    asBuffer: true
  })

  const cycle = () => {
    return iter.next((err, key) => {
      if (err) {
        return Promise.reject(err)
      } else if (key === undefined) {
        return Promise.resolve(true)
      }
		 const k = key.toString()

      if (k.indexOf(FILTER) > -1) {
        console.log(k)
      }
    	return cycle()
    })
  }

  return cycle()
}

scan().then(() => {
  console.log('scan complete')
}).catch((err) => {
  console.trace(err)
})
