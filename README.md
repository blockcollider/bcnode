# BLOCK COLLIDER

Mining node with built-in block rover, DHT, and client discovery.

## Status

[![Build Status](https://travis-ci.com/blockcollider/bcnode.png?token=zcFCsPT3bTmtCApsaoXp&branch=master)](https://travis-ci.com/blockcollider/bcnode)

## System Requirements

### OS

- Ubuntu 16.04
- Mac OSX 10.11+

### Software

- [nodejs](https://nodejs.org) 4.3+
- [yarn](https://yarnpkg.com/en/docs/install) 1.3.2+
- [boost](http://www.boost.org/) Boost 1.66.0+
## Index
* init.js - startup file
* time.js - ntp offset, local UTC and UNIX timestamps
* string.js - standardized string operations, random hash, UUID
* roverbase.js - process manager for blockchain rovers
* discovery.js - DNS/NAT/disc-channel and Bittorrent client discovery
* identity.js - 1 to 1 matchin go of machine to mining account
* network.js - interface and events for the network
* dht.js - underlying storage and peer logic for network
* account.js - modular account management
* block.js - block storage / management interface
* crypt.js - encrypt/decrypt class for accounts.
* db.js - linvodb3 wrapper to LevelDB
* dht.js - K-Bucket storage library for a distributed hash table.
* distance.js - Ratcliff Obershelm
* genesis.json - testnet genesis block with origin blockchain hashes.
* install_quickfix_debian.sh - Ubuntu build file for FIX protocol
* log.js - streaming global WINSTON log
* pool.js - miner template for in memory TX pool
* storage.js - blockchain storage MMAP and ztsd

## Rovers
* btc_rover.js
* eth_rover.js
* neo_rover.js
* wav_rover.js
* lsk_rover.js

## Getting started

### Build from source

```
$ git clone https://github.com/blockcollider/bcnode
$ cd bcnode
$ ./scripts/debian_install_quickfix.sh
$ npm install
$ npm run dist
```

### Development

```
npm run watch
```

## Block Collider Developer Community

Helpful community tools will be added: [https://github.com/blockcollider/awesome-blockcollider](https://github.com/blockcollider/awesome-blockcollider)

## Support
* [Documentation](https://docs.blockcollider.org/docs)
* hello [at] blockcollider.org

