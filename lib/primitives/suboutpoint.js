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
 * @alias module:primitives.Claimpoint
 * @constructor
 * @param {Hash?} hash
 * @param {Number?} index
 * @property {Hash} hash
 * @property {Number} index
 */

function Claimpoint(hash, index) {
  if (!(this instanceof Claimpoint))
    return new Claimpoint(hash, index);

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

Claimpoint.prototype.fromOptions = function fromOptions(options) {
  assert(options, 'Claimpoint data is required.');
  assert(typeof options.hash === 'string', 'Hash must be a string.');
  assert(util.isU32(options.index), 'Index must be a uint32.');
  this.hash = options.hash;
  this.index = options.index;
  return this;
};

/**
 * Instantate outpoint from options object.
 * @param {Object} options
 * @returns {Claimpoint}
 */

Claimpoint.fromOptions = function fromOptions(options) {
  return new Claimpoint().fromOptions(options);
};

/**
 * Clone the outpoint.
 * @returns {Claimpoint}
 */

Claimpoint.prototype.clone = function clone() {
  const outpoint = new Claimpoint();
  outpoint.hash = this.value;
  outpoint.index = this.index;
  return outpoint;
};

/**
 * Test equality against another outpoint.
 * @param {Claimpoint} prevout
 * @returns {Boolean}
 */

Claimpoint.prototype.equals = function equals(prevout) {
  assert(Claimpoint.isClaimpoint(prevout));
  return this.hash === prevout.hash
    && this.index === prevout.index;
};

/**
 * Compare against another outpoint (BIP69).
 * @param {Claimpoint} prevout
 * @returns {Number}
 */

Claimpoint.prototype.compare = function compare(prevout) {
  assert(Claimpoint.isClaimpoint(prevout));

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

Claimpoint.prototype.isNull = function isNull() {
  return this.index === 0xffffffff && this.hash === encoding.NULL_HASH;
};

/**
 * Get little-endian hash.
 * @returns {Hash}
 */

Claimpoint.prototype.rhash = function rhash() {
  return util.revHex(this.hash);
};

/**
 * Get little-endian hash.
 * @returns {Hash}
 */

Claimpoint.prototype.txid = function txid() {
  return this.rhash();
};

/**
 * Serialize outpoint to a key
 * suitable for a hash table.
 * @returns {String}
 */

Claimpoint.prototype.toKey = function toKey() {
  return Claimpoint.toKey(this.hash, this.index);
};

/**
 * Inject properties from hash table key.
 * @private
 * @param {String} key
 * @returns {Claimpoint}
 */

Claimpoint.prototype.fromKey = function fromKey(key) {
  assert(key.length > 64);
  this.hash = key.slice(0, 64);
  this.index = parseInt(key.slice(64), 10);
  return this;
};

/**
 * Instantiate outpoint from hash table key.
 * @param {String} key
 * @returns {Claimpoint}
 */

Claimpoint.fromKey = function fromKey(key) {
  return new Claimpoint().fromKey(key);
};

/**
 * Write outpoint to a buffer writer.
 * @param {BufferWriter} bw
 */

Claimpoint.prototype.toWriter = function toWriter(bw) {
  bw.writeHash(this.hash);
  bw.writeU32(this.index);
  return bw;
};

/**
 * Calculate size of outpoint.
 * @returns {Number}
 */

Claimpoint.prototype.getSize = function getSize() {
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


Claimpoint.fromReader = function fromReader(br) {
  return new Claimpoint().fromReader(br);
};

/**
 * Instantiate outpoint from serialized data.
 * @param {Buffer} data
 * @returns {Claimpoint}
 */

Claimpoint.fromRaw = function fromRaw(data) {
  return new Claimpoint().fromRaw(data);
};

/**
 * Inject properties from json object.
 * @private
 * @params {Object} json
 */

Claimpoint.prototype.fromJSON = function fromJSON(json) {
  assert(json, 'Claimpoint data is required.');
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

Claimpoint.prototype.toJSON = function toJSON() {
  return {
    hash: util.revHex(this.hash),
    index: this.index
  };
};

/**
 * Instantiate outpoint from json object.
 * @param {Object} json
 * @returns {Claimpoint}
 */

Claimpoint.fromJSON = function fromJSON(json) {
  return new Claimpoint().fromJSON(json);
};

/**
 * Inject properties from tx.
 * @private
 * @param {TX} tx
 * @param {Number} index
 */

Claimpoint.prototype.fromTX = function fromTX(tx, index) {
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
 * @returns {Claimpoint}
 */

Claimpoint.fromTX = function fromTX(tx, index) {
  return new Claimpoint().fromTX(tx, index);
};

/**
 * Serialize outpoint to a key
 * suitable for a hash table.
 * @param {Hash} hash
 * @param {Number} index
 * @returns {String}
 */

Claimpoint.toKey = function toKey(hash, index) {
  assert(typeof hash === 'string');
  assert(hash.length === 64);
  assert(index >= 0);
  return hash + index;
};

/**
 * Convert the outpoint to a user-friendly string.
 * @returns {String}
 */

Claimpoint.prototype.inspect = function inspect() {
  return `<Claimpoint: ${this.rhash()}/${this.index}>`;
};

/**
 * Test an object to see if it is an outpoint.
 * @param {Object} obj
 * @returns {Boolean}
 */

Claimpoint.isClaimpoint = function isClaimpoint(obj) {
  return obj instanceof Claimpoint;
};

/*
 * Expose
 */

module.exports = Claimpoint;
