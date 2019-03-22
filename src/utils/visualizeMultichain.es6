
process.on('uncaughtError', (err) => {
  console.trace(err)
})

const { config } = require('../config')
const PersistenceRocksDb = require('../persistence').RocksDb
const BC_NETWORK: 'main'|'test' = process.env.BC_NETWORK || 'main'
const dataDirSuffix = (BC_NETWORK === 'main') ? '' : `_${BC_NETWORK}net`
console.log('set BC_NETWORK ' + BC_NETWORK)
const DATA_DIR = `${process.env.BC_DATA_DIR || config.persistence.path}${dataDirSuffix}`
console.log('set DATA_DIR ' + DATA_DIR)
const FILTER = '.block.'
const util = require('util')
const fs = require('fs')
const graphviz = require('graphviz')

const USE = 'dot'
console.log('set GRAPH ' + USE)
const bcg = graphviz.graph('G')
bcg.set('bgcolor', 'black')
bcg.set('overlap', false)
bcg.set('rankdir', 'TB')

const primary = [
  'checkpoint',
  'parent',
  'latest',
  'oldest'
]

const colors = {
  'btc': 'orange',
  'eth': 'purple',
  'neo': 'green',
  'lsk': 'blue',
  'wav': 'cyan'
}

const clusters = {
  'bc': bcg.addCluster('multichain'),
  'btc': bcg,
  'eth': bcg,
  'neo': bcg,
  'lsk': bcg,
  'wav': bcg
}

const weights = {
  'bc': 0,
  'btc': 1,
  'eth': 1,
  'neo': 1,
  'lsk': 1,
  'wav': 1
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
      c.addNode(pairs[0], {
        color: colors[header.getBlockchain()],
        shape: 'box3d',
        label: header.getBlockchain().toUpperCase() + '-' + header.getHeight() + '-' + header.getHash().slice(0, 4),
        fontcolor: 'white'
        // fontsize: 8
      })
      c.addNode(pairs[1], {
        color: colors[header.getBlockchain()],
        shape: 'box3d',
        style: 'filled',
        label: header.getBlockchain().toUpperCase() + '-' + header.getHeight() + '-' + header.getHash().slice(0, 4),
        fontcolor: 'black'
        // fontsize: 8
      })
      seen[pairs[0] + pairs[1]] = 1
      c.addEdge(pairs[0], pairs[1], { fontsize: 8, color: 'blue', fontcolor: 'white' })
      // seen[pairs[1] + pairs[2]] = 1
      // c.addEdge(pairs[1], pairs[2], { fontsize: 8 })
      seen['BC' + '-' + b.getHeight() + pairs[1]] = 1
      c.addEdge('BC' + '-' + b.getHeight(), pairs[1], { color: 'grey', weight: weights[header.getBlockchain()] })
    })
  }
  const findEdges = async (blocks) => {
    blocks.map(async (block, i) => {
      const b = await layer.get(block)
      const keys = createPairKeys('bc', b)
      const c = clusters['bc']
		  c.addNode(keys[1], {
        label: 'BC-' + b.getHeight() + '-' + b.getHash().slice(0, 4),
        shape: 'square',
        color: 'white',
        style: 'filled',
        // fontsize: 16,
        fontcolor: 'black'
      })

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
      if (seen[keys[0] + keys[1]] === undefined) {
        seen[keys[0] + keys[1]] = 1
        bcg.addEdge(keys[0], keys[1])
      }
      if (seen[keys[1] + keys[2]] === undefined) {
        seen[keys[1] + keys[2]] = 1
      	c.addEdge(keys[1], keys[2], { color: 'white' })
      }
      if (i + 1 === blocks.length) {
        console.log('traversing graph (1 mins)...')
        bcg.use = USE
        bcg.output('png', 'mem.png')
        console.log('rendering (5-9 mins)...')
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
      } else if (key === undefined || bcBlocks.length > 200) {
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
