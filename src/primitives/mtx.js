/*!
 * mtx.js - mutable transaction object for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const assert = require('assert');
const util = require('../utils/util');
const Script = require('../script/script');
const TX = require('./tx');
const Input = require('./input');
const Output = require('./output');
const Outpoint = require('./outpoint');
const encoding = require('../utils/encoding');
const consensus = require('../protocol/consensus');
const policy = require('../protocol/policy');
const Amount = require('../utils/amount');
const Stack = require('../script/stack');

/**
 * A mutable transaction object.
 * @alias module:primitives.MTX
 * @extends TX
 * @constructor
 * @param {Object} options
 * @param {Number?} options.version
 * @param {Number?} options.changeIndex
 * @param {Input[]?} options.inputs
 * @param {Output[]?} options.outputs
 * @property {Number} version - Transaction version.
 * @property {Number} flag - Flag field for segregated witness.
 * Always non-zero (1 if not present).
 * @property {Input[]} inputs
 * @property {Output[]} outputs
 * @property {Number} locktime - nLockTime
 * @property {CoinView} view
 */

function MTX(options) {
  if (!(this instanceof MTX))
    return new MTX(options);

  TX.call(this);

  this.mutable = true;
  this.changeIndex = -1;
  //this.view = new CoinView();

  if (options)
    this.fromOptions(options);
}

Object.setPrototypeOf(MTX.prototype, TX.prototype);

/**
 * Inject properties from options object.
 * @private
 * @param {Object} options
 */

MTX.prototype.fromOptions = function fromOptions(options) {
  if (options.version != null) {
    assert(util.isU32(options.version), 'Version must a be uint32.');
    this.version = options.version;
  }

  if (options.inputs) {
    assert(Array.isArray(options.inputs), 'Inputs must be an array.');
    for (const input of options.inputs)
      this.addInput(input);
  }

  if (options.outputs) {
    assert(Array.isArray(options.outputs), 'Outputs must be an array.');
    for (const output of options.outputs)
      this.addOutput(output);
  }

  if (options.locktime != null) {
    assert(util.isU32(options.locktime), 'Locktime must be a uint32.');
    this.locktime = options.locktime;
  }

  if (options.changeIndex != null) {
    if (options.changeIndex !== -1) {
      assert(util.isU32(options.changeIndex),
        'Change index must be a uint32.');
      this.changeIndex = options.changeIndex;
    } else {
      this.changeIndex = -1;
    }
  }

  return this;
};

/**
 * Instantiate MTX from options.
 * @param {Object} options
 * @returns {MTX}
 */

MTX.fromOptions = function fromOptions(options) {
  return new MTX().fromOptions(options);
};

/**
 * Clone the transaction. Note that
 * this will not carry over the view.
 * @returns {MTX}
 */

MTX.prototype.clone = function clone() {
  const mtx = new MTX();
  mtx.inject(this);
  mtx.changeIndex = this.changeIndex;
  return mtx;
};

/**
 * Add an input to the transaction.
 * @param {Input|Object} options
 * @returns {Input}
 *
 * @example
 * mtx.addInput({ prevout: { hash: ... }, script: ... });
 * mtx.addInput(new Input());
 */

MTX.prototype.addInput = function addInput(options) {
  const input = Input.fromOptions(options);
  this.inputs.push(input);
  return input;
};

/**
 * Add an outpoint as an input.
 * @param {Outpoint|Object} outpoint
 * @returns {Input}
 *
 * @example
 * mtx.addOutpoint({ hash: ..., index: 0 });
 * mtx.addOutpoint(new Outpoint(hash, index));
 */

MTX.prototype.addOutpoint = function addOutpoint(outpoint) {
  const prevout = Outpoint.fromOptions(outpoint);
  const input = Input.fromOutpoint(prevout);
  this.inputs.push(input);
  return input;
};

/**
 * Add a coin as an input. Note that this will
 * add the coin to the internal coin viewpoint.
 * @param {Coin} coin
 * @returns {Input}
 *
 * @example
 * mtx.addCoin(Coin.fromTX(tx, 0, -1));
 */

MTX.prototype.addCoin = function addCoin(coin) {
  assert(coin instanceof Coin, 'Cannot add non-coin.');

  const input = Input.fromCoin(coin);

  this.inputs.push(input);
  this.view.addCoin(coin);

  return input;
};

/**
 * Add a transaction as an input. Note that
 * this will add the coin to the internal
 * coin viewpoint.
 * @param {TX} tx
 * @param {Number} index
 * @param {Number?} height
 * @returns {Input}
 *
 * @example
 * mtx.addTX(tx, 0);
 */

MTX.prototype.addTX = function addTX(tx, index, height) {
  assert(tx instanceof TX, 'Cannot add non-transaction.');

  if (height == null)
    height = -1;

  const input = Input.fromTX(tx, index);

  this.inputs.push(input);

  this.view.addIndex(tx, index, height);

  return input;
};

/**
 * Add an output.
 * @param {Address|Script|Output|Object} script - Script or output options.
 * @param {Amount?} value
 * @returns {Output}
 *
 * @example
 * mtx.addOutput(new Output());
 * mtx.addOutput({ address: ..., value: 100000 });
 * mtx.addOutput(address, 100000);
 * mtx.addOutput(script, 100000);
 */

MTX.prototype.addOutput = function addOutput(script, value) {
  let output;

  if (value != null) {
    assert(util.isU64(value), 'Value must be a uint64.');
    output = Output.fromScript(script, value);
  } else {
    output = Output.fromOptions(script);
  }

  this.outputs.push(output);

  return output;
};

/**
 * Verify all transaction inputs.
 * @param {VerifyFlags} [flags=STANDARD_VERIFY_FLAGS]
 * @returns {Boolean} Whether the inputs are valid.
 * @throws {ScriptError} on invalid inputs
 */

