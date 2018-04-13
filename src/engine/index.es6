/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { EventEmitter } = require('events')
const { xprod, equals, all, values, partition } = require('ramda')

const config = require('../../config/config')
const logging = require('../logger')
const { Node } = require('../p2p')
const RoverManager = require('../rover/manager').default
const rovers = require('../rover/manager').rovers
const Server = require('../server/index').default
const PersistenceRocksDb = require('../persistence').RocksDb
const { RpcServer } = require('../rpc/index')
const { prepareWork, prepareNewBlock, mine } = require('../miner/miner')
const { getGenesisBlock } = require('../miner/genesis')

const MINER_PUBLIC_ADDRESS = '0x93490z9j390fdih2390kfcjsd90j3uifhs909ih3'

export default class Engine {
  _logger: Object; // eslint-disable-line no-undef
  _node: Node; // eslint-disable-line no-undef
  _persistence: PersistenceRocksDb; // eslint-disable-line no-undef
  _rovers: RoverManager; // eslint-disable-line no-undef
  _rpc: RpcServer; // eslint-disable-line no-undef
  _server: Server; // eslint-disable-line no-undef
  _emitter: EventEmitter; // eslint-disable-line no-undef
  _knownRovers: string[]; // eslint-disable-line no-undef
  _collectedBlocks: Object; // eslint-disable-line no-undef
  _canMine: bool; // eslint-disable-line no-undef
  _mining: bool;

  constructor (logger: Object, knownRovers: string[]) {
    this._logger = logging.getLogger(__filename)
    this._knownRovers = knownRovers
    this._node = new Node(this)
    this._persistence = new PersistenceRocksDb(config.persistence.path)
    this._rovers = new RoverManager()
    this._emitter = new EventEmitter()
    this._rpc = new RpcServer(this)
    this._server = new Server(this._rpc)
    this._collectedBlocks = {}
    for (let roverName of this._knownRovers) {
      this._collectedBlocks[roverName] = 0
    }
    this._canMine = false
    this._mining = false
  }

  /**
   * Initialize engine internals
   *
   * - Open database
   * - Store name of available rovers
   */
  async init () {
    const roverNames = Object.keys(rovers)
    // TODO get from CLI / config
    const minerPublicAddress = MINER_PUBLIC_ADDRESS
    try {
      await this._persistence.open()
      const res = await this.persistence.put('rovers', roverNames)
      if (res) {
        this._logger.debug('Stored rovers to persistence')
      }
      const genesisBlock = await this.persistence.get('bc.block.latest')
      if (!genesisBlock) {
        const newGenesisBlock = getGenesisBlock(minerPublicAddress)
        const genesisLatestCreationResult = await this.persistence.put('bc.block.latest', newGenesisBlock)
        const genesisFirstCreationResult = await this.persistence.put('bc.block.1', newGenesisBlock)
        if (genesisFirstCreationResult && genesisLatestCreationResult) {
          this._logger.debug('Genesis block was missing so we stored it')
        } else {
          this._logger.error('Error while creating genesis block')
          process.exit(1)
        }
      }
    } catch (e) {
      this._logger.warn('Could not store rovers to persistence')
    }

    this._logger.info('Engine initialized')
  }

  /**
   * Get node
   * @return {Node}
   */
  get node (): Node {
    return this._node
  }

  /**
   * Get persistence
   * @return {Persistence}
   */
  get persistence (): PersistenceRocksDb {
    return this._persistence
  }

  /**
   * Get rovers manager
   * @returns RoverManager
   */
  get rovers (): RoverManager {
    return this._rovers
  }

  /**
   * Get instance of RpcServer
   * @returns RpcServer
   */
  get rpc (): RpcServer {
    return this._rpc
  }

  /**
   * Get instance of Server (Express on steroids)
   * @returns Server
   */
  get server (): Server {
    return this._server
  }

  /**
   * Start Server
   */
  startNode () {
    this._logger.info('Starting P2P node')
    this.node.start()
  }

  /**
   * Start rovers
   * @param rovers - list (string; comma-delimited) of rover names to start
   */
  startRovers (rovers: string[]) {
    this._logger.info(`Starting rovers '${rovers.join(',')}'`)

    rovers.forEach(name => {
      if (name) {
        this._rovers.startRover(name)
      }
    })

    this._emitter.on('collectBlock', ({ block }) => {
      this._collectedBlocks[block.getBlockchain()] += 1

      if (!this._canMine && all((numCollected: number) => numCollected >= 2, values(this._collectedBlocks))) {
        this._canMine = true
      }

      // start mining only if all known chains are being rovered
      if (this._canMine && !this._mining && equals(new Set(this._knownRovers), new Set(rovers))) {
        const getKeys: [string, bool][] = xprod(rovers, ['latest', 'previous']).map(([chain, which]) => ([`${chain}.block.${which}`, which === 'latest']))

        Promise.all(getKeys.map(([key, isLatest]) => {
          return this._persistence.get(key).then(block => {
            this._logger.debug(`Got "${key}"`)
            return block
          })
        })).then(blocks => {
          this._logger.debug(`Got ${blocks.length} blocks from persistence`)
          const [currentBlocks, previousBlocks] = partition(blocks) // latest are on odd indices, previous on even
          console.log(currentBlocks.map(b => b.toObject()))
          return this._persistence.get('bc.block.latest').then(bcBlock => {
            return [previousBlocks, currentBlocks, bcBlock]
          })
        }).then(([previousBlocks, currentBlocks, previousBcBlock]) => {
          this._logger.debug(`Starting mining now`)
          const work = prepareWork(previousBcBlock, currentBlocks)
          const newBlock = prepareNewBlock(
            previousBcBlock,
            previousBcBlock.getChildBlockHeadersList(),
            currentBlocks,
            [], // TODO add transactions
            MINER_PUBLIC_ADDRESS // TODO miner public address
          )

          this._mining = true
          const solution = mine(
            work,
            MINER_PUBLIC_ADDRESS,
            newBlock.getMerkleRoot(),
            newBlock.getDifficulty()
          )
          this._mining = false

          // Set timestamp after mining
          newBlock.setTimestamp(Date.now() / 1000 << 0)
          // $FlowFixMe - add annotation to mine method
          newBlock.setDistance(solution.distance)
          // $FlowFixMe - add annotation to mine method
          newBlock.setNonce(solution.nonce)
          this._logger.info(`Mined new block: ${JSON.stringify(solution, null, 2)}`)
          // TODO broadcast BC block here
          // TODO persist BC block to persistence (?if verified?)
        }).catch(() => {
          this._mining = false
        })
      } else {
        if (!this._canMine) {
          this._logger.info(`Not mining because not collected enough blocks from all chains yet (status ${JSON.stringify(this._collectedBlocks)})`)
          return
        }
        if (!this._mining) {
          this._logger.info('Not starting mining new block while already mining one')
          return
        }
        this._logger.warn(`Not mining because not all known chains are being rovered (rovered: ${JSON.stringify(rovers)}, known: ${JSON.stringify(this._knownRovers)})`)
      }
    })
  }

  /**
   * Start Server
   *
   * @param opts Options to start server with
   */
  startServer (opts: Object) {
    this.server.run(opts)
  }
}
