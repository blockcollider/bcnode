
process.on('uncaughtError', (err) => {
  console.trace(err)
})

const { config } = require('../../config')
const PersistenceRocksDb = require('../../persistence').RocksDb
// const BC_NETWORK: 'main'|'test' = process.env.BC_NETWORK || 'main'
const BC_NETWORK = 'lincoln'
const dataDirSuffix = (BC_NETWORK === 'main') ? '' : `_${BC_NETWORK}net`
console.log('set BC_NETWORK ' + BC_NETWORK)
const DATA_DIR = `${process.env.BC_DATA_DIR || config.persistence.path}${dataDirSuffix}`
console.log('set DATA_DIR ' + DATA_DIR)
const FILTER = '.block.'
const util = require('util')
const fs = require('fs')
const graphviz = require('graphviz')

const USE = 'dot'
const bcg = graphviz.graph('G')
bcg.set('bgcolor', 'darkgrey')
bcg.set('rankdir', 'TB')
bcg.set('overlap', 'scale')

const primary = [
  'checkpoint',
  'parent',
  'latest',
  'oldest'
]

const colors = {
  'btc': 'orange:white',
  'eth': 'purple:white',
  'neo': 'green:white',
  'lsk': 'blue:white',
  'wav': 'grey:white'
}

const clusters = {
  'bc': bcg.addCluster('bc'),
  'btc': bcg.addCluster('btc'),
  'eth': bcg.addCluster('eth'),
  'neo': bcg.addCluster('neo'),
  'lsk': bcg.addCluster('lsk'),
  'wav': bcg.addCluster('wav')
}

const weights = {
  'bc': 1,
  'btc': 0,
  'eth': 0.4,
  'neo': 0.3,
  'lsk': 0.2,
  'wav': 0.1
}
const createPairKeys = (blockchain, d) => {
  blockchain = blockchain.toUpperCase()
  return [blockchain + '-' + (parseInt(d.getHeight(), 10) - 1),
				 blockchain + '-' + d.getHeight(),
  			 blockchain + '-' + (parseInt(d.getHeight(), 10) - 1)]
}

const scan = async () => {
  const layer = new PersistenceRocksDb(DATA_DIR)
  const cache = []
  const bcBlocks = []
  const primaryBcBlocks = []
  const seen = {}
  let count = 0
  await layer.open()

  const iter = layer.db.iterator({
    highWaterMark: 10000000000,
    asBuffer: true
  })

  const processHeaderList = async (headers, b) => {
    headers.map((header) => {
      console.log(`${header.getBlockchain()} height: ${header.getHeight()}`)
      const pairs = createPairKeys(header.getBlockchain(), header)
      const c = clusters[header.getBlockchain()]
      c.addNode(pairs[1], {
        color: colors[header.getBlockchain()],
        shape: 'box3d',
        label: header.getBlockchain().toUpperCase() + '-' + header.getHeight() + '-' + header.getHash().slice(0, 4),
        fixedsize: true,
        fontcolor: 'white',
        fontsize: 8
      })
      if (seen[pairs[0] + pairs[1]] === undefined) {
        seen[pairs[0] + pairs[1]] = 1
        c.addEdge(pairs[0], pairs[1], { fontsize: 8 })
      }
      // if (seen[pairs[1] + pairs[2]] === undefined) {
      //  seen[pairs[1] + pairs[2]] = 1
      //	c.addEdge(pairs[1], pairs[2], { fontsize: 8 })
      // }
      if (seen['BC' + '-' + b.getHeight() + pairs[1]] === undefined) {
        seen['BC' + '-' + b.getHeight() + pairs[1]] = 1
      	// c.addEdge('BC' + '-' + b.getHeight(), pairs[1], { color: 'white', weight: weights[header.getBlockchain()] })
      	c.addEdge('BC' + '-' + b.getHeight(), pairs[1], { color: 'white' })
      }
    })
  }
  const findEdges = async (blocks) => {
    blocks.map(async (block, i) => {
      const b = await layer.get(block)
      const keys = createPairKeys('bc', b)
      const c = clusters['bc']
		  c.addNode(keys[1], {
        label: 'BC-' + b.getHeight() + '-' + b.getHash().slice(0, 4),
        shape: 'box3d',
        color: 'white',
        fontsize: 12,
        fontcolor: 'white'
      })
      // if (seen[keys[0] + keys[1]] === undefined) {
      //  seen[keys[0] + keys[1]] = 1
      //	bcg.addEdge(keys[0], keys[1])
      // }
      if (seen[keys[1] + keys[2]] === undefined) {
        seen[keys[1] + keys[2]] = 1
      	c.addEdge(keys[1], keys[2], { color: 'white' })
      }

      const btc = b.getBlockchainHeaders().getBtcList()
      const eth = b.getBlockchainHeaders().getEthList()
      const wav = b.getBlockchainHeaders().getWavList()
      const neo = b.getBlockchainHeaders().getNeoList()
      const lsk = b.getBlockchainHeaders().getLskList()

      await processHeaderList(btc, b)
      await processHeaderList(eth, b)
      await processHeaderList(wav, b)
      await processHeaderList(neo, b)
      await processHeaderList(lsk, b)
      if (i + 1 === blocks.length) {
        bcg.use = USE
        bcg.output('png', 'mem.png')
      }
    })
    return Promise.resolve(true)
    // const tasks = Promise.all(blocks.reduce((all, blockKey, i) => {
    //   all.push(layer.get(blockKey).then(async (b) => {
    //     return Promise.resolve(true)
    //   }))

    //   return all
    // }, [])
  }

  const cycle = async () => {
    return iter.next(async (err, key) => {
      count++
      if (err) {
        console.trace('error')
        return Promise.reject(err)
      // } else if (key === undefined || bcBlocks.length > 50) {
      } else if (key === undefined || bcBlocks.length > 120) {
  			iter.end(function () {

        })
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
