/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const Web3 = require('web3')
const { networks } = require('../config/networks')
const { EMBLEM_TESTNET, EMBLEM } = require('../rover/eth/abi')

const BC_NETWORK = process.env.BC_NETWORK || 'main'
const CURRENT_EMBLEM_ABI = (BC_NETWORK === 'main') ? EMBLEM : EMBLEM_TESTNET
const EMB_CONTRACT_ADDRESS = networks[BC_NETWORK].rovers.eth.embContractId
const web3ProviderUrl = networks[BC_NETWORK].rovers.eth.web3ProviderUrl

const provider = new Web3.providers.HttpProvider(web3ProviderUrl)
const web3 = new Web3(provider)

const VANITY_LENGTH = 12

const EMB_CONTRACT = new web3.eth.Contract(CURRENT_EMBLEM_ABI, EMB_CONTRACT_ADDRESS)

export const convertVanity = function (vanity: string, cb: (error?: Error|null, address?: string) => void) {
  if (vanity.length !== VANITY_LENGTH) {
    return cb(new Error(`Invalid vanity: ${vanity}`))
  }
  var bbf = web3.utils.fromAscii(vanity)
  EMB_CONTRACT.methods.getVanityOwner(bbf).call().then((bcAddress) => {
    if (bcAddress === '0x0000000000000000000000000000000000000000') {
      cb(new Error(`Vanity: ${vanity} does not associate with an address`))
    } else {
      cb(null, bcAddress)
    }
  }).catch((err) => {
    cb(err)
  })
}
