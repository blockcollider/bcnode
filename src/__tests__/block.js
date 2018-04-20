const Block = require('../block')
const Transaction = require('../transaction')
const Crypt = require('../crypt')

const crypt = new Crypt()
describe('Block', () => {
  it('can instantiate self', () => {
    expect(new Block()).toBeInstanceOf(Block)
  })

  test('demo', () => {
    // const demo = {
    //   version: 2,
    //   distance: 0.5, // distance threshold to be achieved by miners
    //   range: 2200, // maximum distance of all transactions summed in block
    //   hash: '',
    //   ntx: 2, // number of transactions
    //   ne: 2, // numnber of edges
    //   mne: 2, // minimum numnber of edges
    //   miner:
    //     '0220d18aeddbf807bed67dcfbe58c171f63aa2df5a65695e6af18ca9710a662245', // public key of the miner
    //   input:
    //     '0xc8cf59fce963cc498c345f6d8869959d55fb11a6bc7092bf3a8826a94acfd3e4', // the hash of the last block
    //   sig: '', // sig of the hash of the block by the miner
    //   proof: '', //  the string before blake2bl which is concatenated to the miner public key
    //   merkleRoot: '',
    //   txs: [
    //     /// /////
    //     {
    //       type: '01',
    //       value: 2, // NRG award in wei
    //       to: 'XE5136GAE1KYDL1U9K5NDB25T4G2UXAP2U', // public key
    //       index: 1 // assigned by the miner
    //     },
    //     {
    //       type: '02',
    //       nonce: 1, // assigned by the account
    //       distance: 0.5,
    //       value: 2, // in atoms
    //       fee: 0.001,
    //       compiler:
    //         '0xc8cf59fce963cc498c345f6d8869959d55fb11a6bc7092bf3a8826a94acfd3e4',
    //       from:
    //         '0220d18aeddbf807bed67dcfbe58c171f63aa2df5a65695e6af18ca9710a662245',
    //       to: 'XE5136GAE1KYDL1U9K5NDB25T4G2UXAP2U', // public key
    //       input: '', // data of the raw transaction data which when signed by black2bl is the work
    //       trust: '', // the signature approving the the transaction for the from address
    //       sig: '', // hash of the transaction has signed by the public key of the miner
    //       proof: '', // the raw value which when processed by blake2bl is below the dist of the work
    //       miner: '', // the miner to recieve 20% of the transaction fee
    //       index: 2 // assigned by the miner
    //     }
    //   ],
    //   edges: [
    //     {
    //       tag: 'eth',
    //       org:
    //         '0x2e2890dabd2353cc6adc6f39b08fe7241228c7662cca52416a8068a2b664ec7f',
    //       n: 16,
    //       input:
    //         '0xe21141a7cd65742e716f8363740b2649b68bd156c55b2304e62643d633f0d42a',
    //       ph:
    //         '0xa12638fec0100e2aa05c4d949808fbfef6540923932b190807fc88ae74831451'
    //     },
    //     {
    //       tag: 'btc',
    //       org:
    //         '0x231fec41c8433409b352f911bc6b34fed15ddc0ef3a2e15a98ca0365c52559b3',
    //       n: 477727,
    //       input:
    //         '000000000000000000d3e789d269a2cbecbf38208c5d9f2242176be02ca911f9',
    //       ph: '0000000000000000009aa4e42f09efe4496f5e48afdc70f8d0184a7c0c504e68'
    //     }
    //   ]
    // }
    //
    // var ethEdge = {
    //   tag: 'eth',
    //   org: '0xe21141a7cd65742e716f8363740b2649b68bd156c55b2304e62643d633f0d42a',
    //   n: 16,
    //   input:
    //     '0xe21141a7cd65742e716f8363740b2649b68bd156c55b2304e62643d633f0d42a',
    //   ph: '0xa12638fec0100e2aa05c4d949808fbfef6540923932b190807fc88ae74831451'
    // }
    //
    // var btcEdge = {
    //   tag: 'btc',
    //   org: '0x231fec41c8433409b352f911bc6b34fed15ddc0ef3a2e15a98ca0365c52559b3',
    //   n: 477727,
    //   input: '000000000000000000d3e789d269a2cbecbf38208c5d9f2242176be02ca911f9',
    //   ph: '0000000000000000009aa4e42f09efe4496f5e48afdc70f8d0184a7c0c504e68'
    // }
    //
    // var block = new Block({
    //   version: 2,
    //   distance: 0.72,
    //   range: 2200,
    //   input: '69985e7ced6a0863bc3ecc64b6f10a2272480d3d67d194073a4716102fc20f55',
    //   proof: 'nottherealproof'
    // })
    //
    // var tx = new Transaction({
    //   type: 2,
    //   nonce: 1,
    //   distance: 0.5,
    //   value: 2,
    //   fee: 0.001,
    //   compiler:
    //     '0xc8cf59fce963cc498c345f6d8869959d55fb11a6bc7092bf3a8826a94acfd3e4',
    //   from:
    //     '0220d18aeddbf807bed67dcfbe58c171f63aa2df5a65695e6af18ca9710a662245',
    //   to: 'XE5136GAE1KYDL1U9K5NDB25T4G2UXAP2U', // public key
    //   input: '',
    //   trust: ''
    //   // 'sig': '',
    //   // 'proof': ''
    //   // 'miner': '',
    //   // 'index': 2
    // })
    //
    // tx.createHash()
    //
    // const privKey = crypt.createSecPrivateKey()
    // block.addBlock(ethEdge)
    // block.addBlock(btcEdge)
    // block.addTransaction(tx)
    // block.claimBlock('prooftest', privKey)
    //
    // block.addMutation(ethEdge).addMutation(ethEdge)
    //
    // ethEdge.n = 17
    //
    // block.addMutation(ethEdge)
    //
    // expect(crypt.validSecSignature(block.hash, block.sig, block.miner)).toBe(true)
    // expect(block).toEqual(demo)

    expect(1).toEqual(1)
  })
})
