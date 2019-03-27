/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type Rocksdb from '../persistence/rocksdb'
import type Logger from 'winston'
import BN from 'bn.js'
import { all, identity } from 'ramda'

import { getLogger } from '../logger'
import { Transaction } from '../protos/core_pb'
import Interpreter from '../script/index'
import { COINBASE_MATURITY, ScriptTemplates, getScriptStrFromBuffer } from '../core/txUtils'

export class TxHandler {
  _logger: Logger
  _persistence: Rocksdb
  _interpreter: Interpreter

  constructor (persistence: Rocksdb) {
    this._logger = getLogger(__filename)
    this._persistence = persistence
    this._interpreter = new Interpreter(this._persistence)
  }

  /**
   * @return true if all of conditions from:
   * https://en.bitcoin.it/wiki/Protocol_rules#.22tx.22_messages
   * are true
   */
  async isValidTx (tx: Transaction, txIndex?: number, txBlockHeight?: number, latestBlockHeight?: number): Promise<bool> {
    // Check syntactic correctness
    // mind that first step done already by deserializing from protobuf

    const blockchain = (tx.getId) ? tx.getId() : 'bc'
    const hash = tx.getHash()
    // Reject if we already have matching tx in the pool, or in a block in the main branch
    try {
      const existingTx = await this._persistence.get(`${blockchain}.tx.${hash}`)
      if (existingTx) {
        this._logger.info(`Tx ${hash} already exists`)
        return false
      }
    } catch (err) {
      // TX does not exist -> continue
    }

    // Make sure neither in or out lists are empty (in is empty only in case of coinbase TX)
    const inputs = tx.getInputsList()
    if (tx.getNinCount() !== inputs.length || (txIndex !== undefined && (inputs.length === 0 && txIndex !== 0))) { // coinbase has 0 inputs
      this._logger.info(`TX ${hash} invalid - ninCount didn't match actual input count or zero inputs, inputs.length: ${inputs.length}`)
      return false
    }

    const outputs = tx.getOutputsList()
    if (tx.getNoutCount() !== outputs.length || outputs.length === 0) {
      this._logger.info(`TX ${hash} invalid - noutCount didn't match actual output count or zero outputs, outputs.length: ${outputs.length}`)
      return false
    }

    // TODO Each output value, as well as the total, must be in legal money range
    // TODO Make sure none of the inputs have hash=0, n=-1 (coinbase transactions)
    // TODO Check that nLockTime <= INT_MAX[1], size in bytes >= 100[2], and sig opcount <= 2[3]
    // TODO For each input, if the referenced output transaction is coinbase (i.e. only 1 input, with hash=0, n=-1), it must have at least COINBASE_MATURITY (100) confirmations; else reject this transaction
    // TODO Using the referenced output transactions to get input values, check that each input value, as well as the sum, are in legal money range
    // TODO Reject if transaction fee (defined as sum of input values minus sum of output values) would be too low to get into an empty block

    for (let input of inputs) {
      if (input.getScriptLength() !== input.getInputScript().length) {
        return false
      }

      // Reject "nonstandard" transactions: scriptSig doing anything other than pushing numbers on the stack, or scriptPubkey not matching the two usual forms[4]
      const inputScript = getScriptStrFromBuffer(input.getInputScript())
      if (!ScriptTemplates.validateScript(inputScript)) {
        this._logger.warn(`invalid script format, script: ${inputScript}`)

        return false
      }

      // For each input, if the referenced output exists in any other tx in the pool, reject this transaction.[5]
      // For each input, if the referenced output does not exist (e.g. never existed or has already been spent), reject this transaction[6]
      const outpoint = input.getOutPoint()
      const outputsKey = `${blockchain}.op.${outpoint.getHash()}.${outpoint.getIndex()}`
      // there is a reference to this outpoint and is non-empty => is spent
      let spenderTxHash
      try {
        spenderTxHash = await this._persistence.get(outputsKey)
        if (spenderTxHash && spenderTxHash !== tx.getHash()) {
          return false
        }
      } catch (_) { // eslint-disable-line no-empty
      }

      // For each input, look in the main branch and the transaction pool to find the referenced output transaction.
      // If the output transaction is missing for any input, this will be an orphan transaction.
      // Add to the orphan transactions, if a matching transaction is not in there already.
      // TODO here should balances list from genesis come into play (generate "initial" output if spending from genesis balance)
      // OPTIMIZE this could be wrapped by UTXO class
      const referencedOutput = await this._persistence.getOutputForInput(outpoint.getHash(), outpoint.getIndex())
      if (!referencedOutput) {
        return false
      }

      if (txBlockHeight !== undefined && latestBlockHeight !== undefined) {
        let referencedTx
        let referencedIsCoinbase = false
        try {
          referencedTx = await this._persistence.get(`${blockchain}.tx.${outpoint.getHash()}`)
          if (!referencedTx) {
            return false
          }
          referencedIsCoinbase = referencedTx.getInputsList().length === 0

          // if input is referencing output from coinbase tx, it has to have COINBASE_MATURITY
          if (referencedIsCoinbase && txBlockHeight + COINBASE_MATURITY < latestBlockHeight) {
            return false
          }
        } catch (err) {
          return false
        }
      }

      // Verify the scriptPubKey accepts for each input; reject if any are bad
      let result
      try {
        result = await this._interpreter.evaluateAsync(
          getScriptStrFromBuffer(referencedOutput.getOutputScript()),
          getScriptStrFromBuffer(input.getInputScript()),
          input,
          tx
        )
        if (!result) {
          this._logger.info(`script did not validate, result: ${result}`)
          return false
        }
      } catch (error) {
        this._logger.info(`script did not validate`, error.toString())
        return false
      }

      if (new BN(outpoint.getValue()).neq(new BN(referencedOutput.getValue()))) {
        return false
      }
    }

    for (let output of outputs) {
      const value = new BN(output.getValue())
      if (value.lte(new BN(0))) {
        return false
      }
    }

    return true
  }

  /**
   * Returns true if all TXs valid or array of invalid TX hashes
   *
   * @param possibleTxs {Transaction[]} array of transactions with first assuming to be a coinbase
   */
  async validateTxs (possibleTxs: Transaction[], txBlockHeight: number, latestBlockHeight: number): Promise<true|string[]> {
    return Promise.all(possibleTxs.map((tx, i) => this.isValidTx(tx, i, txBlockHeight, latestBlockHeight))).then(results => {
      if (all(identity, results)) {
        return true
      }

      const invalidTxHashes = []

      for (let i = 0; i < results.length - 1; i++) {
        if (!results[i]) {
          invalidTxHashes.push(possibleTxs[i].getHash())
        }
      }

      return invalidTxHashes
    })
  }
}
