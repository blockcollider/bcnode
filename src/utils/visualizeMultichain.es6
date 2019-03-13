
process.on('uncaughtError', (err) => {
  console.trace(err)
})
const { config } = require('../config')
const PersistenceRocksDb = require('../persistence').RocksDb
const BC_NETWORK: 'main'|'test' = process.env.BC_NETWORK || 'main'
const dataDirSuffix = (BC_NETWORK === 'main') ? '' : `_${BC_NETWORK}net`
console.log('using BC_NETWORK ' + BC_NETWORK)
console.log(dataDirSuffix)
const DATA_DIR = `${process.env.BC_DATA_DIR || config.persistence.path}${dataDirSuffix}`
const FILTER = '.block.'

const primary = [
  'checkpoint',
  'parent',
  'latest',
  'oldest'
]

const scan = async () => {
  const layer = new PersistenceRocksDb(DATA_DIR)
  const cache = []
  const bcBlocks = []
  const primaryBcBlocks = []
  let count = 0
  await layer.open()

  const iter = layer.db.iterator({
    highWaterMark: 100000000,
    asBuffer: true
  })

  const processHeaderList = async (headers) => {
    for (let i = 0; i < headers.length; i++) {
      console.log(`${headers[i].getBlockchain()} height: ${headers[i].getHeight()}`)
    }
  }

  const findEdges = async (blocks) => {
    for (let i = 0; i < blocks.length; i++) {
      const b = await layer.get(blocks[i])
      const btc = b.getBlockchainHeaders().getBtcList()
      const eth = b.getBlockchainHeaders().getEthList()
      const wav = b.getBlockchainHeaders().getWavList()
      const neo = b.getBlockchainHeaders().getNeoList()
      const lsk = b.getBlockchainHeaders().getLskList()

      await processHeaderList(btc)
      await processHeaderList(eth)
      await processHeaderList(wav)
      await processHeaderList(neo)
      await processHeaderList(lsk)
    }
  }

  const cycle = async () => {
    return iter.next(async (err, key) => {
      count++
      if (err) {
        return Promise.reject(err)
      } else if (key === undefined) {
        console.log(bcBlocks)
        return findEdges(bcBlocks)
      }
		 const k = key.toString()
      if (k.indexOf(FILTER) > -1) {
        if (k.indexOf('bc.block.') > -1 && k.length < 33) {
          const primaryKey = primary.some((a) => { return k.indexOf(a) > -1 })
          if (primaryKey) {
        		primaryBcBlocks.push(k)
          } else {
        		bcBlocks.push(k)
          }
        } else {
          cache.push(k)
        }
      } else {
        cache.push(k)
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
