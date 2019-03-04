Block Collider Node (ARC BLOCK)
===============================
#### Release Candidate 2 - "Arc Block"

Mining node with Borderless SAFE MODE OFF. Trades can be executed between all five blockchains. This is meant for development only.

!!! IMPORTANT !!!

- This is real Bitcoin, Ethereum, NEO, Waves. Lost coins cannot be recovered, redacted, or reset. It is both the point and the consequence of a truly decentralized marketplace.
- This could be called the 'nightly' build in that it versions very quickly until April 21st 2019.  
- If you are running this there is a private group on embnation.com (think Bitcoin Phantom IRC in the old days). It is invite only.
- Running this node assumes you are a programmer, better yet you are an Evangelist or member of Block Collider Advanced.  
- Everything is open source in this repo except for the final NRG regard algorithm and the move from the 32 bit to 64 PoD to prevent ASIC fabrication.


### Disabling SAFE MODE and entering UNSTOPPABLE DEVELOPER MODE.

1. Check behind you for validators.
2. Download and run BORDERLESS (http://borderless.blockcollider.org)[http://borderless.blockcollider.org] [install instructions](https://blog.blockcollider.org/welcome-to-block-colliders-borderless-aff2ea5edffc) you will need a BSEC wallet [https://portal.blockcollider.org]()
3. Once you have uploaded your wallet, in the upper right hand side select Settings. The following fields will be available:  hostname, port, and secure cookie.
4. Edit the secure cookie field with a secret value.
5. Once you have done so start up your miner and append '--scookie={YOUR SECRET VALUE}',
6. Refresh BORDERLESS and welcome to UD MODE.

### The Vote
On April 21st, on EMB Nation, the community will spend two days trying out the final build. The vote will either extend development a month or release the ARC BLOCK to the world.

### Getting NRG
Unique to an ARC Block Node your node will mine on it's own by default.

### Selecting An Executive Branch
Unique to an ARC Block Node you can join hidden executive branches (get it?) which allow you to sync your blocks and compete with other miners. Enter at your own risk.
- carter
- mckinley
- garfield
- lincoln
- harding
- kennedy
- coolidge

To specify an executive branch add the environment variable 'export BC_NETWORK="EXECUTIVE BRANCH NAME}"' 

### Where is my NRG from Before Target
If you were a miner lucky enough to participate in Before Target your NRG balance in the arc block. We won't release it until after the community vote on April 21st. No Bitcoin Gold double-spend foolery!

### Block Collider Advanced Community
For technical & mining questions visit: https://www.t.me/blockcollideradvanced

## Status

[![Build Status](https://travis-ci.org/blockcollider/bcnode.svg?branch=master)](https://travis-ci.org/blockcollider/bcnode)
[![Build status](https://ci.appveyor.com/api/projects/status/hfqkjvw3cmxa3y49?svg=true)](https://ci.appveyor.com/project/ArjunRajJain/bcnode)

## System Requirements

### OS

- Ubuntu 16.04 (GNU)
- Mac OSX 10.11+

## Getting started

- *$ - lines starting with this symbol ($) should be executed in bash/terminal/command-line/cmd.exe WITHOUT symbol ($) itself*
- *# - lines starting with this symbol (#) are comments and SHOULD not be executed*

### Environment variables

Following environment variables can be used for advanced tweaking

| Name                     | Description                               |
|--------------------------|-------------------------------------------|
| BC_CONFIG                | Path to custom config file; string        |
| BC_DEBUG                 | Collect data in _debug folder; true/false |
| BC_DATA_DIR              | Data directory; path                      |
| BC_GRPC_HOST             | gRPC bind host; IP                        |
| BC_GRPC_PORT             | gRPC port; 0..65535                       |
| BC_LOG                   | Override log level; debug/info/warn/error |
| BC_MINER_KEY             | Miner key; string                         |
| BC_MONITOR               | Print Stats periodically; true/false      |
| BC_UI_PORT               | Web UI port; 0..65535                     |
| BC_P2P_PASSIVE           | Be passive, ignore discovered peers       |
| BC_RUST_MINER            | Use rust multicore miner; true/false      |
| BC_GRPC_RUST_MINER_PORT  | Override default RPC port of rust miner   |

### Run official docker image from public repo

***Backround/Daemon***

```
$ docker run --rm --name bcnode -d -p 3000:3000 -p 16061:16061 -p 16060:16060 blockcollider/bcnode:latest start --ws --rovers --ui --node --miner-key YOUR_MINER_ADDRESS
```

***Foreground***
```
$ docker run --rm --name bcnode -p 3000:3000 -p 16061:16061 -p 16060:16060 blockcollider/bcnode:latest start --ws --rovers --ui --node --miner-key YOUR_MINER_ADDRESS
```

### Build docker image locally

```
# Clone sources
$ git clone https://github.com/blockcollider/bcnode.git

# Change folder
$ cd bcnode

# Switch to release branch
$ git checkout release

# Build image locally
$ docker build -t blockcollider/bcnode .
```

### Build from source

#### Prerequisites

- [rust & cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html)
- [git](https://git-scm.com/downloads) 2.1+
- [nodejs](https://nodejs.org) 4.3+
- [yarn](https://yarnpkg.com/en/docs/install) 1.3.2+
- [boost](http://www.boost.org/) Boost 1.66.0+
- [openssl](http://www.openssl.org/) OpenSSL 1.1.1+

```
# Clone sources
$ git clone https://github.com/blockcollider/bcnode

# Change folder
$ cd bcnode

# Install dependencies
$ yarn

# Build bcnode
$ yarn run dist
```

### Run From Command Line

#### Show the help

```
$ ./bin/cli start -h

  Usage: start [opts]

  Start Block Collider

  Options:

    --miner-key [key]  Miner key
    -n, --node         Start P2P node
    --rovers [items]   start rover (default: btc, eth, lsk, neo, wav)
    -R, --no-rovers    do not start any rover
    --rpc              enable RPC
    --ui               enable Web UI
    --ws               enable WebSocket
    -h, --help         output usage information
```

#### Startup node with rover GUI & BTC & LSK rovers

```
$ ./bin/cli start --ui --ws --rovers btc,lsk
```

#### Run node with all rovers, GUI, and socket stream

```
$ ./bin/cli start --ui --ws
```

### Development

```
npm run watch
```

## Documenation

### Generate documentation

```
$ yarn run doc
```

### Open generated documentation

```
$ open ./docs/index.html
```

## Rovers (Alphabetical)
* Bitcoin Blockchain
* Ethereum Blockchain
* Lisk Blockchain
* Neo Blockchain
* Waves Blockchain

## Block Collider Developer Community

Helpful community tools will be added: [https://github.com/blockcollider/awesome-blockcollider](https://github.com/blockcollider/awesome-blockcollider)

## Help & Support
* [Documentation](https://docs.blockcollider.org/docs)
* [Blog](https://blog.blockcollider.org/latest)
* hello [at] blockcollider.org

## Forge
Rumor the forger has fired up the kiln again and the mysterious forged Emblems, founders hoodies, and other gear will appear and disappear through the month on EMB Nation, the code base, and the Executive Branches. We will also be hiding private keys around filled with DOGE because who can haz fun big no DOGE. We will never give away EMB. 