MTX.prototype.check = function check(flags) {
  return TX.prototype.check.call(this, this.view, flags);
};

/**
 * Verify the transaction inputs on the worker pool
 * (if workers are enabled).
 * @param {VerifyFlags?} [flags=STANDARD_VERIFY_FLAGS]
 * @param {WorkerPool?} pool
 * @returns {Promise}
 */

MTX.prototype.checkAsync = function checkAsync(flags, pool) {
  return TX.prototype.checkAsync.call(this, this.view, flags, pool);
};

/**
 * Verify all transaction inputs.
 * @param {VerifyFlags} [flags=STANDARD_VERIFY_FLAGS]
 * @returns {Boolean} Whether the inputs are valid.
 */

MTX.prototype.verify = function verify(flags) {
  try {
    this.check(flags);
  } catch (e) {
    if (e.type === 'ScriptError')
      return false;
    throw e;
  }
  return true;
};

/**
 * Verify the transaction inputs on the worker pool
 * (if workers are enabled).
 * @param {VerifyFlags?} [flags=STANDARD_VERIFY_FLAGS]
 * @param {WorkerPool?} pool
 * @returns {Promise}
 */

MTX.prototype.verifyAsync = async function verifyAsync(flags, pool) {
  try {
    await this.checkAsync(flags, pool);
  } catch (e) {
    if (e.type === 'ScriptError')
      return false;
    throw e;
  }
  return true;
};

/**
 * Calculate the fee for the transaction.
 * @returns {Amount} fee (zero if not all coins are available).
 */

MTX.prototype.getFee = function getFee() {
  return TX.prototype.getFee.call(this, this.view);
};

/**
 * Calculate the total input value.
 * @returns {Amount} value
 */

MTX.prototype.getInputValue = function getInputValue() {
  return TX.prototype.getInputValue.call(this, this.view);
};

/**
 * Get all input addresses.
 * @returns {Address[]} addresses
 */

MTX.prototype.getInputAddresses = function getInputAddresses() {
  return TX.prototype.getInputAddresses.call(this, this.view);
};

/**
 * Get all addresses.
 * @returns {Address[]} addresses
 */

MTX.prototype.getAddresses = function getAddresses() {
  return TX.prototype.getAddresses.call(this, this.view);
};

/**
 * Get all input address hashes.
 * @returns {Hash[]} hashes
 */

MTX.prototype.getInputHashes = function getInputHashes(enc) {
  return TX.prototype.getInputHashes.call(this, this.view, enc);
};

/**
 * Get all address hashes.
 * @returns {Hash[]} hashes
 */

MTX.prototype.getHashes = function getHashes(enc) {
  return TX.prototype.getHashes.call(this, this.view, enc);
};

/**
 * Test whether the transaction has
 * all coins available/filled.
 * @returns {Boolean}
 */

MTX.prototype.hasCoins = function hasCoins() {
  return TX.prototype.hasCoins.call(this, this.view);
};

/**
 * Calculate virtual sigop count.
 * @param {VerifyFlags?} flags
 * @returns {Number} sigop count
 */

MTX.prototype.getSigops = function getSigops(flags) {
  return TX.prototype.getSigops.call(this, this.view, flags);
};

/**
 * Calculate sigops weight, taking into account witness programs.
 * @param {VerifyFlags?} flags
 * @returns {Number} sigop weight
 */

MTX.prototype.getSigopsCost = function getSigopsCost(flags) {
  return TX.prototype.getSigopsCost.call(this, this.view, flags);
};

/**
 * Calculate the virtual size of the transaction
 * (weighted against bytes per sigop cost).
 * @returns {Number} vsize
 */

MTX.prototype.getSigopsSize = function getSigopsSize() {
  return TX.prototype.getSigopsSize.call(this, this.getSigopsCost());
};

/**
 * Perform contextual checks to verify input, output,
 * and fee values, as well as coinbase spend maturity
 * (coinbases can only be spent 100 blocks or more
 * after they're created). Note that this function is
 * consensus critical.
 * @param {Number} height - Height at which the
 * transaction is being spent. In the mempool this is
 * the chain height plus one at the time it entered the pool.
 * @returns {Boolean}
 */

MTX.prototype.verifyInputs = function verifyInputs(height) {
  const [fee] = this.checkInputs(height);
  return fee !== -1;
};

/**
 * Perform contextual checks to verify input, output,
 * and fee values, as well as coinbase spend maturity
 * (coinbases can only be spent 100 blocks or more
 * after they're created). Note that this function is
 * consensus critical.
 * @param {Number} height - Height at which the
 * transaction is being spent. In the mempool this is
 * the chain height plus one at the time it entered the pool.
 * @returns {Array} [fee, reason, score]
 */

MTX.prototype.checkInputs = function checkInputs(height) {
  return TX.prototype.checkInputs.call(this, this.view, height);
};

/**
 * Build input script (or witness) templates (with
 * OP_0 in place of signatures).
 * @param {Number} index - Input index.
 * @param {Coin|Output} coin
 * @param {KeyRing} ring
 * @returns {Boolean} Whether the script was able to be built.
 */

