# OVERNET Protocol
Fast simple P2P communication across all mediums without forking your blockchain.

## Overview 
The OVERNET is an open community standard designed to add passive capabilities to blockchains without triggering a hard fork.  
* Any PoW/PoS/PoA blockchain can--without breaking consensus--become a multichain and begin absorbing other blockchains.  
* Centralized blockchains can transition to become decentralized blockchains.
* Any blockchain can build in compatibility with a Super Collider or Block Collider for side-chain applications. 
* Seamless messaging between Super Colliders and Block Collider.
* Blockchains can add adminstrate a Borderless marketplace.
* Blockchains upgrading consensus or governence standards no longer have to hard fork.  

No validators, relays, or centralization of any kind. 

## Tutorials
1. Adding a Super Collider to my blockchain
 

## Network 

### Handshake

- first message arriving is a `varint` encoded message length (discovery-swarm uses [length-prefixed-message](http://npmjs.com/length-prefixed-message) npm package for this)
- second message is `peerId`, it's in the length of previous message

### Message Format

| Field | Bytes (index) | Data type | Semantics |
|-------|-------|-----------|-----------|
| 0     | 0-3   | unsigned int, BE |Length of the body in the following field|
| 1     | 4+    | bytes		 | The application message itself |

### Application Messages

| Name | Type | Meaning |
|------|------|---------|
| Handshake | `0000R01` | First contact with new peer |
| Get Blocks | `0006R01` | Peer query for range of blocks to send low to high |
| Blocks | `0007W01` | Peer sent full blocks | 
| Get Block | `0008R01` | Peer query for block | 
| Block | `0008W01` | Peer sent full block | 
| Get Multiverse | `0009R01` | Peer query for block decision tree | 
| Multiverse | `0010W01` | Peer sent block decision tree | 
| Get Txs | `0013R01` | (Depricated) Peer query for transactions | 
| Tx | `0014W01` | Peer sent transaction | 
| Txs | `0015W01` | Peer sent transactions | 
| Get Header | `0016R01` | Peer requests header, sending its own | 
| Header | `0017W01` | Peer sent header response | 
| Get Headers | `0018R01` | Peer query for range of blocks between two heights | 
| Headers | `0019W01` | Peer sent array of headers  | 
| Get Data | `0020R01` | Peer query for data between two block hashes | 
| Data | `0021W01` | Peer sent block txs / data byte size and hash | 
| Get Distance | `0022R01` | Distance challenge broadcasted | 
| Distance | `0023W01` | Peer sent distance solution | 
| Get Config | `0025R01` | Peer query for service configuration | 

### Inital Peer Sync
1. Organize the peers into a pool of connections 
2. Sort the peers by block height, difficulty, connection blockchain height and latency. 
3. Challenge all peers for the latest edge block (a.k.a the chain tip) 
4. Begin syncing just the headers of blocks, if the peer feels switch to the next in line. Store blocks in raw storage. 
5. Request transaction data for given block headers, if it fails switch headers. 

### Protocol Defaults 
- Default data requests are limited to 500, headers requests are limited to 3000.
- 8 nodes must be connected before initial peer sync begins.

