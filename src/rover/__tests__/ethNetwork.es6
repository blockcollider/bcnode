/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { RoverMessage } = require('../../protos/rover_pb')
const { Block } = require('../../protos/core_pb')
const { default: Network } = require('../eth/network')

describe('eth network module', () => {
  describe('resync intervals', () => {
    it('creates intervals if none provided by resync message', () => {
      const network = new Network({ maximumPeers: 1 })
      const resyncMsg = new RoverMessage.Resync()
      resyncMsg.setIntervalsList([])
      network.resyncData = resyncMsg

      // $FlowFixMe
      network.requestBlockRange = jest.fn()
      network.scheduleInitialSync(1000)

      expect(network.requestBlockRange).toBeCalledWith([1000, 873])
      expect(network._initialSyncBlocksToFetch[0]).toEqual([872, 745])
      expect(network._initialSyncBlocksToFetch[network._initialSyncBlocksToFetch.length - 1]).toEqual([104, 0])
    })

    it('just add intervals if smaller than 128', () => {
      const network = new Network({ maximumPeers: 1 })
      const resyncMsg = new RoverMessage.Resync()
      resyncMsg.setIntervalsList([
        new RoverMessage.Resync.Interval([100, 200]), // should be split to three intervals
        new RoverMessage.Resync.Interval([500, 600])
      ])

      const latestStoredBlock = new Block()
      latestStoredBlock.setHeight(1000)
      resyncMsg.setLatestBlock(latestStoredBlock)
      network.resyncData = resyncMsg

      // $FlowFixMe
      network.requestBlockRange = jest.fn()
      network.scheduleInitialSync(1100)

      expect(network.requestBlockRange).toBeCalledWith([1100, 1000])
      expect(network._initialSyncBlocksToFetch).toEqual([
        [600, 500],
        [200, 100]
      ])
    })

    it('normalizes intervals to max 128', () => {
      const network = new Network({ maximumPeers: 1 })
      const resyncMsg = new RoverMessage.Resync()
      resyncMsg.setIntervalsList([
        new RoverMessage.Resync.Interval([100, 370]), // should be split to three intervals
        new RoverMessage.Resync.Interval([500, 600])
      ])

      const latestStoredBlock = new Block()
      latestStoredBlock.setHeight(1000)
      resyncMsg.setLatestBlock(latestStoredBlock)
      network.resyncData = resyncMsg

      // $FlowFixMe
      network.requestBlockRange = jest.fn()
      network.scheduleInitialSync(1100)

      expect(network.requestBlockRange).toBeCalledWith([1100, 1000])
      expect(network._initialSyncBlocksToFetch).toEqual([
        [600, 500],
        [370, 357],
        [356, 229],
        [228, 100]
      ])
    })

    it('normalizes latest block interval to max 128', () => {
      const network = new Network({ maximumPeers: 1 })
      const resyncMsg = new RoverMessage.Resync()
      resyncMsg.setIntervalsList([
        new RoverMessage.Resync.Interval([500, 600])
      ])

      const latestStoredBlock = new Block()
      latestStoredBlock.setHeight(828)
      resyncMsg.setLatestBlock(latestStoredBlock)
      network.resyncData = resyncMsg

      // $FlowFixMe
      network.requestBlockRange = jest.fn()
      network.scheduleInitialSync(1100)

      // latest interval will be split to 3, this is first of them
      expect(network.requestBlockRange).toBeCalledWith([1100, 1085])
      expect(network._initialSyncBlocksToFetch).toEqual([
        [1084, 957],
        [956, 828],
        [600, 500]
      ])
    })
  })
})