MTX.prototype.scriptInput = function scriptInput(index, coin, ring) {
  const input = this.inputs[index];

  assert(input, 'Input does not exist.');
  assert(coin, 'No coin passed.');

  // Don't bother with any below calculation
  // if the output is already templated.
  if (input.script.raw.length !== 0
      || input.witness.items.length !== 0) {
    return true;
  }

  // Get the previous output's script
  const prev = coin.script;

  // This is easily the hardest part about
  // building a transaction with segwit:
  // figuring out where the redeem script
  // and witness redeem scripts go.
  const sh = prev.getScripthash();

  if (sh) {
    const redeem = ring.getRedeem(sh);

    if (!redeem)
      return false;

    // Witness program nested in regular P2SH.
    if (redeem.isProgram()) {
      // P2WSH nested within pay-to-scripthash.
      const wsh = redeem.getWitnessScripthash();
      if (wsh) {
        const wredeem = ring.getRedeem(wsh);

        if (!wredeem)
          return false;

        const witness = this.scriptVector(wredeem, ring);

        if (!witness)
          return false;

        witness.push(wredeem.toRaw());

        input.witness.fromStack(witness);
        input.script.fromItems([redeem.toRaw()]);

        return true;
      }

      // P2WPKH nested within pay-to-scripthash.
      const wpkh = redeem.getWitnessPubkeyhash();
      if (wpkh) {
        const pkh = Script.fromPubkeyhash(wpkh);
        const witness = this.scriptVector(pkh, ring);

        if (!witness)
          return false;

        input.witness.fromStack(witness);
        input.script.fromItems([redeem.toRaw()]);

        return true;
      }

      // Unknown witness program.
      return false;
    }

    // Regular P2SH.
    const vector = this.scriptVector(redeem, ring);

    if (!vector)
      return false;

    vector.push(redeem.toRaw());

    input.script.fromStack(vector);

    return true;
  }

  // Witness program.
  if (prev.isProgram()) {
    // Bare P2WSH.
    const wsh = prev.getWitnessScripthash();
    if (wsh) {
      const wredeem = ring.getRedeem(wsh);

      if (!wredeem)
        return false;

      const vector = this.scriptVector(wredeem, ring);

      if (!vector)
        return false;

      vector.push(wredeem.toRaw());

      input.witness.fromStack(vector);

      return true;
    }

    // Bare P2WPKH.
    const wpkh = prev.getWitnessPubkeyhash();
    if (wpkh) {
      const pkh = Script.fromPubkeyhash(wpkh);
      const vector = this.scriptVector(pkh, ring);

      if (!vector)
        return false;

      input.witness.fromStack(vector);

      return true;
    }

    // Bare... who knows?
    return false;
  }

  // Wow, a normal output! Praise be to Jengus and Gord.
  const vector = this.scriptVector(prev, ring);

  if (!vector)
    return false;

  input.script.fromStack(vector);

  return true;
};

/**
 * Build script for a single vector
 * based on a previous script.
 * @param {Script} prev
 * @param {Buffer} ring
 * @return {Boolean}
 */

MTX.prototype.scriptVector = function scriptVector(prev, ring) {
  // P2PK
  const pk = prev.getPubkey();
  if (pk) {
    if (!pk.equals(ring.publicKey))
      return null;

    const stack = new Stack();

    stack.pushInt(0);

    return stack;
  }

  // P2PKH
  const pkh = prev.getPubkeyhash();
  if (pkh) {
    if (!pkh.equals(ring.getKeyHash()))
      return null;

    const stack = new Stack();

    stack.pushInt(0);
    stack.pushData(ring.publicKey);

    return stack;
  }

  // Multisig
  const [, n] = prev.getMultisig();
  if (n !== -1) {
    if (prev.indexOf(ring.publicKey) === -1)
      return null;

    // Technically we should create m signature slots,
    // but we create n signature slots so we can order
    // the signatures properly.
    const stack = new Stack();

    stack.pushInt(0);

    // Fill script with `n` signature slots.
    for (let i = 0; i < n; i++)
      stack.pushInt(0);

    return stack;
  }

  return null;
};

/**
 * Sign a transaction input on the worker pool
 * (if workers are enabled).
 * @param {Number} index
 * @param {Coin|Output} coin
 * @param {KeyRing} ring
 * @param {SighashType?} type
 * @param {WorkerPool?} pool
 * @returns {Promise}
 */

MTX.prototype.signInputAsync = async function signInputAsync(index, coin, ring, type, pool) {
  if (!pool)
    return this.signInput(index, coin, ring, type);

  return await pool.signInput(this, index, coin, ring, type, pool);
};

/**
 * Sign an input.
 * @param {Number} index - Index of input being signed.
 * @param {Coin|Output} coin
 * @param {KeyRing} ring - Private key.
 * @param {SighashType} type
 * @returns {Boolean} Whether the input was able to be signed.
 */

MTX.prototype.signInput = function signInput(index, coin, ring, type) {
  const input = this.inputs[index];
  const key = ring.privateKey;

  assert(input, 'Input does not exist.');
  assert(coin, 'No coin passed.');

  // Get the previous output's script
  const value = coin.value;
  let prev = coin.script;
  let vector = input.script;
  let version = 0;
  let redeem = false;

  // Grab regular p2sh redeem script.
  if (prev.isScripthash()) {
    prev = input.script.getRedeem();
    if (!prev)
      throw new Error('Input has not been templated.');
    redeem = true;
  }

  // If the output script is a witness program,
  // we have to switch the vector to the witness
  // and potentially alter the length. Note that
  // witnesses are stack items, so the `dummy`
  // _has_ to be an empty buffer (what OP_0
  // pushes onto the stack).
  if (prev.isWitnessScripthash()) {
    prev = input.witness.getRedeem();
    if (!prev)
      throw new Error('Input has not been templated.');
    vector = input.witness;
    redeem = true;
    version = 1;
  } else {
    const wpkh = prev.getWitnessPubkeyhash();
    if (wpkh) {
      prev = Script.fromPubkeyhash(wpkh);
      vector = input.witness;
      redeem = false;
      version = 1;
    }
  }

  // Create our signature.
  const sig = this.signature(index, prev, value, key, type, version);

  if (redeem) {
    const stack = vector.toStack();
    const redeem = stack.pop();

    const result = this.signVector(prev, stack, sig, ring);

    if (!result)
      return false;

    result.push(redeem);

    vector.fromStack(result);

    return true;
  }

  const stack = vector.toStack();
  const result = this.signVector(prev, stack, sig, ring);

  if (!result)
    return false;

  vector.fromStack(result);

  return true;
};

