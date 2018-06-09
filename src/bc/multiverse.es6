/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type BcBlock from '../protos/core_pb'
const { equals, flatten, sum } = require('ramda')
const { validateBlockSequence } = require('./validation')
const logging = require('../logger')
const COMMIT_MULTIVERSE_DEPTH = 7

export class Multiverse {
  _blocks: Object
  _commitDepth: number
  _writeQueue: BcBlock[]
  _height: number
  _created: number
  _selective: boolean
  _logger: Object

  constructor (selective: boolean = false, commitDepth: number = COMMIT_MULTIVERSE_DEPTH) {
    this._selective = selective
    this._blocks = {}
    this._writeQueue = []
    this._commitDepth = commitDepth
    this._logger = logging.getLogger(__filename)
    this._height = 0
    this._created = Math.floor(Date.now() * 0.001)
    if (selective === true) {
      this._logger.warn('selective multiverse created')
    }
  }

  get blocks (): Object {
    return this._blocks
  }

  get blocksCount (): number {
    const blocks = Object.keys(this._blocks)
    return blocks.length
  }

  getMissingBlocks (block: BcBlock): Object {
    if (block === undefined) {
      this._logger.error('no block submitted to evaluate')
      return false
    }
    const highestBlock = this.getHighestBlock()
    const height = block.getHeight()
    const hash = block.getHash()
    const previousHash = block.getPreviousHash()
    const distance = block.getDistance()
    const template = {
      queryHash: hash,
      queryHeight: height,
      message: '',
      from: 0,
      to: 0
    }
    if (highestBlock !== null) {
      if (highestBlock.getHash() === hash) {
        template.message = 'blocks are the equal to each-other'
        return template
      } else if (highestBlock.getHeight() === height) {
        if (highestBlock.getDistance() < distance) {
          this.addBlock(block)
          template.message = 'purposed block will be the current height of the multiverse'
        }
      } else if (highestBlock.getHash() === previousHash) {
        this.addBlock(block)
        template.message = 'purposed block is next block'
      } else if (highestBlock.getHeight() + 2 < height) {
        template.from = highestBlock.getHeight() - 2
        template.to = height + 1
        template.message = 'purposed block is ahead and disconnected from multiverse'
      } else if (highestBlock.getHeight() > height && (highestBlock.getHeight() - height <= 7)) {
        this.addBlock(block)
        template.from = height - 10
        template.to = height + 1
        template.message = 'purposed block may be in a multiverse layer'
      } else if (highestBlock.getHeight() > height) {
        this.addBlock(block)
        template.from = height - 1
        template.to = this.getLowestBlock().getHeight() + 1 // Plus one so we can check with the multiverse if side chain
        template.message = 'purposed block far behnd multiverse'
      }
      return template
    } else {
      this.addBlock(block)
      template.message = 'no highest block has been selected for multiverse'
    }
    return template
  }

  validateMultiverse (mv: Object): boolean {
    if (Object.keys(mv).length < 3) {
      this._logger.error('threshold not met, comparison between multiverse structures after dimension depth of 3')
      return false
    }
    return true
  }

  isBestMultiverse (alt: Object): boolean {
    const current = this._blocks
    if (!this.validateMultiverse(alt)) {
      this._logger.warn('candidate multiverse is malformed')
      return false
    }
    if (Object.keys(current).length < 7) {
      this._logger.warn('current multiverse below suggested distance threshold')
    }
    // TODO: Switch to child chain comparisons
    return false
  }

