const fs = require('fs')
const avon = require('avon')
const BN = require('bn.js')
const _ = require('lodash')
const { invoker, partialRight } = require('ramda')

const FINGERPRINT_FILE = './templates/blockchain_fingerprints.json'
const WRITE_TO_FILE = undefined

const KEYS = {
	"0": "genesisBlockchainCount",
  "1": "blockchainHeaders"
}

const CHILD_KEYS = {
	"0": "name",
	"1": "description",
	"3": "electionStartBlockHeight",
	"4": "electionEndBlockHeight",
	"5": "version",
	"6": "blocksCount",
	"7": "dfNumerator",
	"8": "dfDenominator",
	"9": "dfVoid",
	"10": "dfBound",
	"11": "fingerprint",
	"12": "markedCount",
	"13": "marked"
}

const MARKED_CHILD_KEYS = {
	"0": "hash",
	"1": "data",
	"2": "name",
	"3": "height"
}

const CHILD_BLOCK_KEYS = {
	"0": "hash",
  "1": "data",
  "2": "height",
  "3": "index"
}

try {
  const data = require(FINGERPRINT_FILE)
  const fingerprintsHash = getFingerprintFile(data)
  if(WRITE_TO_FILE !== undefined){
    console.log("writing fingerprints hash to: " + fingerprintsHash)
		fs.writeFileSync(WRITE_TO_FILE, JSON.stringify({ fingerprintsHash: fingerprintsHash }, null, 2))
  } else {
    console.log("file evaluated: " + FINGERPRINT_FILE)
    console.log("file notorization: " + data.fingerprintsHash)
    console.log("computed notorization: " + fingerprintsHash)
    console.log("valid file notorization: " + (fingerprintsHash === data.fingerprintsHash) )
  }
} catch (err) {
  console.trace(err)
  console.log('error: unable to parse fingerprint file')
}

function toHexBuffer(string) {
	return partialRight(invoker(2, 'from'), ['hex', Buffer])
}

function blake2bl (input) {
  return avon.sumBuffer(Buffer.from(input), avon.ALGORITHMS.B).toString('hex').slice(64,128)
}

function createMerkleRoot (list, prev) {
  if (list.length > 0) {
    if (prev !== undefined) {
      prev = blake2bl(prev + list.shift())
    } else {
      prev = blake2bl(list.shift())
    }
    return createMerkleRoot(list, prev)
  }
  return prev
}

function getXor (list) {
  const bn = list.reduce((all, blockHash) => {
  	return all.xor(new BN(Buffer.from(blockHash, 'hex')))
	}, new BN(0))
  return bn
}

function getFingerprintFile(data) {
	const headerHashes = data.blockchainHeaders.reduce(function(blockchainHeaders, header){
		const markedHashes = header.marked.reduce(function(addrs, block){
			const vals = _.values(MARKED_CHILD_KEYS).map(function(key) {
				return String(block[key])
			})
			addrs.push(createMerkleRoot(vals))
	    return addrs
    }, [])
		const marked = createMerkleRoot(markedHashes)

		const fingerprintHashes = header.fingerprint.reduce(function(blocks, block){
			const vals = _.values(CHILD_BLOCK_KEYS).map(function(key) {
				return String(block[key])
			})
			blocks.push(createMerkleRoot(vals))
	    return blocks
    }, [])
		const fingerprint = createMerkleRoot(fingerprintHashes)
    header.fingerprint = fingerprint
    header.marked = marked
		const childVals = _.values(CHILD_KEYS).map(function(key) {
			return String(header[key])
		})
		const hash = createMerkleRoot(childVals)
		console.log(header.name + " hash: " + hash)
	  blockchainHeaders.push(hash)
		return blockchainHeaders
  }, [])
	const xor = blake2bl(getXor(headerHashes).toString('hex'))
  return createMerkleRoot([String(data.genesisBlockchainCount), xor])
}
