// ID we found n github: aR7WPNCrZhhnYRnn8yRT
const Web3 = require('web3')
const web3 = new Web3(
  new Web3.providers.HttpProvider(
    'https://mainnet.infura.io/aR7WPNCrZhhnYRnn8yRT'
  )
)

class Ethereum {
  getBlock (height, cb) {
    web3.eth.getBlock(height, function (err, block) {
      if (err) {
        cb(err)
      } else {
        cb(null, block)
      }
    })
  }
}

module.exports = Ethereum
