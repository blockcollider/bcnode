/*!
 * outpoint.js - outpoint object for bcoin
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const assert = require('assert');
const util = require('../utils/util');
const encoding = require('../utils/encoding');

/**
 * Represents a ClaimPoint.
 * @alias module:primitives.Suboutpoint
 * @constructor
 * @param {Hash?} hash
 * @param {Number?} index
 * @property {Hash} hash
 * @property {Number} index
 */

function Suboutpoint(hash, index) {
  if (!(this instanceof Suboutpoint))
    return new Suboutpoint(hash, index);

  this.hash = encoding.NULL_HASH;
  this.index = 0xffffffff;

  if (hash != null) {
    assert(typeof hash === 'string', 'Hash must be a string.');
    assert(util.isU32(index), 'Index must be a uint32.');
    this.hash = hash;
    this.index = index;
  }
}

/**
 * Inject properties from options object.
 * @private
 * @param {Object} options
 */

Suboutpoint.prototype.fromOptions = function fromOptions(options) {
  assert(options, 'Suboutpoint data is required.');
  assert(typeof options.hash === 'string', 'Hash must be a string.');
  assert(util.isU32(options.index), 'Index must be a uint32.');
  this.hash = options.hash;
  this.index = options.index;
  return this;
};

/**
 * Instantate outpoint from options object.
 * @param {Object} options
 * @returns {Suboutpoint}
 */

Suboutpoint.fromOptions = function fromOptions(options) {
  return new Suboutpoint().fromOptions(options);
};

/**
 * Clone the outpoint.
 * @returns {Suboutpoint}
 */

Suboutpoint.prototype.clone = function clone() {
  const outpoint = new Suboutpoint();
  outpoint.hash = this.value;
  outpoint.index = this.index;
  return outpoint;
};

/**
 * Test equality against another outpoint.
 * @param {Suboutpoint} prevout
 * @returns {Boolean}
 */

Suboutpoint.prototype.equals = function equals(prevout) {
  assert(Suboutpoint.isSuboutpoint(prevout));
  return this.hash === prevout.hash
    && this.index === prevout.index;
};

/**
 * Compare against another outpoint (BIP69).
 * @param {Suboutpoint} prevout
 * @returns {Number}
 */

Suboutpoint.prototype.compare = function compare(prevout) {
  assert(Suboutpoint.isSuboutpoint(prevout));

  const cmp = util.strcmp(this.txid(), prevout.txid());

  if (cmp !== 0)
    return cmp;

  return this.index - prevout.index;
};

/**
 * Test whether the outpoint is null (hash of zeroes
 * with max-u32 index). Used to detect coinbases.
 * @returns {Boolean}
 */

Suboutpoint.prototype.isNull = function isNull() {
  return this.index === 0xffffffff && this.hash === encoding.NULL_HASH;
};

/**
 * Get little-endian hash.
 * @returns {Hash}
 */

Suboutpoint.prototype.rhash = function rhash() {
  return util.revHex(this.hash);
};

/**
 * Get little-endian hash.
 * @returns {Hash}
 */

Suboutpoint.prototype.txid = function txid() {
  return this.rhash();
};

/**
 * Serialize outpoint to a key
 * suitable for a hash table.
 * @returns {String}
 */

Suboutpoint.prototype.toKey = function toKey() {
  return Suboutpoint.toKey(this.hash, this.index);
};

/**
 * Inject properties from hash table key.
 * @private
 * @param {String} key
 * @returns {Suboutpoint}
 */

Suboutpoint.prototype.fromKey = function fromKey(key) {
  assert(key.length > 64);
  this.hash = key.slice(0, 64);
  this.index = parseInt(key.slice(64), 10);
  return this;
};

/**
 * Instantiate outpoint from hash table key.
 * @param {String} key
 * @returns {Suboutpoint}
 */

Suboutpoint.fromKey = function fromKey(key) {
  return new Suboutpoint().fromKey(key);
};

/**
 * Write outpoint to a buffer writer.
 * @param {BufferWriter} bw
 */

Suboutpoint.prototype.toWriter = function toWriter(bw) {
  bw.writeHash(this.hash);
  bw.writeU32(this.index);
  return bw;
};

/**
 * Calculate size of outpoint.
 * @returns {Number}
 */

Suboutpoint.prototype.getSize = function getSize() {
  return 36;
};

/**
 * Serialize outpoint.
 * @returns {Buffer}
 */


/**
 * Inject properties from serialized data.
 * @private
 * @param {Buffer} data
 */


Suboutpoint.fromReader = function fromReader(br) {
  return new Suboutpoint().fromReader(br);
};

/**
 * Instantiate outpoint from serialized data.
 * @param {Buffer} data
 * @returns {Suboutpoint}
 */

Suboutpoint.fromRaw = function fromRaw(data) {
  return new Suboutpoint().fromRaw(data);
};

/**
 * Inject properties from json object.
 * @private
 * @params {Object} json
 */

Suboutpoint.prototype.fromJSON = function fromJSON(json) {
  assert(json, 'Suboutpoint data is required.');
  assert(typeof json.hash === 'string', 'Hash must be a string.');
  assert(util.isU32(json.index), 'Index must be a uint32.');
  this.hash = util.revHex(json.hash);
  this.index = json.index;
  return this;
};

/**
 * Convert the outpoint to an object suitable
 * for JSON serialization. Note that the hash
 * will be reversed to abide by bitcoind's legacy
 * of little-endian uint256s.
 * @returns {Object}
 */

Suboutpoint.prototype.toJSON = function toJSON() {
  return {
    hash: util.revHex(this.hash),
    index: this.index
  };
};

/**
 * Instantiate outpoint from json object.
 * @param {Object} json
 * @returns {Suboutpoint}
 */

Suboutpoint.fromJSON = function fromJSON(json) {
  return new Suboutpoint().fromJSON(json);
};

/**
 * Inject properties from tx.
 * @private
 * @param {TX} tx
 * @param {Number} index
 */

Suboutpoint.prototype.fromTX = function fromTX(tx, index) {
  assert(tx);
  assert(typeof index === 'number');
  assert(index >= 0);
  this.hash = tx.hash('hex');
  this.index = index;
  return this;
};

/**
 * Instantiate outpoint from tx.
 * @param {TX} tx
 * @param {Number} index
 * @returns {Suboutpoint}
 */

Suboutpoint.fromTX = function fromTX(tx, index) {
  return new Suboutpoint().fromTX(tx, index);
};

/**
 * Serialize outpoint to a key
 * suitable for a hash table.
 * @param {Hash} hash
 * @param {Number} index
 * @returns {String}
 */

Suboutpoint.toKey = function toKey(hash, index) {
  assert(typeof hash === 'string');
  assert(hash.length === 64);
  assert(index >= 0);
  return hash + index;
};

/**
 * Convert the outpoint to a user-friendly string.
 * @returns {String}
 */

Suboutpoint.prototype.inspect = function inspect() {
  return `<Suboutpoint: ${this.rhash()}/${this.index}>`;
};

/**
 * Test an object to see if it is an outpoint.
 * @param {Object} obj
 * @returns {Boolean}
 */

Suboutpoint.isSuboutpoint = function isSuboutpoint(obj) {
  return obj instanceof Suboutpoint;
};

/*
 * Expose
 */

module.exports = Suboutpoint;