/**
 * Add a signature to a vector
 * based on a previous script.
 * @param {Script} prev
 * @param {Stack} vector
 * @param {Buffer} sig
 * @param {KeyRing} ring
 * @return {Boolean}
 */

MTX.prototype.signVector = function signVector(prev, vector, sig, ring) {
  // P2PK
  const pk = prev.getPubkey();
  if (pk) {
    // Make sure the pubkey is ours.
    if (!ring.publicKey.equals(pk))
      return null;

    if (vector.length === 0)
      throw new Error('Input has not been templated.');

    // Already signed.
    if (vector.get(0).length > 0)
      return vector;

    vector.set(0, sig);

    return vector;
  }

  // P2PKH
  const pkh = prev.getPubkeyhash();
  if (pkh) {
    // Make sure the pubkey hash is ours.
    if (!ring.getKeyHash().equals(pkh))
      return null;

    if (vector.length !== 2)
      throw new Error('Input has not been templated.');

    if (vector.get(1).length === 0)
      throw new Error('Input has not been templated.');

    // Already signed.
    if (vector.get(0).length > 0)
      return vector;

    vector.set(0, sig);

    return vector;
  }

  // Multisig
  const [m, n] = prev.getMultisig();
  if (m !== -1) {
    if (vector.length < 2)
      throw new Error('Input has not been templated.');

    if (vector.get(0).length !== 0)
      throw new Error('Input has not been templated.');

    // Too many signature slots. Abort.
    if (vector.length - 1 > n)
      throw new Error('Input has not been templated.');

    // Count the number of current signatures.
    let total = 0;
    for (let i = 1; i < vector.length; i++) {
      const item = vector.get(i);
      if (item.length > 0)
        total++;
    }

    // Signatures are already finalized.
    if (total === m && vector.length - 1 === m)
      return vector;

    // Add some signature slots for us to use if
    // there was for some reason not enough.
    while (vector.length - 1 < n)
      vector.pushInt(0);

    // Grab the redeem script's keys to figure
    // out where our key should go.
    const keys = [];
    for (const op of prev.code) {
      if (op.data)
        keys.push(op.data);
    }

    // Find the key index so we can place
    // the signature in the same index.
    let keyIndex = util.indexOf(keys, ring.publicKey);

    // Our public key is not in the prev_out
    // script. We tried to sign a transaction
    // that is not redeemable by us.
    if (keyIndex === -1)
      return null;

    // Offset key index by one to turn it into
    // "sig index". Accounts for OP_0 byte at
    // the start.
    keyIndex++;

    // Add our signature to the correct slot
    // and increment the total number of
    // signatures.
    if (keyIndex < vector.length && total < m) {
      if (vector.get(keyIndex).length === 0) {
        vector.set(keyIndex, sig);
        total++;
      }
    }

    // All signatures added. Finalize.
    if (total >= m) {
      // Remove empty slots left over.
      for (let i = vector.length - 1; i >= 1; i--) {
        const item = vector.get(i);
        if (item.length === 0)
          vector.remove(i);
      }

      // Remove signatures which are not required.
      // This should never happen.
      while (total > m) {
        vector.pop();
        total--;
      }

      // Sanity checks.
      assert(total === m);
      assert(vector.length - 1 === m);
    }

    return vector;
  }

  return null;
};

/**
 * Test whether the transaction is fully-signed.
 * @returns {Boolean}
 */

MTX.prototype.isSigned = function isSigned() {
  for (let i = 0; i < this.inputs.length; i++) {
    const {prevout} = this.inputs[i];
    const coin = this.view.getOutput(prevout);

    if (!coin)
      return false;

    if (!this.isInputSigned(i, coin))
      return false;
  }

  return true;
};

/**
 * Test whether an input is fully-signed.
 * @param {Number} index
 * @param {Coin|Output} coin
 * @returns {Boolean}
 */

MTX.prototype.isInputSigned = function isInputSigned(index, coin) {
  const input = this.inputs[index];

  assert(input, 'Input does not exist.');
  assert(coin, 'No coin passed.');

  let prev = coin.script;
  let vector = input.script;
  let redeem = false;

  // Grab redeem script if possible.
  if (prev.isScripthash()) {
    prev = input.script.getRedeem();
    if (!prev)
      return false;
    redeem = true;
  }

  // If the output script is a witness program,
  // we have to switch the vector to the witness
  // and potentially alter the length.
  if (prev.isWitnessScripthash()) {
    prev = input.witness.getRedeem();
    if (!prev)
      return false;
    vector = input.witness;
    redeem = true;
  } else {
    const wpkh = prev.getWitnessPubkeyhash();
    if (wpkh) {
      prev = Script.fromPubkeyhash(wpkh);
      vector = input.witness;
      redeem = false;
    }
  }

  const stack = vector.toStack();

  if (redeem)
    stack.pop();

  return this.isVectorSigned(prev, stack);
};

/**
 * Test whether a vector is fully-signed.
 * @param {Script} prev
 * @param {Stack} vector
 * @returns {Boolean}
 */

