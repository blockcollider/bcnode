# ETH Rover

## Resources

- [eth/63 protocol](https://github.com/ethereum/devp2p/blob/master/caps/eth.md)

## Initial sync

- After requested, only a bool flag that it should happen is set
- Only after first current block is received, the range of blocks [72h before; currentBlock.number - 1) is requested
- the whole sync is split to batches of 128 blocks
- TODO: add a filter not to request block number we actually have in the database
    - Now a bit complicated because rover is in separate process not able to talk to persistence directly, only using gRPC / node.js’s IPC

## Normal operation

- even on test networks it runs connected to mainnet ETH
- when started, it connects to ETH network, establishes quorum and starts listenin on incoming messages
- to all connected peers, request for ETC fork (block number 1_920_000) is sent and peer is checked to reply with correct ETH block hash, if not peer is disconnected
- difficulty of current block is checked against parent block to ensure well-formed chain, if more than 8 blocks not connecting to each other are received, rover is restarted
- Map of peerAddress -> requests is kept at network class level
    - `type PeerRequests = { [address: string]: { hashes: string[], headers: EthereumBlock.Header[] }}`
- sync follow this cascade:
    - New hash is received from network OR we know the number of block we want
    - With this GetBlockHeaders message is send to peer and information stored to peerRequests[peerAddr].hashes array is stored
    - BlockHeaders message comes for requested hashes / block numbers, in the same order as GetBlockHeader requests were sent to peer
    - With header hashes GetBlockBodies messages is sent to peer with hashes / numbers of the blocks and whole headers in the incoming order ale stored ni peerRequests[peerAddr].headers array. The order is essential to be able to pair headers with incoming block bodies (these will come in the requested order)
    - BlockBodies message comes with block bodies [txs, uncles] structure, this is paired in incoming order with headers from peerRequests[peerAddr].headers to form complete Ethereum.Block for validation and storage

## ABI and EMB contract parsing

TBD

