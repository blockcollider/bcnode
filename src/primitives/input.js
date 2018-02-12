
/*!
 * input.js - input object for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const assert = require('assert');
const util = require('../utils/util');
const Script = require('../script/script');
const Outpoint = require('./outpoint.js');

function Input(options) {
  if (!(this instanceof Input))
    return new Input(options);

  this.prevout = new Outpoint();
  this.script = new Script();
  this.sequence = 0xffffffff;

  if (options)
    this.fromOptions(options);
}

/**
 * Inject properties from options object.
 * @private
 * @param {Object} options
 */

Input.prototype.fromOptions = function fromOptions(options) {
  assert(options, 'Input data is required.');

  this.prevout.fromOptions(options.prevout);

  if (options.script)
    this.script.fromOptions(options.script);

  if (options.sequence != null) {
    assert(util.isU32(options.sequence), 'Sequence must be a uint32.');
    this.sequence = options.sequence;
  }


  return this;
};

/**
 * Instantiate an Input from options object.
 * @param {NakedInput} options
 * @returns {Input}
 */

Input.fromOptions = function fromOptions(options) {
  return new Input().fromOptions(options);
};

/**
 * Clone the input.
 * @returns {Input}
 */

Input.prototype.clone = function clone() {
  const input = new Input();
  input.prevout = this.prevout;
  input.script.inject(this.script);
  input.sequence = this.sequence;
  return input;
};

/**
 * Test equality against another input.
 * @param {Input} input
 * @returns {Boolean}
 */

Input.prototype.equals = function equals(input) {
  assert(Input.isInput(input));
  return this.prevout.equals(input.prevout);
};

/**
 * Compare against another input (BIP69).
 * @param {Input} input
 * @returns {Number}
 */

Input.prototype.compare = function compare(input) {
  assert(Input.isInput(input));
  return this.prevout.compare(input.prevout);
};

/**
 * Get the previous output script type as a string.
 * Will "guess" based on the input script and/or
 * witness if coin is not available.
 * @param {Coin?} coin
 * @returns {ScriptType} type
 */

Input.prototype.getType = function getType(coin) {
  if (this.isCoinbase())
    return 'coinbase';

  if (coin)
    return coin.getType();

  let type;

      type = this.script.getInputType();

  return Script.typesByVal[type].toLowerCase();
};

/**
 * Get the redeem script. Will attempt to resolve nested
 * redeem scripts if witnessscripthash is behind a scripthash.
 * @param {Coin?} coin
 * @returns {Script?} Redeem script.
 */

Input.prototype.getRedeem = function getRedeem(coin) {
  if (this.isCoinbase())
    return null;

  if (!coin) {
    if (this.script.isScripthashInput())
      return this.script.getRedeem();

    return null;
  }

  let prev = coin.script;
  let redeem = null;

  if (prev.isScripthash()) {
    prev = this.script.getRedeem();
    redeem = prev;
  }

  return redeem;
};

/**
 * Get the redeem script type.
 * @param {Coin?} coin
 * @returns {String} subtype
 */

Input.prototype.getSubtype = function getSubtype(coin) {
  if (this.isCoinbase())
    return null;

  const redeem = this.getRedeem(coin);

  if (!redeem)
    return null;

  const type = redeem.getType();

  return Script.typesByVal[type].toLowerCase();
};

/**
 * Get the previous output script's address. Will "guess"
 * based on the input script and/or witness if coin
 * is not available.
 * @param {Coin?} coin
 * @returns {Address?} addr
 */

Input.prototype.getAddress = function getAddress(coin) {
  if (this.isCoinbase())
    return null;

  if (coin)
    return coin.getAddress();


  return this.script.getInputAddress();
};

/**
 * Get the address hash.
 * @param {String?} enc
 * @returns {Hash} hash
 */

Input.prototype.getHash = function getHash(enc) {
  const addr = this.getAddress();

  if (!addr)
    return null;

  return addr.getHash(enc);
};

/**
 * Test to see if nSequence is equal to uint32max.
 * @returns {Boolean}
 */

Input.prototype.isFinal = function isFinal() {
  return this.sequence === 0xffffffff;
};

/**
 * Test to see if nSequence is less than 0xfffffffe.
 * @returns {Boolean}
 */

Input.prototype.isRBF = function isRBF() {
  return this.sequence < 0xfffffffe;
};

/**
 * Test to see if outpoint is null.
 * @returns {Boolean}
 */

Input.prototype.isCoinbase = function isCoinbase() {
  return this.prevout.isNull();
};

/**
 * Convert the input to a more user-friendly object.
 * @returns {Object}
 */

Input.prototype.inspect = function inspect() {
  return this.format();
};

/**
 * Convert the input to a more user-friendly object.
 * @param {Coin?} coin
 * @returns {Object}
 */

Input.prototype.format = function format(coin) {
  return {
    type: this.getType(coin),
    subtype: this.getSubtype(coin),
    address: this.getAddress(coin),
    script: this.script,
    redeem: this.getRedeem(coin),
    sequence: this.sequence,
    prevout: this.prevout,
    coin: coin || null
  };
};

/**
 * Convert the input to an object suitable
 * for JSON serialization.
 * @returns {Object}
 */

Input.prototype.toJSON = function toJSON(network, coin) {
  return this.getJSON();
};

