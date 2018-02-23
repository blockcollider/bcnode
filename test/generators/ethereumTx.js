// ID we found n github: aR7WPNCrZhhnYRnn8yRT
const EthereumTx = require('ethereumjs-tx')
const privateKey = Buffer.from(
  'e331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109',
  'hex'
)

const defaultTxParams = {
  nonce: '0x00',
  gasPrice: '0x09184e72a000',
  gasLimit: '0x2710',
  to: '0xe432c5017d18fc17a85d69a73548b803a99119d8',
  value: '0xbebc200',
  data:
    '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
  chainId: 3
}

class Ethereum {
  getJSONTx () {
    const tx = new EthereumTx(defaultTxParams)
    return tx.toJSON()
  }
  getSerializedTx () {
    const tx = new EthereumTx(defaultTxParams)
    return tx.serialize().toString('hex')
  }
  getSignedSerializedTx () {
    const tx = new EthereumTx(defaultTxParams)
    tx.sign(privateKey)
    const serializedTx = tx.serialize()
    return serializedTx.toString('hex')
  }
}

module.exports = Ethereum

const eth = new Ethereum()

const stx = eth.getSerializedTx()

const sstx = eth.getSignedSerializedTx()

console.log(stx)
console.log('---')
console.log(sstx)
