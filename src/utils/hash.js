const fs = require('fs')
const avon = require('avon')
const BN = require('bn.js')
const _ = require('lodash')
const { invoker, partialRight } = require('ramda')

const HASH = "0x028d3af888e08aa8380e5866b6ed068bd60e7b19b277537249649f9e7e56d549805ccfdec56fddd6153c6bf4ded85c3e072ccbdfd65ffda8a561b53c09377ef7d3ee9ebbf18a618c603faf2631c1bbb7d66a03ac87b2bc3f12e3ded808c6d4b9b528381fa2a7e95ff2368ba93191a9495daa7f50296401962029366"

function blake2bl (input) {
  return avon.sumBuffer(Buffer.from(input), avon.ALGORITHMS.B).toString('hex').slice(64,128)
}

console.log(blake2bl(HASH))