/**
 * Convert the input to an object suitable
 * for JSON serialization. Note that the hashes
 * will be reversed to abide by bitcoind's legacy
 * of little-endian uint256s.
 * @param {Network} network
 * @param {Coin} coin
 * @returns {Object}
 */

Input.prototype.getJSON = function getJSON(network, coin) {
  network = Network.get(network);

  let addr;
  if (!coin) {
    addr = this.getAddress();
    if (addr)
      addr = addr.toString(network);
  }

  return {
    prevout: this.prevout.toJSON(),
    script: this.script.toJSON(),
    sequence: this.sequence,
    address: addr,
    coin: coin ? coin.getJSON(network, true) : undefined
  };
};

/**
 * Inject properties from a JSON object.
 * @private
 * @param {Object} json
 */

Input.prototype.fromJSON = function fromJSON(json) {
  assert(json, 'Input data is required.');
  assert(util.isU32(json.sequence), 'Sequence must be a uint32.');
  this.prevout.fromJSON(json.prevout);
  this.script.fromJSON(json.script);
  this.sequence = json.sequence;
  return this;
};

/**
 * Instantiate an Input from a jsonified input object.
 * @param {Object} json - The jsonified input object.
 * @returns {Input}
 */

Input.fromJSON = function fromJSON(json) {
  return new Input().fromJSON(json);
};

/**
 * Calculate size of serialized input.
 * @returns {Number}
 */

Input.prototype.getSize = function getSize() {
  return 40 + this.script.getVarSize();
};

/**
 * Serialize the input.
 * @param {String?} enc - Encoding, can be `'hex'` or null.
 * @returns {Buffer|String}
 */

Input.prototype.toRaw = function toRaw() {
  const size = this.getSize();
  return this.toWriter(new StaticWriter(size)).render();
};

/**
 * Write the input to a buffer writer.
 * @param {BufferWriter} bw
 */

Input.prototype.toWriter = function toWriter(bw) {
  this.prevout.toWriter(bw);
  bw.writeVarBytes(this.script.toRaw());
  bw.writeU32(this.sequence);
  return bw;
};

/**
 * Inject properties from buffer reader.
 * @private
 * @param {BufferReader} br
 */

Input.prototype.fromReader = function fromReader(br) {
  console.log(this.prevout);
  
  //TODO: Correct this load
  //this.prevout.fromReader(br);
  this.script.fromRaw(br.readVarBytes());
  this.sequence = br.readU32();
  return this;
};

/**
 * Inject properties from serialized data.
 * @param {Buffer} data
 */

Input.prototype.fromRaw = function fromRaw(data) {
  return this.fromReader(new BufferReader(data));
};

/**
 * Instantiate an input from a buffer reader.
 * @param {BufferReader} br
 * @returns {Input}
 */

Input.fromReader = function fromReader(br) {
  return new Input().fromReader(br);
};

/**
 * Instantiate an input from a serialized Buffer.
 * @param {Buffer} data
 * @param {String?} enc - Encoding, can be `'hex'` or null.
 * @returns {Input}
 */

Input.fromRaw = function fromRaw(data, enc) {
  if (typeof data === 'string')
    data = Buffer.from(data, enc);
  return new Input().fromRaw(data);
};

/**
 * Inject properties from outpoint.
 * @private
 * @param {Outpoint} outpoint
 */

Input.prototype.fromOutpoint = function fromOutpoint(outpoint) {
  assert(typeof outpoint.hash === 'string');
  assert(typeof outpoint.index === 'number');
  this.prevout.hash = outpoint.hash;
  this.prevout.index = outpoint.index;
  return this;
};

/**
 * Instantiate input from outpoint.
 * @param {Outpoint}
 * @returns {Input}
 */

Input.fromOutpoint = function fromOutpoint(outpoint) {
  return new Input().fromOutpoint(outpoint);
};

/**
 * Inject properties from coin.
 * @private
 * @param {Coin} coin
 */

Input.prototype.fromCoin = function fromCoin(coin) {
  assert(typeof coin.hash === 'string');
  assert(typeof coin.index === 'number');
  this.prevout.hash = coin.hash;
  this.prevout.index = coin.index;
  return this;
};

/**
 * Instantiate input from coin.
 * @param {Coin}
 * @returns {Input}
 */

Input.fromCoin = function fromCoin(coin) {
  return new Input().fromCoin(coin);
};

/**
 * Inject properties from transaction.
 * @private
 * @param {TX} tx
 * @param {Number} index
 */

Input.prototype.fromTX = function fromTX(tx, index) {
  assert(tx);
  assert(typeof index === 'number');
  assert(index >= 0 && index < tx.outputs.length);
  this.prevout.hash = tx.hash('hex');
  this.prevout.index = index;
  return this;
};

/**
 * Instantiate input from tx.
 * @param {TX} tx
 * @param {Number} index
 * @returns {Input}
 */

Input.fromTX = function fromTX(tx, index) {
  return new Input().fromTX(tx, index);
};

/**
 * Test an object to see if it is an Input.
 * @param {Object} obj
 * @returns {Boolean}
 */

Input.isInput = function isInput(obj) {
  return obj instanceof Input;
};

/*
 * Expose
 */

module.exports = Input;