MTX.prototype.isVectorSigned = function isVectorSigned(prev, vector) {
  if (prev.isPubkey()) {
    if (vector.length !== 1)
      return false;

    if (vector.get(0).length === 0)
      return false;

    return true;
  }

  if (prev.isPubkeyhash()) {
    if (vector.length !== 2)
      return false;

    if (vector.get(0).length === 0)
      return false;

    if (vector.get(1).length === 0)
      return false;

    return true;
  }

  const [m] = prev.getMultisig();

  if (m !== -1) {
    // Ensure we have the correct number
    // of required signatures.
    if (vector.length - 1 !== m)
      return false;

    // Ensure all members are signatures.
    for (let i = 1; i < vector.length; i++) {
      const item = vector.get(i);
      if (item.length === 0)
        return false;
    }

    return true;
  }

  return false;
};

/**
 * Build input scripts (or witnesses).
 * @param {KeyRing} ring - Address used to sign. The address
 * must be able to redeem the coin.
 * @returns {Number} Number of inputs templated.
 */

MTX.prototype.template = function template(ring) {
  if (Array.isArray(ring)) {
    let total = 0;
    for (const key of ring)
      total += this.template(key);
    return total;
  }

  let total = 0;

  for (let i = 0; i < this.inputs.length; i++) {
    const {prevout} = this.inputs[i];
    const coin = this.view.getOutput(prevout);

    if (!coin)
      continue;

    if (!ring.ownOutput(coin))
      continue;

    // Build script for input
    if (!this.scriptInput(i, coin, ring))
      continue;

    total++;
  }

  return total;
};

/**
 * Built input scripts (or witnesses) and sign the inputs.
 * @param {KeyRing} ring - Address used to sign. The address
 * must be able to redeem the coin.
 * @param {SighashType} type
 * @returns {Number} Number of inputs signed.
 */

MTX.prototype.sign = function sign(ring, type) {
  if (Array.isArray(ring)) {
    let total = 0;
    for (const key of ring)
      total += this.sign(key, type);
    return total;
  }

  assert(ring.privateKey, 'No private key available.');

  let total = 0;

  for (let i = 0; i < this.inputs.length; i++) {
    const {prevout} = this.inputs[i];
    const coin = this.view.getOutput(prevout);

    if (!coin)
      continue;

    if (!ring.ownOutput(coin))
      continue;

    // Build script for input
    if (!this.scriptInput(i, coin, ring))
      continue;

    // Sign input
    if (!this.signInput(i, coin, ring, type))
      continue;

    total++;
  }

  return total;
};

/**
 * Sign the transaction inputs on the worker pool
 * (if workers are enabled).
 * @param {KeyRing} ring
 * @param {SighashType?} type
 * @param {WorkerPool?} pool
 * @returns {Promise}
 */

MTX.prototype.signAsync = async function signAsync(ring, type, pool) {
  if (!pool)
    return this.sign(ring, type);

  return await pool.sign(this, ring, type);
};

/**
 * Estimate maximum possible size.
 * @param {Function?} estimate - Input script size estimator.
 * @returns {Number}
 */

MTX.prototype.estimateSize = async function estimateSize(estimate) {
  const scale = consensus.WITNESS_SCALE_FACTOR;

  let total = 0;

  // Calculate the size, minus the input scripts.
  total += 4;
  total += encoding.sizeVarint(this.inputs.length);
  total += this.inputs.length * 40;

  total += encoding.sizeVarint(this.outputs.length);

  for (const output of this.outputs)
    total += output.getSize();

  total += 4;

  // Add size for signatures and public keys
  for (const {prevout} of this.inputs) {
    const coin = this.view.getOutput(prevout);

    // We're out of luck here.
    // Just assume it's a p2pkh.
    if (!coin) {
      total += 110;
      continue;
    }

    // Previous output script.
    const prev = coin.script;

    // P2PK
    if (prev.isPubkey()) {
      // varint script size
      total += 1;
      // OP_PUSHDATA0 [signature]
      total += 1 + 73;
      continue;
    }

    // P2PKH
    if (prev.isPubkeyhash()) {
      // varint script size
      total += 1;
      // OP_PUSHDATA0 [signature]
      total += 1 + 73;
      // OP_PUSHDATA0 [key]
      total += 1 + 33;
      continue;
    }

    const [m] = prev.getMultisig();
    if (m !== -1) {
      let size = 0;
      // Bare Multisig
      // OP_0
      size += 1;
      // OP_PUSHDATA0 [signature] ...
      size += (1 + 73) * m;
      // varint len
      size += encoding.sizeVarint(size);
      total += size;
      continue;
    }

    // P2WPKH
    if (prev.isWitnessPubkeyhash()) {
      let size = 0;
      // varint-items-len
      size += 1;
      // varint-len [signature]
      size += 1 + 73;
      // varint-len [key]
      size += 1 + 33;
      // vsize
      size = (size + scale - 1) / scale | 0;
      total += size;
      continue;
    }

    // Call out to the custom estimator.
    if (estimate) {
      const size = await estimate(prev);
      if (size !== -1) {
        total += size;
        continue;
      }
    }

    // P2SH
    if (prev.isScripthash()) {
      // varint size
      total += 1;
      // 2-of-3 multisig input
      total += 149;
      continue;
    }

    // P2WSH
    if (prev.isWitnessScripthash()) {
      let size = 0;
      // varint-items-len
      size += 1;
      // 2-of-3 multisig input
      size += 149;
      // vsize
      size = (size + scale - 1) / scale | 0;
      total += size;
      continue;
    }

    // Unknown.
    total += 110;
  }

  return total;
};

/**
 * Select necessary coins based on total output value.
 * @param {Coin[]} coins
 * @param {Object?} options
 * @returns {CoinSelection}
 * @throws on not enough funds available.
 */

MTX.prototype.selectCoins = function selectCoins(coins, options) {
  const selector = new CoinSelector(this, options);
  return selector.select(coins);
};

/**
 * Attempt to subtract a fee from all outputs evenly.
 * @param {Amount} fee
 * @param {Set|null} set
 */