  addBlock (block: BcBlock, force: boolean = false): boolean {
    const self = this
    const height = block.getHeight()
    const childHeight = height + 1
    const parentHeight = height - 1
    const keyCount = Object.keys(this._blocks).length
    const blockBlockchainHeaders = block.getBlockchainHeaders()
    let hasParent = false
    let hasChild = false
    let inMultiverseLayer = false
    let added = false
    let syncing = false
    this._logger.info('new multiverse candidate for height ' + height + ' (' + block.getHash() + ')')
    if (keyCount < 7 && this._selective === false) {
      this._logger.info('node is attempting to sync, multiverse filtering disabled')
      syncing = true
      force = true
    // keyCount must be 2 to account for the genesis block and the next block
    } else if (keyCount < 1) {
      syncing = true
      force = true
    }
    // if (keyCount > 16) {
    //  // remove the oldest
    //  delete this._blocks[Object.keys(this._blocks)[0]]
    // }
    if (this._blocks[parentHeight] !== undefined) {
      hasParent = this._blocks[parentHeight].reduce((all, item) => {
        if (item.getHash() === block.getPreviousHash() && item.getHeight() === (block.getHeight() - 1)) {
          console.log('!!! block ' + item.getHeight() + ' ' + item.getHash() + ' is PARENT of --> ' + block.getHeight() + ' ' + block.getHash())
          const parentHeadersObject = item.getBlockchainHeaders()
          const parentHeaders = Object.keys(parentHeadersObject).reduce((all, chain) => {
            const sample = parentHeadersObject[chain].pop()
            all.push(sample.getHash())
            return all
          }, [])
          const blockHeaders = blockBlockchainHeaders.map((a) => {
            return a.getHash()
          })
          if (!equals(parentHeaders, blockHeaders)) {
            all = true
          }
        }
        return all
      }, false)
    }
    if (this._blocks[childHeight] !== undefined) {
      hasChild = this._blocks[childHeight].reduce((all, item) => {
        if (item.getPreviousHash() === block.getHash() && (item.getHeight() - 1) === block.getHeight()) {
          console.log('!!! block ' + item.getHeight() + ' ' + item.getHash() + ' <-- is CHILD of ' + block.getHeight() + ' ' + block.getHash())
          const childHeadersObject = item.getBlockchainHeaders()
          const childHeaders = Object.keys(childHeadersObject).reduce((all, chain) => {
            const sample = childHeadersObject[chain].pop()
            all.push(sample.getHash())
            return all
          }, [])
          const blockHeaders = blockBlockchainHeaders.map((a) => {
            return a.getHash()
          })
          if (!equals(childHeaders, blockHeaders)) {
            all = true
          }
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
    this._logger.info('Block hasParent: ' + hasParent + ' hasChild: ' + hasChild + ' syncing: ' + syncing + ' height: ' + height + ' inMultiverseLayer: ' + inMultiverseLayer)
    if (hasParent === true || hasChild === true) {
      if (inMultiverseLayer === false) {
        if (self._blocks[height] === undefined) {
          self._blocks[height] = []
        }
        if (self._blocks[height][0] !== undefined && self._blocks[height][0].getHash() === block.getPreviousHash()) {
          self._blocks[height].push(block)
        } else {
          self._blocks[height].push(block)
        }
        if (self._blocks[height].length > 1) {
          self._blocks[height] = self._blocks[height].sort((a, b) => {
            if (a.getDistance() < b.getDistance()) return 1
            if (a.getDistance() > b.getDistance()) return -1
            return 0
          })
        }
        return true
      } else {
        this._logger.warn('block ' + block.getHash() + ' already in multiverse')
      }
    } else if (force === true || syncing === true) {
      if (self._blocks[height] === undefined) {
        self._blocks[height] = []
      }
      self._blocks[height].push(block)
      if (self._blocks[height].length > 1) {
        self._blocks[height] = self._blocks[height].sort((a, b) => {
          if (a.getDistance() < b.getDistance()) return 1
          if (a.getDistance() > b.getDistance()) return -1
          return 0
        })
      }
      added = true
      return added
    }
    return added
  }

  purge () {
    this._blocks = {}
    this._writeQueue = []
    this._logger.info('metaverse has been purged')
  }

  caseBetterMultiverse (block: BcBlock): ?BcBlock {
    const currentHighestBlock = this.getHighestBlock()
    this._logger.info(currentHighestBlock)
    // TODO: Stub function for the comparison of two multiverse structures
  }

  getHighestBlock (depth: ?number = 7, keys: string[] = [], list: ?Array<*>): ?BcBlock {
    /*
     *
     *           --X|---
     *           ---|-X-
     *           X--|---
     *
     *    dim([t,d]) . max(t+d*n)
     *
     */
    if (keys.length === 0) {
      keys = Object.keys(this._blocks)
      list = []
    }
    if (Object.keys(this._blocks).length === 0) {
      this._logger.warn('unable to determine height from incomplete multiverse')
      return false
    }
    const currentHeight = keys.pop()
    const currentRow = this._blocks[currentHeight]
    let matches = []
    currentRow.map((candidate) => { // [option1, option2, option3]
      matches = list.reduce((all, chain) => {
        if (chain !== undefined && chain[0] !== undefined) {
          if (chain[0].getPreviousHash() === candidate.getHash()) {
            all++
            chain.unshift(candidate)
          }
        }
        return all
      }, 0)
      if (matches === 0) { // this must be it's own chain
        list.push([candidate])
      }
    })
    // Cycle through keys
    if (keys.length > 0) {
      return this.getHighestBlock(depth, keys, list)
    }
    const minimumDepthChains = list.reduce((all, chain) => {
      if (chain.length >= depth && validateBlockSequence(chain) === true) {
        all.push(chain)
      }
      return all
    }, [])
    if (minimumDepthChains === undefined) {
      // Any new block is the highest
      return true
    } else if (minimumDepthChains !== undefined && minimumDepthChains.length === 0) {
      const performance = list.reduce((order, chain) => {
        const totalDistance = sum(chain.map((b) => {
          return b.getDistance()
        }))
        if (order.length === 0) {
          order.push([chain, totalDistance])
        } else if (order.length > 0 && order[0] !== undefined && order[0][1] < totalDistance) {
          order.unshift([chain, totalDistance])
        }
        return order
      }, [])
      const results = performance.sort((a, b) => {
        if (a[1] > b[1]) {
          return 1
        }
        if (a[1] < b[1]) {
          return -1
        }
        return 0
      }).reverse()
      return results[0][0].pop()
    } else if (minimumDepthChains !== undefined && minimumDepthChains.length === 1) {
      return minimumDepthChains[0][0]
    } else {
      const performance = minimumDepthChains.reduce((order, chain) => {
        const distances = chain.map((b) => {
          return b.getDistance()
        })
        const totalDistance = sum(distances)
        if (order.length === 0) {
          order.push([chain, totalDistance])
        } else if (order.length > 0 && order[0] !== undefined && order[0][1] < totalDistance) {
          order.unshift([chain, totalDistance])
        }
        return order
      }, [])
      const results = performance.sort((a, b) => {
        if (a[1] < b[1]) {
          return 1
        }
        if (a[1] > b[1]) {
          return -1
        }
        return 0
      }).reverse()
      return results[0][0].pop()
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

  print () {
    this._logger.info(this._blocks)
  }
}

export default Multiverse
