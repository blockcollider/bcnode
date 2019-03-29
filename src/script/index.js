/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
// const { Block, BcBlock, Transaction, TransactionOutput, TransactionInput } = require()
import type { TransactionInput, Transaction } from '../protos/core_pb'
import type RocksDb from '../persistence/rocksdb'

var { parser } = require('./script')
var Validator = require('./validator')
var BeamToJson = require('./beamtojson')
var BN = require('bn.js')
var { ScriptTemplates, generateDataToSignForSig } = require('../core/txUtils')
const { blake2bl } = require('../utils/crypto')
var { UnsettledTxManager } = require('../bc/unsettledTxManager')
var TxPendingPool = require('../bc/txPendingPool')
var debug = require('debug')('bcnode:script:interpreter')
var LRUCache = require('lru-cache')

class Interpreter {
  persistence: RocksDb
  txManager: UnsettledTxManager
  cache: LRUCache<string, Transaction>

  constructor (persistence: RocksDb) {
    this.persistence = persistence
    this.txManager = new UnsettledTxManager(persistence)
    this.cache = LRUCache({
      max: 2000
    })
  }
  /* get relevant marked operations from the cache
   * @param {string} script
   * @param {BcBlock} bc block
   * @return {Array} list of marked transactions
   */
  async getScriptMarkedTxs (script: string, env: Object): Promise<Transaction[]> {
    var markedOperations = Validator.includesMarkedOpcode(script)
    // if there are no marked operations return an empty array
    if (markedOperations.length === 0) {
      return Promise.resolve(markedOperations)
    } else if (script.indexOf('OP_MARK') > -1) {
      var mark = BeamToJson.toJSON('OP_MARK', script)
    } else if (script.indexOf('OP_MAKERCOLL') > -1) {
      //  promises
      //  marked
      if (ScriptTemplates.validateScript(script)) {
        var depset = BeamToJson.toJSON('OP_DEPSET', script)
        var makerColl = BeamToJson.toJSON('OP_MAKERCOLL', script)
        var currentHeight = env.LATEST_BLOCK.getHeight()
        var startBlock = env.CALLBACK_TX_BLOCK !== false ? env.CALLBACK_TX_BLOCK : env.OUTPOINT_TX_BLOCK
        var callbackHash = env.CALLBACK_HASH !== false ? env.CALLBACK_HASH : env.OUTPOINT_HASH
        var callbackIndex = env.CALLBACK_INDEX !== false ? env.CALLBACK_INDEX : env.OUTPOINT_INDEX
        var startBlockHeight = new BN(startBlock.getHeight()).add(new BN(depset.shift))
        var settlementBlockHeight = new BN(startBlock.getHeight()).add(new BN(depset.shift)).add(new BN(depset.settlementHeight))

        // parsed from BeamToJSON
        var payment = makerColl.payment
        var amount = makerColl.amount
        var toMakerAddress = makerColl.toMakerAddress
        var fromChain = makerColl.fromChain // TODO assert addresses are valid for given chain
        var toChain = makerColl.toChain
        var fromTakerAddress = makerColl.fromTakerAddress
        var toTakerAddress = makerColl.toTakerAddress

        // if current height less than settlement height only get blocks up to the current height
        var maximumHeight = new BN(currentHeight).gt(settlementBlockHeight) ? settlementBlockHeight : currentHeight
        var blocks = await this.persistence.getBlocksByRangeCached(startBlockHeight, maximumHeight)

        // assign taker -> maker binding marked transaction
        await this.txManager.setMarkedWatch(callbackHash, callbackIndex, fromChain.toLowerCase(), settlementBlockHeight, toMakerAddress, fromTakerAddress)
        // assign N -> taker binding marked transaction
        await this.txManager.setMarkedWatch(callbackHash, callbackIndex, fromChain.toLowerCase(), settlementBlockHeight, toTakerAddress)

        if (blocks.length < 1) {
          return Promise.resolve([])
        }

        var blockCap = blocks.slice(blocks.length - 1, blocks.length)
        if (new BN(blockCap.getHeight()).lt(currentHeight)) {
          blocks.push(env.LATEST_BLOCK)
        }

        var markedTxs = blocks.reduce((all, b) => {
          var toChainMethod = `get${toChain[0].toUpperCase()}${toChain.slice(1)}`
          var fromChainMethod = `get${fromChain[0].toUpperCase()}${fromChain.slice(1)}`
          var headers = b.getBlockchainHeaders()

          var toChainMarkedTxs = headers[toChainMethod]().reduce((a, mts) => {
            mts.getMarkedTxsList().map((marked) => {
              if (marked.getAddrFrom() === toMakerAddress || marked.getAddrTo() === toMakerAddress) {
                a.push(marked)
              } else if (marked.getAddrFrom() === toTakerAddress || marked.getAddrTo() === toTakerAddress) {
                a.push(marked)
              } else if (marked.getAddrFrom() === fromTakerAddress || marked.getAddrTo() === fromTakerAddress) {
                a.push(marked)
              }
            })
            return a
          }, [])

          var fromChainMarkedTxs = headers[fromChainMethod]().reduce((a, mts) => {
            mts.getMarkedTxsList().map((marked) => {
              if (marked.getAddrFrom() === toMakerAddress || marked.getAddrTo() === toMakerAddress) {
                a.push(marked)
              } else if (marked.getAddrFrom() === toTakerAddress || marked.getAddrTo() === toTakerAddress) {
                a.push(marked)
              } else if (marked.getAddrFrom() === fromTakerAddress || marked.getAddrTo() === fromTakerAddress) {
                a.push(marked)
              }
            })
            return a
          }, [])

          all = all.concat(toChainMarkedTxs)
          all = all.concat(fromChainMarkedTxs)

          return all
        }, [])

        return Promise.resolve(markedTxs)
      }
    }
  }