MTX.prototype.subtractFee = function subtractFee(fee, set) {
  assert(typeof fee === 'number');

  let outputs = 0;

  for (let i = 0; i < this.outputs.length; i++) {
    const output = this.outputs[i];

    if (set && !set.has(i))
      continue;

    // Ignore nulldatas and
    // other OP_RETURN scripts.
    if (output.script.isUnspendable())
      continue;

    outputs += 1;
  }

  if (outputs === 0)
    throw new Error('Could not subtract fee.');

  const left = fee % outputs;
  const share = (fee - left) / outputs;

  // First pass, remove even shares.
  for (let i = 0; i < this.outputs.length; i++) {
    const output = this.outputs[i];

    if (set && !set.has(i))
      continue;

    if (output.script.isUnspendable())
      continue;

    if (output.value < share + output.getDustThreshold())
      throw new Error('Could not subtract fee.');

    output.value -= share;
  }

  // Second pass, remove the remainder
  // for the one unlucky output.
  for (let i = 0; i < this.outputs.length; i++) {
    const output = this.outputs[i];

    if (set && !set.has(i))
      continue;

    if (output.script.isUnspendable())
      continue;

    if (output.value >= left + output.getDustThreshold()) {
      output.value -= left;
      return;
    }
  }

  throw new Error('Could not subtract fee.');
};

/**
 * Select coins and fill the inputs.
 * @param {Coin[]} coins
 * @param {Object} options - See {@link MTX#selectCoins} options.
 * @returns {CoinSelector}
 */

MTX.prototype.fund = async function fund(coins, options) {
  assert(options, 'Options are required.');
  assert(options.changeAddress, 'Change address is required.');
  assert(this.inputs.length === 0, 'TX is already funded.');

  // Select necessary coins.
  const select = await this.selectCoins(coins, options);

  // Add coins to transaction.
  for (const coin of select.chosen)
    this.addCoin(coin);

  // Attempt to subtract fee.
  if (select.subtractFee)
    this.subtractFee(select.fee, select.subtractIndex);

  // Add a change output.
  const output = new Output();
  output.value = select.change;
  output.script.fromAddress(select.changeAddress);

  if (output.isDust(policy.MIN_RELAY)) {
    // Do nothing. Change is added to fee.
    this.changeIndex = -1;
    assert.strictEqual(this.getFee(), select.fee + select.change);
  } else {
    this.outputs.push(output);
    this.changeIndex = this.outputs.length - 1;
    assert.strictEqual(this.getFee(), select.fee);
  }

  return select;
};

/**
 * Sort inputs and outputs according to BIP69.
 * @see https://github.com/bitcoin/bips/blob/master/bip-0069.mediawiki
 */

MTX.prototype.sortMembers = function sortMembers() {
  let changeOutput = null;

  if (this.changeIndex !== -1) {
    changeOutput = this.outputs[this.changeIndex];
    assert(changeOutput);
  }

  this.inputs.sort(sortInputs);
  this.outputs.sort(sortOutputs);

  if (this.changeIndex !== -1) {
    this.changeIndex = this.outputs.indexOf(changeOutput);
    assert(this.changeIndex !== -1);
  }
};

/**
 * Avoid fee sniping.
 * @param {Number} - Current chain height.
 * @see bitcoin/src/wallet/wallet.cpp
 */

MTX.prototype.avoidFeeSniping = function avoidFeeSniping(height) {
  assert(typeof height === 'number', 'Must pass in height.');

  if (util.random(0, 10) === 0) {
    height -= util.random(0, 100);

    if (height < 0)
      height = 0;
  }

  this.setLocktime(height);
};

/**
 * Set locktime and sequences appropriately.
 * @param {Number} locktime
 */

MTX.prototype.setLocktime = function setLocktime(locktime) {
  assert(util.isU32(locktime), 'Locktime must be a uint32.');
  assert(this.inputs.length > 0, 'Cannot set sequence with no inputs.');

  for (const input of this.inputs) {
    if (input.sequence === 0xffffffff)
      input.sequence = 0xfffffffe;
  }

  this.locktime = locktime;
};

/**
 * Set sequence locktime.
 * @param {Number} index - Input index.
 * @param {Number} locktime
 * @param {Boolean?} seconds
 */

MTX.prototype.setSequence = function setSequence(index, locktime, seconds) {
  const input = this.inputs[index];

  assert(input, 'Input does not exist.');
  assert(util.isU32(locktime), 'Locktime must be a uint32.');

  this.version = 2;

  if (seconds) {
    locktime >>>= consensus.SEQUENCE_GRANULARITY;
    locktime &= consensus.SEQUENCE_MASK;
    locktime |= consensus.SEQUENCE_TYPE_FLAG;
  } else {
    locktime &= consensus.SEQUENCE_MASK;
  }

  input.sequence = locktime;
};

/**
 * Inspect the transaction.
 * @returns {Object}
 */

MTX.prototype.inspect = function inspect() {
  return this.format();
};

/**
 * Inspect the transaction.
 * @returns {Object}
 */

MTX.prototype.format = function format() {
  return TX.prototype.format.call(this, this.view);
};

/**
 * Convert transaction to JSON.
 * @returns {Object}
 */

MTX.prototype.toJSON = function toJSON() {
  return TX.prototype.getJSON.call(this, null, this.view);
};

/**
 * Convert transaction to JSON.
 * @param {Network} network
 * @returns {Object}
 */

MTX.prototype.getJSON = function getJSON(network) {
  return TX.prototype.getJSON.call(this, network, this.view);
};

/**
 * Instantiate a transaction from a
 * jsonified transaction object.
 * @param {Object} json - The jsonified transaction object.
 * @returns {MTX}
 */

MTX.fromJSON = function fromJSON(json) {
  return new MTX().fromJSON(json);
};

