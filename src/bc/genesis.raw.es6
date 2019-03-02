/* eslint-disable */
// this file is intentionaly named es6 to be copied to the resulting lib folder
// if named .json babel will not pick it up during transpilation
// hash is created from blake2bl(miner+merkleRoot+fingerprintsroot+emblemchainFingerpritnroot+difficulty)
module.exports = {
  "hash": "a8212d5a65f579c2018b19172be34e4422a93c8437f8e7c19ddc8cad15353862",
  "previousHash": "b6615809ca3ff24562ce2724ef010e369a976cb9068570074f88919eaddcd08f",
  "version": 1,
  "schemaVersion": 1,
  "height": 1,
  "miner": "0x028d3af888e08aa8380e5866b6ed068bd60e7b19",
  "difficulty": "296401962029366",
  "timestamp": 0,
  "merkleRoot": "b277537249649f9e7e56d549805ccfdec56fddd6153c6bf4ded85c3e072ccbdf",
  "chainRoot": "b4816d65eabac8f1a143805ffc6f4ca148c4548e020de3db21207a4849ea9abe",
  "distance": 1,
  "totalDistance": "1",
  "nonce": 0,

  "nrgGrant": 1600000000,
  "targetHash": "6f641871680978619176212f0000a40d8d0ae784ad35918ce677a5111a776cf9",
  "targetHeight": 1800066,
  "targetMiner": "0x028d3af888e08aa8380e5866b6ed068bd60e7b19",
  "targetSignature": "",

  "twn": 0,
  "twsList": [],

  "emblemWeight": 0,
  "emblemChainBlockHash": "",
  "emblemChainFingerprintRoot": "87b2bc3f12e3ded808c6d4b9b528381fa2a7e95ff2368ba93191a9495daa7f50",
  "emblemChainAddress": "",

  "txCount": 0,
  "txFeeBase": 0,
  "txDistanceSumLimit": 0,

  "childBlockchainCount": 5, // not used in genesis module now
  "blockchainHeadersMap": {},

  "blockchainFingerprintsRoot": "d65ffda8a561b53c09377ef7d3ee9ebbf18a618c603faf2631c1bbb7d66a03ac",
  "ATBalanceDigest": "32221da05457af84e7807c8c1a684a4a70efbad1cc2eac499ac7e87e0de4a7520c4b6b38f50f48ff015bc70f0036722c3d206ee4b1ac8230740f0bf6bc337b21"
}
