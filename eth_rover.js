
var string = require('./strings.js');
var crypto = require('crypto');
var portscanner = require('portscanner')
var Log = require("./log.js");
var ethUtils = require("ethereumjs-util");

var log = new Log();

//const DPT = require('devp2p-dpt')
const LRUCache = require('lru-cache')
const ms = require('ms')
const assert = require('assert')
const EthereumTx = require('ethereumjs-tx')
const EthereumBlock = require('ethereumjs-block')
const devp2p = require('ethereumjs-devp2p');
const chalk = require('chalk')
const rlp = require('rlp-encoding')

const ID = "eth";
const DEFAULT_TYPE = "log";

const DAO_FORK_SUPPORT = true
const ETH_1920000 = '4985f5ca3d2afbec36529aa96f74de3cc10a2a4a6c44f2157a57d2c6059a11bb'
const ETH_1920000_HEADER = rlp.decode(Buffer.from('f9020da0a218e2c611f21232d857e3c8cecdcdf1f65f25a4477f98f6f47e4063807f2308a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d4934794bcdfc35b86bedf72f0cda046a3c16829a2ef41d1a0c5e389416116e3696cce82ec4533cce33efccb24ce245ae9546a4b8f0d5e9a75a07701df8e07169452554d14aadd7bfa256d4a1d0355c1d174ab373e3e2d0a3743a026cf9d9422e9dd95aedc7914db690b92bab6902f5221d62694a2fa5d065f534bb90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008638c3bf2616aa831d4c008347e7c08301482084578f7aa88d64616f2d686172642d666f726ba05b5acbf4bf305f948bd7be176047b20623e1417f75597341a059729165b9239788bede87201de42426', 'hex'))
const ETC_1920000 = '94365e3a8c0b35089c1d1195081fe7489b528a84b22199c916180db8b28ade7f'

var bootNodes = require('ethereum-common').bootstrapNodes.map((node) => {
  return {
    address: node.ip,
    udpPort: node.port,
    tcpPort: node.port
  }
})


var altBootnodes = [
  { address: '52.169.42.101', udpPort: 30303 },
  { address: '52.16.188.185', udpPort: 30303 },
  { address: '52.74.57.123', udpPort: 30303 },
]


const BOOTNODES = bootNodes.concat(altBootnodes);

const getPeerAddr = (peer) => `${peer._socket.remoteAddress}:${peer._socket.remotePort}`

const HOSTS = BOOTNODES.map(function(b){
    return b.address;
});


function send(type, data){

    var d;
    var t;

    if(data == undefined){
        t = DEFAULT_TYPE;
        d = type;
    } else {
        t = type;
        d = data;
    }

    var meta = {
        id: ID,
        type: t,
        data: d 
    }

    process.send(meta);

}


function stringToInt(str){

    var a = Buffer(str.slice(2, str.length+1), 'hex')
    var b = ethUtils.bufferToInt(a)

	return b;

}

function transmitRoverBlock(block){

	var d = block.toJSON({ labeled: true });

	console.log("+++++++++++++++++++++++++++");
	console.log(d);

	var obj = {}

		//obj.number = stringToInt(d.header.number);
		obj.prevHash = d.header.parentHash;
		obj.root = d.header.stateRoot;
		//obj.gasLimit = stringToInt(d.header.gasLimit);
		//obj.gasUsed = stringToInt(d.header.gasUsed);
		//obj.nonce = stringToInt(d.header.nonce);
		//obj.timestamp = stringToInt(d.header.timestamp);
		//obj.difficulty = stringToInt(d.header.difficulty);
		obj.coinbase = d.header.coinbase;
		obj.marked = false;
		obj.transactions = d.transactions.map(function(t){

			var tx = new EthereumTx(t);

			t.txHash = ethUtils.bufferToHex(tx.hash(true));

			return t;

		}); 

	console.log(obj);

	send("block", obj);

}

function isOpenPort(host, port, cb){
	portscanner.checkPortStatus(8545, host, cb); 
}