/**
 * Instantiate a transaction from a buffer reader.
 * @param {BufferReader} br
 * @returns {MTX}
 */

MTX.fromReader = function fromReader(br) {
  return new MTX().fromReader(br);
};

/**
 * Instantiate a transaction from a serialized Buffer.
 * @param {Buffer} data
 * @param {String?} enc - Encoding, can be `'hex'` or null.
 * @returns {MTX}
 */

MTX.fromRaw = function fromRaw(data, enc) {
  if (typeof data === 'string')
    data = Buffer.from(data, enc);
  return new MTX().fromRaw(data);
};

/**
 * Convert the MTX to a TX.
 * @returns {TX}
 */

MTX.prototype.toTX = function toTX() {
  return new TX().inject(this);
};

/**
 * Convert the MTX to a TX.
 * @returns {Array} [tx, view]
 */

MTX.prototype.commit = function commit() {
  return [this.toTX(), this.view];
};

/**
 * Instantiate MTX from TX.
 * @param {TX} tx
 * @returns {MTX}
 */

MTX.fromTX = function fromTX(tx) {
  return new MTX().inject(tx);
};

/**
 * Test whether an object is an MTX.
 * @param {Object} obj
 * @returns {Boolean}
 */

MTX.isMTX = function isMTX(obj) {
  return obj instanceof MTX;
};

/**
 * Coin Selector
 * @alias module:primitives.CoinSelector
 * @constructor
 * @param {TX} tx
 * @param {Object?} options
 */

function CoinSelector(tx, options) {
  if (!(this instanceof CoinSelector))
    return new CoinSelector(tx, options);

  this.tx = tx.clone();
  this.coins = [];
  this.outputValue = 0;
  this.index = 0;
  this.chosen = [];
  this.change = 0;
  this.fee = CoinSelector.MIN_FEE;

  this.selection = 'value';
  this.subtractFee = false;
  this.subtractIndex = null;
  this.height = -1;
  this.depth = -1;
  this.hardFee = -1;
  this.rate = CoinSelector.FEE_RATE;
  this.maxFee = -1;
  this.round = false;
  this.changeAddress = null;

  // Needed for size estimation.
  this.estimate = null;

  if (options)
    this.fromOptions(options);
}

/**
 * Default fee rate
 * for coin selection.
 * @const {Amount}
 * @default
 */

CoinSelector.FEE_RATE = 10000;

/**
 * Minimum fee to start with
 * during coin selection.
 * @const {Amount}
 * @default
 */

CoinSelector.MIN_FEE = 10000;

/**
 * Maximum fee to allow
 * after coin selection.
 * @const {Amount}
 * @default
 */

CoinSelector.MAX_FEE = consensus.COIN / 10;

/**
 * Initialize selector options.
 * @param {Object} options
 * @private
 */

CoinSelector.prototype.fromOptions = function fromOptions(options) {
  if (options.selection) {
    assert(typeof options.selection === 'string');
    this.selection = options.selection;
  }

  if (options.subtractFee != null) {
    assert(typeof options.subtractFee === 'boolean');
    this.subtractFee = options.subtractFee;
  }

  if (options.subtractIndex != null) {
    let indicies = null;

    if (typeof options.subtractIndex === 'number') {
      indicies = [options.subtractIndex];
    } else {
      assert(Array.isArray(options.subtractIndex));
      indicies = options.subtractIndex;
    }

    if (indicies.length > 0) {
      const set = new Set();

      for (const index of indicies) {
        assert(util.isU32(index));
        assert(index < this.tx.outputs.length);
        set.add(index);
      }

      this.subtractIndex = set;
      this.subtractFee = true;
    }
  }

  if (options.height != null) {
    assert(util.isInt(options.height));
    assert(options.height >= -1);
    this.height = options.height;
  }

  if (options.confirmations != null) {
    assert(util.isInt(options.confirmations));
    assert(options.confirmations >= -1);
    this.depth = options.confirmations;
  }

  if (options.depth != null) {
    assert(util.isInt(options.depth));
    assert(options.depth >= -1);
    this.depth = options.depth;
  }

  if (options.hardFee != null) {
    assert(util.isInt(options.hardFee));
    assert(options.hardFee >= -1);
    this.hardFee = options.hardFee;
  }

  if (options.rate != null) {
    assert(util.isU64(options.rate));
    this.rate = options.rate;
  }

  if (options.maxFee != null) {
    assert(util.isInt(options.maxFee));
    assert(options.maxFee >= -1);
    this.maxFee = options.maxFee;
  }

  if (options.round != null) {
    assert(typeof options.round === 'boolean');
    this.round = options.round;
  }

  if (options.changeAddress) {
    const addr = options.changeAddress;
    if (typeof addr === 'string') {
      this.changeAddress = Address.fromString(addr);
    } else {
      assert(addr instanceof Address);
      this.changeAddress = addr;
    }
  }

  if (options.estimate) {
    assert(typeof options.estimate === 'function');
    this.estimate = options.estimate;
  }

  return this;
};

/**
 * Initialize the selector with coins to select from.
 * @param {Coin[]} coins
 */

CoinSelector.prototype.init = function init(coins) {
  this.coins = coins.slice();
  this.outputValue = this.tx.getOutputValue();
  this.index = 0;
  this.chosen = [];
  this.change = 0;
  this.fee = CoinSelector.MIN_FEE;
  this.tx.inputs.length = 0;

  switch (this.selection) {
    case 'all':
    case 'random':
      this.coins.sort(sortRandom);
      break;
    case 'age':
      this.coins.sort(sortAge);
      break;
    case 'value':
      this.coins.sort(sortValue);
      break;
    default:
      throw new FundingError(`Bad selection type: ${this.selection}.`);
  }
};