  /* env object delvered
   * {
   *   SCRIPT
   *   LATEST_BLOCK
   *   OUTPOINT_OWNER
   *   OUTPOINT_HASH
   *   OUTPOINT_INDEX
   *   OUTPOINT_TX
   *   OUTPOINT_TX_BLOCK
   *   CALLBACK_HASH
   *   CALLBACK_INDEX
   *   CALLBACK_TX
   *   CALLBACK_TX_BLOCK
   *   CALLBACK_LOCAL_OUTPUTS
   *   INPUT_TX_BLOCK
   *   INPUT_TX --------- transaction containing the provided input
   * }
   * @param outputScript string script to to be unlocked
   * @param inputScript string script to unlock outputScript
   * @return Object
   */
  async getScriptEnv (outputScript: string, inputScript: string, input: TransactionInput, tx: Transaction) {
    try {
      var env = {
        SCRIPT: inputScript + ' ' + outputScript,
        LATEST_BLOCK: false,
        OUTPOINT_OWNER: false,
        OUTPOINT_HASH: false,
        OUTPOINT_INDEX: 0,
        OUTPOINT_TX: false,
        OUTPOINT_TX_BLOCK: false,
        CALLBACK_TX: false,
        CALLBACK_TX_BLOCK: false,
        CALLBACK_LOCAL_OUTPUTS: false,
        INPUT_TX: false,
        INPUT_TX_BLOCK: false,
        MARKED_TXS: [],
        /*
         * Address space human readable 'X' change for the hex equivalent
         *
         *  0: FIX Protocol
         *  1: MSC2010 + Vanity Addresses
         *  2: XMLRPC Protocol
         *  3: Super Collider + Enterprise
         *  4: RESERVED
         *  5: RESERVED
         *  6: Urbit Transport + Voting
         *  7: GEO Coordinates
         *  8: NA
         *  9: Emergency Services
         *  10: NA
         */
        X: {
          '0': {},
          '1': require('./data/x1.json'),
          '2': {},
          '3': {},
          '4': {},
          '5': {},
          '6': {},
          '7': {},
          '9': {}
        }
      }

      var outPointTxHash = input.getOutPoint().getHash()
      var outPointIndex = input.getOutPoint().getIndex()
      var blockchain = 'bc'

      env.OUTPOINT_INDEX = outPointIndex

      if (tx.getBlockchain !== undefined) {
        blockchain = tx.getBlockchain()
      }
      if (outPointTxHash === undefined || outPointTxHash.length < 64) {
        return Promise.resolve(false)
      }
      env.OUTPOINT_HASH = outPointTxHash

      // as this changes frequently always get the latest block
      env.LATEST_BLOCK = await this.persistence.get(`${blockchain}.block.latest`)
      env.INPUT_TX = tx

      // check it has a callback and make the necessary changes
      if (Validator.includesCallbackOpcode(outputScript) === true && (env.SCRIPT.indexOf('OP_MONOID') < 0) === true) {
        // this is to spend taker's output script
        var callbackString = outputScript.slice(0, outputScript.indexOf('OP_CALLBACK') - 1)
        var callbackTxHash = callbackString.split(' ')[0]
        var callbackTxIndex = callbackString.split(' ')[1]
        var remainingScript = outputScript.slice(outputScript.indexOf('OP_CALLBACK') + 'OP_CALLBACK'.length + 1, outputScript.length)

        env.CALLBACK_HASH = callbackTxHash
        env.CALLBACK_INDEX = callbackTxIndex

        if (this.cache.has(blockchain + callbackTxHash)) {
          env.CALLBACK_TX = this.cache.get(blockchain + callbackTxHash)
        } else {
          debug('---> attempted to load hash: ' + callbackTxHash)
          env.CALLBACK_TX = await this.persistence.getTransactionByHash(callbackTxHash, blockchain)
        }
        if (env.CALLBACK_TX !== null && env.CALLBACK_TX !== false) {
          this.cache.set(blockchain + callbackTxHash, env.CALLBACK_TX)
          const callbackOutput = env.CALLBACK_TX.getOutputsList()[callbackTxIndex]
          const callbackScript = callbackOutput.getOutputScript().toString('ascii')
          if (callbackScript.indexOf('OP_MONOID') === 0) {
            // !!! all successful callback scripts should end up at this update
            // callbackScript is maker tx's output script
            outputScript = callbackScript.replace('OP_MONOID', '') + ' ' + remainingScript
            // return the callback string
            env.SCRIPT = inputScript + ' ' + callbackString + ' OP_CALLBACK ' + outputScript
            env.SCRIPT = env.SCRIPT.replace(/  +/g, ' ')
            debug('2%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%')
            debug(env.SCRIPT)
          } else {
            return Promise.reject(new Error('callback referenced script does not contain monadic property'))
          }
        } else {
          return Promise.reject(new Error('unable to recover script referenced callback'))
        }
      } else if (Validator.includesCallbackOpcode(outputScript)) {
        return Promise.reject(new Error('script contains monoid and callback'))
      }

      if (this.cache.has(blockchain + outPointTxHash)) {
        env.OUTPOINT_TX = this.cache.get(blockchain + outPointTxHash)
      } else {
        env.OUTPOINT_TX = await this.persistence.getTransactionByHash(outPointTxHash, blockchain)
      }

      if (env.OUTPOINT_TX !== null && env.OUTPOINT_TX !== false) {
        this.cache.set(blockchain + outPointTxHash, env.OUTPOINT_TX)
      } else {
        return Promise.reject(new Error('unable to load tx of outpoint'))
      }

      // Assert monoid isomorphism
      if (env.SCRIPT.indexOf('OP_MONOID') > -1) {
        const inputs = env.INPUT_TX.getTransactionInputsList()
        const readTxs = {}
        // scan through inputs and check for OP_MONOID the script of their outpoint
        const monoidIso = inputs.reduce(async (all, input) => {
          const op = input.getOutPoint()
          if (all.readTxs[op.getHash()] === undefined) {
            all.readTxs[op.getHash()] = input
            const optx = await this.persistence.getTransactionByHash(op.getHash(), 'bc')
            if (optx === null || optx === false) {
              // if the transaction referenced does not exist fail
              all.forceFail = true
            } else {
              const refop = optx.getOutputsList()[op.getIndex()]
              const s = refop.getOutputScript().toString('ascii')
              if (s.indexOf('OP_MONOID') > -1) {
                all.spendMonoidInputs.push(input)
              }
            }
          }
          return all
        }, {
          forceFail: false,
          spendMonoidInputs: [],
          readTxs: []
        })

        if (monoidIso.forceFail) {
          return Promise.reject(new Error('force failed isomorphism -> unable to load outpoint script from disk'))
        } else if (monoidIso.spendMonoidInputs.length > 1) {
          return Promise.reject(new Error('failed isomorphism assertion -> multiple monoids in inputs'))
        } else if (monoidIso.spendMonoidInputs.length === 0) {
          return Promise.reject(new Error('failed isomorphism assertion -> monoid not found in outpoints'))
        }
      }

      // determine the key of the block in reference
      var outPointTxBlockKey = `${blockchain}.txblock.${outPointTxHash}`
      var outPointBlockKey
      if (this.cache.has(outPointTxBlockKey)) {
        outPointBlockKey = this.cache.get(outPointTxBlockKey)
      } else {
        outPointBlockKey = await this.persistence.get(outPointTxBlockKey)
      }

      if (outPointBlockKey !== null && outPointBlockKey !== false) {
        this.cache.set(outPointTxBlockKey, outPointBlockKey)

        // load the complete outpoint block
        var outPointBlockHash = outPointBlockKey.split('.block.')[1]
        var outPointBlockchain = outPointBlockKey.split('.block.')[0]
        if (outPointBlockHash === env.LATEST_BLOCK.getHash()) {
          env.OUTPOINT_TX_BLOCK = env.LATEST_BLOCK
        } else {
          if (this.cache.has(outPointBlockKey)) {
            env.OUTPOINT_TX_BLOCK = this.cache.get(outPointBlockKey)
          } else {
            env.OUTPOINT_TX_BLOCK = await this.persistence.getBlockByHash(outPointBlockHash, outPointBlockchain)
            this.cache.set(outPointBlockKey, env.OUTPOINT_TX_BLOCK)
          }
        }
      } else {
        return Promise.reject(new Error('unable to load referenced block containing tx of outpoint'))
      }

      // !!! IMPORTANT !!!
      // the input tx block will not be available if the block in question is the latest block
      var inputTxBlockKey = `${blockchain}.txblock.${tx.getHash()}`
      var inputBlockKey
      if (this.cache.has(inputTxBlockKey)) {
        inputBlockKey = this.cache.get(inputTxBlockKey)
      } else {
        inputBlockKey = await this.persistence.get(inputTxBlockKey)
      }

      // confirm an input tx block key reference was found
      if (inputBlockKey !== null && inputBlockKey !== false) {
        this.cache.set(inputTxBlockKey, inputBlockKey)
        // load the complete input block
        var inputBlockHash = inputBlockKey.split('.block.')[1]
        var inputBlockchain = inputBlockKey.split('.block.')[0]
        if (this.cache.has(inputBlockKey)) {
          env.INPUT_TX_BLOCK = this.cache.get(inputBlockKey)
        } else {
          env.INPUT_TX_BLOCK = await this.persistence.getBlockByHash(inputBlockHash, inputBlockchain)
          this.cache.set(inputBlockKey, env.INPUT_TX_BLOCK)
        }
      } else {
        // this may be because the transaction has not been mined into a block
        env.INPUT_TX_BLOCK = false
      }
      // !!! IMPORTANT !!!
      // determine if the outpoint has an owner on the main branch
      // the outpointClaimKey may change from the adoption of a new branch so it must be loaded each time
      // this must never by cached
      let claim
      const outPointClaimKey = TxPendingPool.getOutpointClaimKey(outPointTxHash, outPointIndex, blockchain)
      claim = await this.persistence.get(outPointClaimKey, { asBuffer: true, softFail: true })
      if (claim !== null && claim !== false && claim !== true) {
        env.OUTPOINT_OWNER = claim // useful in the event callback is needed
      }
      // loads the entire tx in question for the output
      if (this.cache.has(outPointTxHash)) {
        env.OUTPOINT_TX = this.cache.get(outPointTxHash)
      } else {
        const outPointTx = await this.persistence.getTransactionByHash(outPointTxHash, blockchain)
        this.cache.set(outPointTxHash, outPointTx)
        env.OUTPOINT_TX = outPointTx
      }
      // !!! IMPORTANT !!!
      // When creating scripting environment marked transactions must be calculated last
      env.MARKED_TXS = await this.getScriptMarkedTxs(env.SCRIPT, env)
      return Promise.resolve(env)
    } catch (err) {
      debug(err)
      return Promise.resolve(false)
    }
  }

