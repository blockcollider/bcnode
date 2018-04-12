Block Collider Node
===================
#### Release Candidate 1 - "Boson Hunter"

Mining node with built-in block rover, DHT, and peer discovery.

## Status

[![Build Status](https://travis-ci.org/blockcollider/bcnode.svg?branch=master)](https://travis-ci.org/blockcollider/bcnode)

## System Requirements

### OS

- Ubuntu 16.04 (GNU)
- Mac OSX 10.11+ (Debian)

## Getting started

### Run official docker image from public repo

```
$ docker run -p 3000:3000 blockcollider/bcnode --ws --rovers --ui --node
```

### Build and run docker image locally

Install [cargo+rust](https://doc.rust-lang.org/cargo/getting-started/installation.html)

```
$ docker build -t blockcollider/bcnode .
$ docker run -p 3000:3000 blockcollider/bcnode --ws --rovers --ui --node
```

### Build from source

#### Prerequisites

- [git](https://git-scm.com/downloads) 2.1+
- [nodejs](https://nodejs.org) 4.3+
- [yarn](https://yarnpkg.com/en/docs/install) 1.3.2+

- [boost](http://www.boost.org/) Boost 1.66.0+

```
$ git clone https://github.com/blockcollider/bcnode
$ cd bcnode
$ npm install
$ npm run dist
```

### Run From Command Line

#### Show the help

```
$ ./bin/cli -h

  Usage: cli [options]


  Options:

    -V, --version     output the version number
    --rovers [items]  Start Rover (default: all)
    -R, --no-rovers   Do not start any rover
    --rpc             Enable RPC
    --ui              Enable Web UI
    --ws              Enable WebSocket
    -h, --help        output usage information

```

#### Startup node with rover GUI & BTC & LSK rovers

```
$ ./bin/cli --ui --rovers btc,lsk
```

#### Run node with all rovers, GUI, and socket stream   

```
$ ./bin/cli --ui --ws
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