/**
 * Calculate total value required.
 * @returns {Amount}
 */

CoinSelector.prototype.total = function total() {
  if (this.subtractFee)
    return this.outputValue;
  return this.outputValue + this.fee;
};

/**
 * Test whether the selector has
 * completely funded the transaction.
 * @returns {Boolean}
 */

CoinSelector.prototype.isFull = function isFull() {
  return this.tx.getInputValue() >= this.total();
};

/**
 * Test whether a coin is spendable
 * with regards to the options.
 * @param {Coin} coin
 * @returns {Boolean}
 */

CoinSelector.prototype.isSpendable = function isSpendable(coin) {
  if (this.height === -1)
    return true;

  if (coin.coinbase) {
    if (coin.height === -1)
      return false;

    if (this.height + 1 < coin.height + consensus.COINBASE_MATURITY)
      return false;

    return true;
  }

  if (this.depth === -1)
    return true;

  const depth = coin.getDepth(this.height);

  if (depth < this.depth)
    return false;

  return true;
};

/**
 * Get the current fee based on a size.
 * @param {Number} size
 * @returns {Amount}
 */

CoinSelector.prototype.getFee = function getFee(size) {
  // This is mostly here for testing.
  // i.e. A fee rounded to the nearest
  // kb is easier to predict ahead of time.
  if (this.round) {
    const fee = policy.getRoundFee(size, this.rate);
    return Math.min(fee, CoinSelector.MAX_FEE);
  }

  const fee = policy.getMinFee(size, this.rate);
  return Math.min(fee, CoinSelector.MAX_FEE);
};

/**
 * Fund the transaction with more
 * coins if the `output value + fee`
 * total was updated.
 */

CoinSelector.prototype.fund = function fund() {
  while (this.index < this.coins.length) {
    const coin = this.coins[this.index++];

    if (!this.isSpendable(coin))
      continue;

    this.tx.addCoin(coin);
    this.chosen.push(coin);

    if (this.selection === 'all')
      continue;

    if (this.isFull())
      break;
  }
};

/**
 * Initiate selection from `coins`.
 * @param {Coin[]} coins
 * @returns {CoinSelector}
 */

CoinSelector.prototype.select = async function select(coins) {
  this.init(coins);

  if (this.hardFee !== -1) {
    this.selectHard();
  } else {
    // This is potentially asynchronous:
    // it may invoke the size estimator
    // required for redeem scripts (we
    // may be calling out to a wallet
    // or something similar).
    await this.selectEstimate();
  }

  if (!this.isFull()) {
    // Still failing to get enough funds.
    throw new FundingError(
      'Not enough funds.',
      this.tx.getInputValue(),
      this.total());
  }

  // How much money is left after filling outputs.
  this.change = this.tx.getInputValue() - this.total();

  return this;
};

/**
 * Initialize selection based on size estimate.
 */

CoinSelector.prototype.selectEstimate = async function selectEstimate() {
  // Set minimum fee and do
  // an initial round of funding.
  this.fee = CoinSelector.MIN_FEE;
  this.fund();

  // Add dummy output for change.
  const change = new Output();

  if (this.changeAddress) {
    change.script.fromAddress(this.changeAddress);
  } else {
    // In case we don't have a change address,
    // we use a fake p2pkh output to gauge size.
    change.script.fromPubkeyhash(encoding.ZERO_HASH160);
  }

  this.tx.outputs.push(change);

  // Keep recalculating the fee and funding
  // until we reach some sort of equilibrium.
  do {
    const size = await this.tx.estimateSize(this.estimate);

    this.fee = this.getFee(size);

    if (this.maxFee > 0 && this.fee > this.maxFee)
      throw new FundingError('Fee is too high.');

    // Failed to get enough funds, add more coins.
    if (!this.isFull())
      this.fund();
  } while (!this.isFull() && this.index < this.coins.length);
};

/**
 * Initiate selection based on a hard fee.
 */

CoinSelector.prototype.selectHard = function selectHard() {
  this.fee = Math.min(this.hardFee, CoinSelector.MAX_FEE);
  this.fund();
};

/**
 * An error thrown from the coin selector.
 * @constructor
 * @ignore
 * @extends Error
 * @param {String} msg
 * @param {Amount} available
 * @param {Amount} required
 * @property {String} message - Error message.
 * @property {Amount} availableFunds
 * @property {Amount} requiredFunds
 */

function FundingError(msg, available, required) {
  Error.call(this);

  this.type = 'FundingError';
  this.message = msg;
  this.availableFunds = -1;
  this.requiredFunds = -1;

  if (available != null) {
    this.message += ` (available=${Amount.btc(available)},`;
    this.message += ` required=${Amount.btc(required)})`;
    this.availableFunds = available;
    this.requiredFunds = required;
  }

  if (Error.captureStackTrace)
    Error.captureStackTrace(this, FundingError);
}

Object.setPrototypeOf(FundingError.prototype, Error.prototype);

/*
 * Helpers
 */

function sortAge(a, b) {
  a = a.height === -1 ? 0x7fffffff : a.height;
  b = b.height === -1 ? 0x7fffffff : b.height;
  return a - b;
}

function sortRandom(a, b) {
  return Math.random() > 0.5 ? 1 : -1;
}

function sortValue(a, b) {
  if (a.height === -1 && b.height !== -1)
    return 1;

  if (a.height !== -1 && b.height === -1)
    return -1;

  return b.value - a.value;
}

function sortInputs(a, b) {
  return a.compare(b);
}

function sortOutputs(a, b) {
  return a.compare(b);
}

/*
 * Expose
 */

exports = MTX;
exports.MTX = MTX;
exports.Selector = CoinSelector;
exports.FundingError = FundingError;

module.exports = exports;
