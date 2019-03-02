/*
 * Copyright (c) 2017-present, Block Collider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { MiningOfficer } = require('../officer')

const { Block } = require('../../protos/core_pb')
const PersistenceRocksDb = require('../../persistence/rocksdb').default
const { PubSub } = require('../../engine/pubsub')
const { getGenesisBlock } = require('../../bc/genesis')
const { fork } = require('child_process')
const { isValidBlock } = require('../../bc/validation')

jest.mock('../../engine/pubsub')
jest.mock('../../persistence/rocksdb')
// jest.mock('child_process')
jest.mock('../../bc/validation')

describe.skip(MiningOfficer, () => {
  let poolMock
  beforeEach(() => {
    // $FlowFixMe - flow is unable to properly type mocked module
    PersistenceRocksDb.mockClear()
    // $FlowFixMe - flow is unable to properly type mocked module
    PubSub.mockClear()
    poolMock = { updateWorkers: jest.fn(), emitter: { emit: jest.fn() } }
  })

  it('runs miner when all blocks collected', async () => {
    const roveredBlock = new Block(['btc', 'bbb', 'aaa', 1234, 1001, 'ccc'])
    const persistence = new PersistenceRocksDb()
    persistence.get.mockResolvedValueOnce(roveredBlock) // btc.block.latest
    persistence.get.mockResolvedValueOnce(getGenesisBlock()) // bc.block.latest
    const pubsub = new PubSub()

    const mockPid = 9887
    const mockChildProcess = { on: jest.fn(), send: jest.fn(), pid: mockPid }
    fork.mockReturnValue(mockChildProcess)
    const officer = new MiningOfficer(pubsub, persistence, poolMock, { minerKey: 'a', rovers: ['btc'] })
    const result = await officer.newRoveredBlock(['btc'], roveredBlock)

    expect(result).toBe(mockPid)
    expect(mockChildProcess.on).toHaveBeenCalledTimes(3)
    expect(mockChildProcess.send).toHaveBeenCalledTimes(1)

    // mock calling successful worker response
    // $FlowFixMe - flow is unable to properly type mocked module
    isValidBlock.mockReturnValue(true)
    const mockSolution = { workId: 'aaaWorkIdaaa', distance: '1024', nonce: '0.001', difficulty: '2048', timestamp: 1529909470, iterations: 128, timeDiff: 550 }
    officer._handleWorkerFinishedMessage(mockSolution)
    const [topic, minerResult] = pubsub.publish.mock.calls[0]
    expect(topic).toBe('miner.block.new')
    expect(minerResult.solution).toEqual(mockSolution)
    expect(minerResult.unfinishedBlock.getNonce()).toBe('0.001')
    expect(minerResult.unfinishedBlock.getDistance()).toBe('1024')
    // expect(minerResult.unfinishedBlock.getTotalDistance()).toBe('1025') // solution.difficulty + 1 from genesis block
    expect(minerResult.unfinishedBlock.getTimestamp()).toBe(1529909470)
    expect(minerResult.unfinishedBlock.getDifficulty()).toBe('301284002297523')
  })

  it('does not run if not enough blocks from each blockchain', async () => {
    const minedBlock = new Block(['btc', 'bbb', 'aaa', 1234, 1001, 'ccc'])
    const persistence = new PersistenceRocksDb()
    persistence.get.mockResolvedValueOnce(minedBlock) // btc.block.latest
    persistence.get.mockResolvedValueOnce(getGenesisBlock()) // bc.block.latest

    const mockPid = 9887
    const mockChildProcess = { on: jest.fn(), send: jest.fn(), pid: mockPid }
    fork.mockReturnValue(mockChildProcess)
    const officer = new MiningOfficer(new PubSub(), persistence, poolMock, { minerKey: 'a', rovers: ['btc', 'eth'] })
    const result = await officer.newRoveredBlock(['btc', 'eth'], minedBlock)

    expect(result).toBe(false)
    expect(mockChildProcess.on).not.toHaveBeenCalled()
    expect(mockChildProcess.send).not.toHaveBeenCalled()
    expect(officer._collectedBlocks).toEqual({ btc: 1, eth: 0 })
  })
})
