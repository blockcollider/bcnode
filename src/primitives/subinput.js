
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

function SubInput(options) {
  if (!(this instanceof SubInput))
    return new SubInput(options);

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

SubInput.prototype.fromOptions = function fromOptions(options) {
  assert(options, 'SubInput data is required.');

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
 * Instantiate an SubInput from options object.
 * @param {NakedSubInput} options
 * @returns {SubInput}
 */

SubInput.fromOptions = function fromOptions(options) {
  return new SubInput().fromOptions(options);
};

/**
 * Clone the input.
 * @returns {SubInput}
 */

SubInput.prototype.clone = function clone() {
  const input = new SubInput();
  input.prevout = this.prevout;
  input.script.inject(this.script);
  input.sequence = this.sequence;
  return input;
};

/**
 * Test equality against another input.
 * @param {SubInput} input
 * @returns {Boolean}
 */

SubInput.prototype.equals = function equals(input) {
  assert(SubInput.isSubInput(input));
  return this.prevout.equals(input.prevout);
};

/**
 * Compare against another input (BIP69).
 * @param {SubInput} input
 * @returns {Number}
 */

SubInput.prototype.compare = function compare(input) {
  assert(SubInput.isSubInput(input));
  return this.prevout.compare(input.prevout);
};

/**
 * Get the previous output script type as a string.
 * Will "guess" based on the input script and/or
 * witness if coin is not available.
 * @param {Coin?} coin
 * @returns {ScriptType} type
 */

SubInput.prototype.getType = function getType(coin) {
  if (this.isCoinbase())
    return 'subcoinbase';

  if (coin)
    return coin.getType();

  let type;

      type = this.script.getInputType();

  let t = Script.typesByVal[type].toLowerCase();

  if(t === "nonstandard")
      return "subnonstandard";

  return t; 

};


/**
 * Get the redeem script. Will attempt to resolve nested
 * redeem scripts if witnessscripthash is behind a scripthash.
 * @param {Coin?} coin
 * @returns {Script?} Redeem script.
 */

SubInput.prototype.getRedeem = function getRedeem(coin) {
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

SubInput.prototype.getSubtype = function getSubtype(coin) {
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

SubInput.prototype.getAddress = function getAddress(coin) {
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

SubInput.prototype.getHash = function getHash(enc) {
  const addr = this.getAddress();

  if (!addr)
    return null;

  return addr.getHash(enc);
};

/**
 * Test to see if nSequence is equal to uint32max.
 * @returns {Boolean}
 */

SubInput.prototype.isFinal = function isFinal() {
  return this.sequence === 0xffffffff;
};

/**
 * Test to see if nSequence is less than 0xfffffffe.
 * @returns {Boolean}
 */

SubInput.prototype.isRBF = function isRBF() {
  return this.sequence < 0xfffffffe;
};

/**
 * Test to see if outpoint is null.
 * @returns {Boolean}
 */

SubInput.prototype.isCoinbase = function isCoinbase() {
  return this.prevout.isNull();
};

/**
 * Convert the input to a more user-friendly object.
 * @returns {Object}
 */

SubInput.prototype.inspect = function inspect() {
  return this.format();
};

/**
 * Convert the input to a more user-friendly object.
 * @param {Coin?} coin
 * @returns {Object}
 */

SubInput.prototype.format = function format(coin) {
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

SubInput.prototype.toJSON = function toJSON(network, coin) {
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

SubInput.prototype.getJSON = function getJSON(network, coin) {
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

SubInput.prototype.fromJSON = function fromJSON(json) {
  assert(json, 'SubInput data is required.');
  assert(util.isU32(json.sequence), 'Sequence must be a uint32.');
  this.prevout.fromJSON(json.prevout);
  this.script.fromJSON(json.script);
  this.sequence = json.sequence;
  return this;
};

/**
 * Instantiate an SubInput from a jsonified input object.
 * @param {Object} json - The jsonified input object.
 * @returns {SubInput}
 */

SubInput.fromJSON = function fromJSON(json) {
  return new SubInput().fromJSON(json);
};

/**
 * Calculate size of serialized input.
 * @returns {Number}
 */

SubInput.prototype.getSize = function getSize() {
  return 40 + this.script.getVarSize();
};

/**
 * Serialize the input.
 * @param {String?} enc - Encoding, can be `'hex'` or null.
 * @returns {Buffer|String}
 */

SubInput.prototype.toRaw = function toRaw() {
  const size = this.getSize();
  return this.toWriter(new StaticWriter(size)).render();
};

/**
 * Write the input to a buffer writer.
 * @param {BufferWriter} bw
 */

SubInput.prototype.toWriter = function toWriter(bw) {
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

SubInput.prototype.fromReader = function fromReader(br) {
  this.prevout.fromReader(br);
  this.script.fromRaw(br.readVarBytes());
  this.sequence = br.readU32();
  return this;
};

/**
 * Inject properties from serialized data.
 * @param {Buffer} data
 */

SubInput.prototype.fromRaw = function fromRaw(data) {
  return this.fromReader(new BufferReader(data));
};

/**
 * Instantiate an input from a buffer reader.
 * @param {BufferReader} br
 * @returns {SubInput}
 */

SubInput.fromReader = function fromReader(br) {
  return new SubInput().fromReader(br);
};

/**
 * Instantiate an input from a serialized Buffer.
 * @param {Buffer} data
 * @param {String?} enc - Encoding, can be `'hex'` or null.
 * @returns {SubInput}
 */

SubInput.fromRaw = function fromRaw(data, enc) {
  if (typeof data === 'string')
    data = Buffer.from(data, enc);
  return new SubInput().fromRaw(data);
};

/**
 * Inject properties from outpoint.
 * @private
 * @param {Outpoint} outpoint
 */

SubInput.prototype.fromOutpoint = function fromOutpoint(outpoint) {
  assert(typeof outpoint.hash === 'string');
  assert(typeof outpoint.index === 'number');
  this.prevout.hash = outpoint.hash;
  this.prevout.index = outpoint.index;
  return this;
};

/**
 * Instantiate input from outpoint.
 * @param {Outpoint}
 * @returns {SubInput}
 */

SubInput.fromOutpoint = function fromOutpoint(outpoint) {
  return new SubInput().fromOutpoint(outpoint);
};

/**
 * Inject properties from coin.
 * @private
 * @param {Coin} coin
 */

SubInput.prototype.fromCoin = function fromCoin(coin) {
  assert(typeof coin.hash === 'string');
  assert(typeof coin.index === 'number');
  this.prevout.hash = coin.hash;
  this.prevout.index = coin.index;
  return this;
};

/**
 * Instantiate input from coin.
 * @param {Coin}
 * @returns {SubInput}
 */

SubInput.fromCoin = function fromCoin(coin) {
  return new SubInput().fromCoin(coin);
};

/**
 * Inject properties from transaction.
 * @private
 * @param {TX} tx
 * @param {Number} index
 */

SubInput.prototype.fromTX = function fromTX(tx, index) {
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
 * @returns {SubInput}
 */

SubInput.fromTX = function fromTX(tx, index) {
  return new SubInput().fromTX(tx, index);
};

/**
 * Test an object to see if it is an SubInput.
 * @param {Object} obj
 * @returns {Boolean}
 */

SubInput.isSubInput = function isSubInput(obj) {
  return obj instanceof SubInput;
};

/*
 * Expose
 */

module.exports = SubInput;