function getPrivateKey() {
    return crypto.randomBytes(32);
}


function Network (key) {

    if(key != undefined){
        this.key = key;
    } else {
        this.key = getPrivateKey();
    }

    this.minimumPeers = 12;

    this.peers = [] 

}

Network.prototype = {

    addPeer: function(peer){

        var self = this;

        if(peer == undefined || peer.endpoint == undefined){
            return;
        }

        var port;
        var host = peer.endpoint.address;
        var protocol = "http";

        if(HOSTS.indexOf(host) > -1){
            return;
        }

        if(peer.endpoint.tcpPort != undefined){

            port = peer.endpoint.tcpPort;

            var target = protocol+"://"+host+":"+port;

            log.info("new peer: "+target);

            self.peers.push(target);

        }

    },

    connect: function () {

        var self = this;

        portscanner.findAPortNotInUse(30304, 33663, function(err, port) {

            if(err) { 

                log.error("unable to find local network interface to listen on");
                process.exit(3);

            } else {

				// DPT
				const dpt = new devp2p.DPT(self.key, {
				  refreshInterval: 30000,
				  timeout: 15000,
				  endpoint: {
					address: '0.0.0.0',
					udpPort: null,
					tcpPort: null
				  }
				})

				dpt.on('error', function(err){ }); 

				// RLPx
				const rlpx = new devp2p.RLPx(self.key, {
				  dpt: dpt,
				  maxPeers: 60,
				  capabilities: [
					devp2p.ETH.eth63,
					devp2p.ETH.eth62
				  ],
				  listenPort: null
				})

				rlpx.on('error', (err) => console.error(chalk.red(`RLPx error: ${err.stack || err}`)))

				rlpx.on('peer:added', (peer) => {
				  const addr = getPeerAddr(peer)

				  const host = addr.split(":")[0];
				  const port = addr.split(":")[1];
				
				  const eth = peer.getProtocols()[0]
				  const requests = { headers: [], bodies: [] }

				  const clientId = peer.getHelloMessage().clientId

				  //console.log(chalk.green(`Add peer: ${addr} ${clientId} (eth${eth.getVersion()}) (total: ${rlpx.getPeers().length})`))

				  eth.sendStatus({
					networkId: 1,
					td: devp2p._util.int2buffer(17179869184), // total difficulty in genesis block
					bestHash: Buffer.from('d4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3', 'hex'),
					genesisHash: Buffer.from('d4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3', 'hex')
				  })

				  // check DAO
				  let forkDrop = null
				  let forkVerified = false
				  eth.once('status', () => {
					if (DAO_FORK_SUPPORT === null) return
					eth.sendMessage(devp2p.ETH.MESSAGE_CODES.GET_BLOCK_HEADERS, [ 1920000, 1, 0, 0 ])
					forkDrop = setTimeout(() => {
					  peer.disconnect(devp2p.RLPx.DISCONNECT_REASONS.USELESS_PEER)
					}, ms('15s'))
					peer.once('close', () => clearTimeout(forkDrop))
				  })

				  eth.on('message', async (code, payload) => {
					//console.log(`new message (${addr}) ${code} ${rlp.encode(payload).toString('hex')}`)
					switch (code) {
					  case devp2p.ETH.MESSAGE_CODES.NEW_BLOCK_HASHES:
						if (DAO_FORK_SUPPORT !== null && !forkVerified) break

						for (let item of payload) {
						  const blockHash = item[0]
						  if (blocksCache.has(blockHash.toString('hex'))) continue
						  setTimeout(() => {
							eth.sendMessage(devp2p.ETH.MESSAGE_CODES.GET_BLOCK_HEADERS, [ blockHash, 1, 0, 0 ])
							requests.headers.push(blockHash)
						  }, ms('0.1s'))
						}
						break

					  case devp2p.ETH.MESSAGE_CODES.TX:
						if (DAO_FORK_SUPPORT !== null && !forkVerified) break

						///////////////////////// FIX ME
						for (let item of payload) {
						  const tx = new EthereumTx(item)
						  if (isValidTx(tx)) onNewTx(tx, peer)
						}

						break

					  case devp2p.ETH.MESSAGE_CODES.GET_BLOCK_HEADERS:
						const headers = []
						// hack
						if (DAO_FORK_SUPPORT && devp2p._util.buffer2int(payload[0]) === 1920000) {
						  headers.push(ETH_1920000_HEADER)
						}

						eth.sendMessage(devp2p.ETH.MESSAGE_CODES.BLOCK_HEADERS, headers)
						break

					  case devp2p.ETH.MESSAGE_CODES.BLOCK_HEADERS:
						if (DAO_FORK_SUPPORT !== null && !forkVerified) {
						  if (payload.length !== 1) {
							//console.log(`${addr} expected one header for DAO fork verify (received: ${payload.length})`)
							break
						  }

						  const expectedHash = DAO_FORK_SUPPORT ? ETH_1920000 : ETC_1920000
						  const header = new EthereumBlock.Header(payload[0])
						  if (header.hash().toString('hex') === expectedHash) {
							//console.log(`${addr} verified to be on the same side of the DAO fork`)
							clearTimeout(forkDrop)
							forkVerified = true
						  }
						} else {
						  if (payload.length > 1) {
							//console.log(`${addr} not more than one block header expected (received: ${payload.length})`)
							break
						  }

						  let isValidPayload = false
						  const header = new EthereumBlock.Header(payload[0])
						  while (requests.headers.length > 0) {
							const blockHash = requests.headers.shift()
							console.log(blockHash);
							if (header.hash().equals(blockHash)) {
							  isValidPayload = true
							  setTimeout(() => {
								eth.sendMessage(devp2p.ETH.MESSAGE_CODES.GET_BLOCK_BODIES, [ blockHash ])
								requests.bodies.push(header)
							  }, ms('0.1s'))
							  break
							}
						  }

						  if (!isValidPayload) {
							//console.log(`${addr} received wrong block header ${header.hash().toString('hex')}`)
						  }
						}

						break

					  case devp2p.ETH.MESSAGE_CODES.GET_BLOCK_BODIES:
						eth.sendMessage(devp2p.ETH.MESSAGE_CODES.BLOCK_BODIES, [])
						break

					  case devp2p.ETH.MESSAGE_CODES.BLOCK_BODIES:
						if (DAO_FORK_SUPPORT !== null && !forkVerified) break

						if (payload.length !== 1) {
						  console.log(`${addr} not more than one block body expected (received: ${payload.length})`)
						  break
						}

						let isValidPayload = false
						while (requests.bodies.length > 0) {
						  const header = requests.bodies.shift()
						  const block = new EthereumBlock([header.raw, payload[0][0], payload[0][1]])
						  const isValid = await isValidBlock(block)
						  if (isValid) {
							isValidPayload = true
							onNewBlock(block, peer)
							break
						  }
						}

						if (!isValidPayload) {
						  console.log(`${addr} received wrong block body`)
						}

						break

					  case devp2p.ETH.MESSAGE_CODES.NEW_BLOCK:
						if (DAO_FORK_SUPPORT !== null && !forkVerified) break

						const newBlock = new EthereumBlock(payload[0])
						const isValidNewBlock = await isValidBlock(newBlock)
						if (isValidNewBlock) onNewBlock(newBlock, peer)

						break

					  case devp2p.ETH.MESSAGE_CODES.GET_NODE_DATA:
						eth.sendMessage(devp2p.ETH.MESSAGE_CODES.NODE_DATA, [])
						break

					  case devp2p.ETH.MESSAGE_CODES.NODE_DATA:
						break

					  case devp2p.ETH.MESSAGE_CODES.GET_RECEIPTS:
						eth.sendMessage(devp2p.ETH.MESSAGE_CODES.RECEIPTS, [])
						break

					  case devp2p.ETH.MESSAGE_CODES.RECEIPTS:
						break
					}
				  })
				})

				rlpx.on('peer:removed', (peer, reason, disconnectWe) => {
				  const who = disconnectWe ? 'we disconnect' : 'peer disconnect'
				  const total = rlpx.getPeers().length
				  //console.log(chalk.yellow(`Remove peer: ${getPeerAddr(peer)} (${who}, reason code: ${String(reason)}) (total: ${total})`))
				})

				rlpx.on('peer:error', (peer, err) => {
				  if (err.code === 'ECONNRESET') return

				  if (err instanceof assert.AssertionError) {
					const peerId = peer.getId()
					if (peerId !== null) dpt.banPeer(peerId, ms('5m'))

					//console.error(chalk.red(`Peer error (${getPeerAddr(peer)}): ${err.message}`))
					return
				  }

				  console.error(chalk.red(`Peer error (${getPeerAddr(peer)}): ${err.stack || err}`))
				})

				for (let bootnode of BOOTNODES) {
				  dpt.bootstrap(bootnode).catch((err) => {
					console.error(chalk.bold.red(`DPT bootstrap error: ${err.stack || err}`))
				  })
				}

				const txCache = new LRUCache({ max: 2000 })


				function onNewTx (tx, peer) {
				  const txHashHex = tx.hash().toString('hex')
				  if (txCache.has(txHashHex)) return
				  txCache.set(txHashHex, true)
				  //console.log(`new tx: ${txHashHex} (from ${getPeerAddr(peer)})`)
				}

				const blocksCache = new LRUCache({ max: 110 })

				function onNewBlock (block, peer) {
				  const blockHashHex = block.hash().toString('hex')
				  if (blocksCache.has(blockHashHex)) return

				  blocksCache.set(blockHashHex, true)

				  console.log(`new block: ${blockHashHex} (from ${getPeerAddr(peer)})`)

				  for (let tx of block.transactions) onNewTx(tx, peer)

				  transmitRoverBlock(block);

				}

				function isValidTx (tx) {
				  return tx.validate(false)
				}

				async function isValidBlock (block) {
				  if (!block.validateUnclesHash()) return false
				  if (!block.transactions.every(isValidTx)) return false
				  return new Promise((resolve, reject) => {
					block.genTxTrie(() => {
					  try {
						resolve(block.validateTransactionsTrie())
					  } catch (err) {
						reject(err)
					  }
					})
				  })
				}

				setInterval(() => {

				  //console.log(dpt.getPeers());
				  const peersCount = dpt.getPeers().length
				  const openSlots = rlpx._getOpenSlots()
				  const queueLength = rlpx._peersQueue.length
				  const queueLength2 = rlpx._peersQueue.filter((o) => o.ts <= Date.now()).length

				  log.info(`${ID} rover peers ${peersCount}, open slots: ${openSlots}, queue: ${queueLength} / ${queueLength2}`)
				}, ms('30s'))

			}

		});

    },

    close: function() {

        var self = this;

        try {

            send("log", "disconnecting "+ID+" rover");

            self.dpt.stop();

            process.exit();

        } catch(err) {

            log.error(err);

            send("error", err);

        }

    }

}

var Controller = {

    dpt: false,

    interfaces: [],

    start: function() {

        var network = new Network();

            network.connect();

            Controller.interfaces.push(network);

    },

    init: function() {

        Controller.start();
    },

    close: function(){

        Controller.interfaces.map(function(c){
            c.close();
        });

    }

}

process.on("uncaughtError", function(e){

    console.trace(e);
    console.trace("critical error ETH rover, exiting...");
    process.exit(3);

});

process.on("message", function(msg){

    var args = [];
    var func = "";

    if(msg.func != undefined){

        func = msg.func;

        if(msg.args != undefined){
            args = msg.args;
        }

        if(Controller[msg.func] != undefined){
            Controller[func].call(args);
        }

    }

});