  /**
   * loads environment asynchronously before parsing script
   * @param script string Script to evaluate
   * @param input TranactionInput
   * @param tx Transaction|MarkedTransaction
   * @returns Promise<Object>
   */
  // const res = await interpreter.parseAsync(
  //   parentOutputScript, childInputScript, childInput, childTx, false)
  async parseAsync (outputScript: string, inputScript: string, input: TransactionInput, tx: Transaction, allowDisabled?: boolean) {
    var script = inputScript + ' ' + outputScript
    if (!allowDisabled && Validator.includesDisabledOpcode(script)) {
      throw new Validator.DisabledOpcodeException(script)
    }
    const dataToSign = generateDataToSignForSig(input.getOutPoint(), tx)

    // if no async op codes are includes, return sync parse
    if (!Validator.includesAsyncOpcode(script)) {
      return Promise.resolve(this.parse(dataToSign, script, allowDisabled))
    }

    try {
      // get context of the transaction
      parser.yy.env = await this.getScriptEnv(outputScript, inputScript, input, tx)
      script = parser.yy.env.SCRIPT
      return Promise.resolve(this.parse(dataToSign, script))
    } catch (e) {
      debug(e)
      return Promise.resolve({
        code: null,
        value: false,
        error: e
      })
    }
  }

  parse (dataToSign: string, wholeScript: string, allowDisabled?: boolean): { value: boolean, code: string, error?: Error } {
    if (!allowDisabled && Validator.includesDisabledOpcode(wholeScript)) {
      throw new Validator.DisabledOpcodeException(wholeScript)
    }

    const scriptWithDataToSignHash = blake2bl(dataToSign) + ' ' + wholeScript
    try {
      const res = parser.parse(scriptWithDataToSignHash)
      debug(res)
      return res
    } catch (e) {
      return {
        code: null,
        value: false,
        error: e
      }
    }
  }

  evaluate (dataToSign: string, wholeScript: string, allowDisabled?: boolean = false): boolean {
    const res = this.parse(dataToSign, wholeScript, allowDisabled)
    debug(res.value)
    debug(res.code)
    debug(res.error)
    return res.value
  }

  /**
   * returns a boolean after evaluating the provided script
   * @param script string Script to evaluate
   * @param input string TranactionInput
   * @param tx Transaction|MarkedTransaction
   * @returns Promise<boolean>
   */
  async evaluateAsync (outputScript: string, inputScript: string, input: TransactionInput, tx: Transaction, allowDisabled?: boolean): Promise<boolean> {
    try {
      const res = await this.parseAsync(outputScript, inputScript, input, tx, allowDisabled)
      return res.value
    } catch (e) {
      debug(e)
      return false
    }
  }

  unlock (outputLockScript: string, inputUnlockScript: string, dataToSign: string, allowDisabled?: boolean): boolean {
    return this.evaluate(dataToSign, inputUnlockScript + ' ' + outputLockScript, allowDisabled)
  }
}

module.exports = Interpreter
