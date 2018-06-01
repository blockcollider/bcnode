/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type BcBlock from '../protos/core_pb'
const { getGenesisBlock } = require('./genesis')
const { flatten } = require('ramda')
const logging = require('../logger')
const _ = require('lodash')
const COMMIT_MULTIVERSE_DEPTH = 7

export class Multiverse {
  _blocks: Object
  _commitDepth: number
  _writeQueue: BcBlock[]
  _height: number
  _logger: Object
  _persistence: any

  constructor (persistence: any, commitDepth: number = COMMIT_MULTIVERSE_DEPTH) {
    this._blocks = {}
    this._candidates = {}
    this._writeQueue = []
    this._persistence = persistence
    this._commitDepth = commitDepth
    this._logger = logging.getLogger(__filename)
    this._height = 0
    // TODO: I want this to load from current persistence
  }

  get blocks (): Object {
    return this._blocks
  }

  get blocksCount (): number {
    const blocks = Object.keys(this._blocks)
    return blocks.length
  }

  getMissingBlocks (block: BcBlock): ?Object {
    if (block === undefined)  { 
      this._logger.error('no block submitted to evaluate')
      return false 
    }
    const highestBlock = this.getHighestBlock()
    const height = block.getHeight() 
    const hash = block.getHash() 
    const previousHash = block.getPreviousHash() 
    const difficulty = block.getDifficulty() 
    const template = {
          queryHash: hash,
          queryHeight: height,
          mesage: "",
          start: 0,
          end: 0
    }
    if (highestBlock !== null) { 
      if (highestBlock.getHash() === hash) {
          template.message = "blocks are the equal"
          return  template
      }
      if (highestBlock.getHeight() === height) {
          if (highestBlock.getDifficulty() < difficulty) { 
             this.addBlock(block)
             template.message = "purposed block will be the current height of the multiverse"
             return template
          }
      }
      if (highestBlock.getHash() ===  previousHash) {
        this.addBlock(block)
        template.message = "purposed block is next block"
        return template
      }
      if(highestBlock.getHeight() + 2 < height) {
        template.start = highestBlock.getHeight() - 2 
        template.end = height + 1 
        template.message = "purposed block is ahead and disconnected from multiverse"
        return template
      }
      if(highestBlock.getHeight() > height && (highestBlock.getHeight() - height <= 7)) {
        this.addBlock(block)
        template.start = height - 10 
        template.end = height + 1 
        template.message = "purposed block may represent a seperate branch betlow the multiverse"
        return template
      }
      if(highestBlock.getHeight() > height) {
        this.addBlock(block)
        template.start = height - 7 
        template.end = height + 1 
        template.message = "purposed block far behind multiverse"
        return template
      }
      return template
    }
  }

  addBlock (block: BcBlock, force: boolean = false): boolean {
    const self = this
    const height = block.getHeight()
    const childHeight = height + 1
    const parentHeight = height - 1
    let hasParent = false
    let hasChild = false
    let inMultiverseLayer = false
    let added = false
    let syncing = false
    this._logger.info('new multiverse candidate for height ' + height + ' (' + block.getHash() + ')')
    if (this._blocks !== undefined) {
      if (Object.keys(this._blocks).length < 7) {
        syncing = true
      }
    }
    if (height === 1) {
      return false
      // this is the genesis block
    }
    if (this._blocks[parentHeight] !== undefined) {
      hasParent = this._blocks[parentHeight].reduce((all, item) => {
        if (item.getHash() === block.getPreviousHash()) {
          all = true
        }
        return all
      }, false)
    }
    if (this._blocks[childHeight] !== undefined) {
      hasChild = this._blocks[parentHeight].reduce((all, item) => {
        if (item.previousHash() === block.getHash()) {
          all = true
        }
        return all
      }, false)
    }
    if (this._blocks[height] !== undefined) {
      inMultiverseLayer = this._blocks[height].reduce((all, item) => {
        if (item.getHash() === block.getHash()) {
          all = true
        }
        return all
      }, false)
    }
    if (hasParent || hasChild || syncing) {
      if (inMultiverseLayer === false) {
        if (self._blocks[height] === undefined) {
          self._blocks[height] = []
        }
        self._blocks[height].push(block)
        if (self._blocks[height].length > 1) {
          self._blocks[height] = self._blocks[height].sort((a, b) => {
            if (a.getDifficulty() > b.getDifficulty()) return 1
            if (a.getDifficulty() < b.getDifficulty()) return -1
            return 0
          })
          if (self._blocks[height][0].getHash() === block.getHash()) {
            self._writeQueue.push(block)
            added = true
          }
        }
        if (self._blocks[height] !== undefined &&
            self._blocks[height].length > 0 &&
            self._blocks[height][0].getHash() === block.getHash()) {
          self._writeQueue.push(block)
          added = true
        }
      }
    } else if (force === true) {
      self._writeQueue.push(block)
    }
    return added
  }

  purge () {
    this._blocks = {}
    this._candidates = {}
    this._writeQueue = []
    this._logger.info('metaverse has been purged')
  }

  getHighestBlock (depth: ?Number, keys: ?Array, list:?Array): ?BcBlock {
    if (keys === undefined) {
      keys = Object.keys(this._blocks)
      list = []
    }
    if (depth === undefined) {
      depth = 7
    }
    const currentHeight = keys.pop()
    const currentRow = this._blocks[currentHeight]
    let matches = []
    currentRow.map((candidate) => {
      matches = list.reduce((all, chain) => {
        if (chain[0].getPreviousHash() === candidate.getHash()) {
          all++
          chain.unshift(candidate)
        }
        return all
      }, 0)
      if (matches === 0) { // this must be it's own chain
        list.push([candidate])
      }
    })
    if (keys.length > 0) {
      return this.getHighestBlock(depth, keys, list)
    }
    const minimumDepthChains = list.filter((chain) => {
      if (chain.length >= depth) {
        return true
      }
    })
    if (minimumDepthChains.length === 0) {
      const performance = list.reduce((order, chain) => {
        const sum = chain.reduce((all, b) => {
          return b.getDistance() + all
        }, 0)
        if (order.length === 0) {
          order.push([chain, sum])
        } else if (order[0][1] < sum) {
          order.unshift([chain, sum])
        }
      }, [])
      return performance[0][1]
    } else if (minimumDepthChains.length === 1) {
      return minimumDepthChains[0].pop()
    } else {
      const performance = minimumDepthChains.reduce((order, chain) => {
        const sum = chain.reduce((all, b) => {
          return b.getDistance() + all
        }, 0)
        if (order.length === 0) {
          order.push([chain, sum])
        } else if (order[0][1] < sum) {
          order.unshift([chain, sum])
        }
        return order[0][1]
      }, [])
      return performance[0][1]
    }
  }

  getLowestBlock (): ?BcBlock {
    const keys = Object.keys(this._blocks)
    if (keys.length > 0) {
      const last = keys.shift()
      const block = this._blocks[last][0]
      return block
    } else {
      return null
    }
  }

  shouldBroadcastBlock (block: BcBlock, force: boolean = false): boolean {
    const highestBlock = this.getHighestBlock()
    if (highestBlock !== null) {
      if (this.addBlock(block, force) === true) {
        // $FlowFixMe
        const height = highestBlock.getHeight()
        if (block.getHeight() >= height) {
          return true
        }
      }
      return true
    }
    return false
  }

  toArray (): Array<Array<BcBlock>> {
    return this._blocks.toarray()
  }

  toFlatArray (): Array<BcBlock> {
    const blocks = this.toArray()
    return flatten(blocks)
  }

  persist (): Promise<*> {
    const self = this
    let queue = []
    self.print()
    self._logger.info(self._writeQueue.length + ' purposed changes to optimize multiverse ')
    if (self._writeQueue.length > 0) {
      const tasks = []
      if (self._writeQueue.length > 1) {
        const t = self._writeQueue.reduce((table, b, i) => {
          if (table[b.getHeight()] === undefined) {
            table[b.getHeight()] = b
          } else {
            const current = table[b.getHeight()]
            if (b.getDifficulty() > current.getDifficulty()) {
              table[b.getHeight()] = b
            }
          }
          return table
        }, {})
        queue = _.values(t)
      } else {
        queue = queue.concat(self._writeQueue)
      }
      self._logger.info(queue.length + ' accepted changes optimize multiverse')
      self._persistence.get('bc.block.latest').then((latestStoredBlock) => {
        const highestBlock = self.getHighestBlock()
        if (highestBlock !== false &&
            highestBlock !== undefined &&
            // $FlowFixMe
            highestBlock.getHash() !== latestStoredBlock.getHash() &&
            // $FlowFixMe
            highestBlock.getHeight() > latestStoredBlock.getHeight()) {
          tasks.push(self._persistence.put('bc.block.latest', highestBlock))
        }
        while (self._writeQueue.length > 0) { self._writeQueue.pop() }
        while (queue.length > 0) {
          let candidate = queue.pop()
          let key = 'bc.block.' + candidate.getHeight()
          tasks.push(self._persistence.put(key, candidate))
        }
        return Promise.all(tasks).then(() => {
          return Promise.resolve()
        })
      })
        .catch((err) => {
          self._logger.error(err)
          self._logger.error('ephermeral latest block not found')
          const genesisBlock = getGenesisBlock()
          return Promise.all([
            self._persistence.put('bc.block.latest', genesisBlock),
            self._persistence.put('bc.block.1', genesisBlock)
          ])
            .then(() => {
              self._logger.warn('genesis block established as block 1')
              return Promise.resolve()
            })
            .catch((err) => {
              self._logger.error(err)
              return Promise.reject(err)
            })
        })
    } else {
      self._logger.info('no updates to multiverse data structure')
    }
    return Promise.resolve()
  }

  print () {
    const list = Object.keys(this._blocks).reduce((all, item) => {
      all.push({
        hash: this._blocks[item][0].getHash(),
        prevHash: this._blocks[item][0].getPreviousHash(),
        block: this._blocks[item][0].toObject(),
        blocksAtHeight: this._blocks[item][0].toObject()
      })
      return all
    }, [])
    this._logger.info(list)
  }
  // print () {
  //   for (let i = 0; i < this.maxDepth; i++) {
  //     console.log(`DEPTH: ${i}, HEIGHT: ${this.minHeight + i}`)
  //     const blocks = this.blocks.get(i) || []
  //     for (let j = 0; j < blocks.length; j++) {
  //       console.log(j, blocks[j].toObject())
  //     }
  //   }
  // }
}

export default Multiverse
