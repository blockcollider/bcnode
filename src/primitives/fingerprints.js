/*!
 * fingerprints.js - fingerprints object for bcoin
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const assert = require('assert');
const util = require('../utils/util');
const encoding = require('../utils/encoding');
const hashes = require('../crypto/hashes');
const templateFingerprints = require('../utils/templates/blockchain_fingerprints');

/**
 * Represents blockchain fingerprints.
 * @alias module:primitives.Fingerprints
 * @constructor
 * @param {Name?} name
 */

function Fingerprints(name, file) {
  if (!(this instanceof Fingerprints))
    return new Fingerprints(name, file);

  let data = templateFingerprints;

  if (file) {
    data = require(file);
    assert(typeof data === 'array', 'Fingerprints data must be an array');
  }

  if (name != null) {

    const key = name.toLowerCase();
    const query = data.reduce(function(result, fingerprint){

       if(result === false){
          if(fingerprint.key === key){
              result = fingerprint; 
          } else if(fingerprint.name === key){
              result = fingerprint;
          }
        }

        return result;

      }, false);

      this.fromBlocks(query);

      if(query) {
        for (let k in query) { this[k] = query[k]; }
      } else {
        throw new Error("Unable to find fingerprint by name or key for '"+name+"'"); 
      }

  } 

}

/**
 * Inject properties from options object.
 * @private
 * @param {Object} options
 */

Fingerprints.prototype.fromOptions = function fromOptions(options) {
  assert(options, 'Fingerprints data is required.');
  assert(typeof options.hash === 'string', 'Hash must be a string.');
  for (let k in options) { this[k] = options[k]; }
  return this;
};

/**
 * Instantate fingerprints from options object.
 * @param {Object} options
 * @returns {Fingerprints}
 */

Fingerprints.fromOptions = function fromOptions(options) {
  return new Fingerprints().fromOptions(options);
};

/**
 * Create fingerprint from fingerprint blocks
 * @param {Object} options
 */

Fingerprints.prototype.fromBlocks = function fromBlocks(b) {

  assert(b, 'Fingerprints data is required');
  let blocks = b;
  let template = {
      "name":"",
      "description":"",
      "version": 1
  }

  if (typeof b === 'object' && Array.isArray(b) === false) {
    assert(b.fingerprint, 'Unable to parse Fingerprint data from object');
    blocks = b.fingerprint;
    for (let k in b) { template[k] = b[k]; }
  }

  const ordered = blocks.sort(function(a, b){
      if(a.height < b.height){
        return -1;
      } else if(b.height < a.height){
        return 1;
      }
      return 0;
  });

  const hash = ordered.reduce(function(all, item){
      return hashes.blake2bl(item.hash + item.data + item.height + all, "hex"); 
  }, "");

  template.hash = hash;
  template.fingerprint = ordered;

  for (let k in template) { this[k] = template[k]; }

  return this;

};

/**
 * Instantiate fingerprints from blocks array.
 * @param {Array} blocks
 * @returns {Fingerprint}
 */

Fingerprints.fromBlocks = function fromBlocks(blocks) {
  return new Fingerprints().fromBlocks(blocks);
};

/**
 * Clone the fingerprints.
 * @returns {Fingerprints}
 */

Fingerprints.prototype.clone = function clone() {
  const fingerprints = new Fingerprints();
  fingerprints.hash = this.value;
  fingerprints.index = this.index;
  return fingerprints;
};

/**
 * Test equality against another fingerprint.
 * @param {Fingerprints} prevout
 * @returns {Boolean}
 */

Fingerprints.prototype.equals = function equals(prevout) {
  assert(Fingerprints.isFingerprints(prevout));
  return this.hash === prevout.hash
    && this.index === prevout.index;
};

/**
 * Test whether the fingerprints is null (hash of zeroes
 * with max-u32 index). Used to detect coinbases.
 * @returns {Boolean}
 */

Fingerprints.prototype.isNull = function isNull() {
  return this.index === 0xffffffff && this.hash === encoding.NULL_HASH;
};

/**
 * Get little-endian hash.
 * @returns {Hash}
 */

Fingerprints.prototype.rhash = function rhash() {
  return util.revHex(this.hash);
};

/**
 * Get little-endian hash.
 * @returns {Hash}
 */

Fingerprints.prototype.txid = function txid() {
  return this.hash;
};

/**
 * Serialize fingerprints to a key
 * suitable for a hash table.
 * @returns {String}
 */

Fingerprints.prototype.toKey = function toKey() {
  return Fingerprints.toKey(this.hash, this.index);
};

/**
 * Inject properties from hash table key.
 * @private
 * @param {String} key
 * @returns {Fingerprints}
 */

Fingerprints.prototype.fromKey = function fromKey(key) {
  assert(key.length > 64);
  this.hash = key.slice(0, 64);
  this.index = parseInt(key.slice(64), 10);
  return this;
};

/**
 * Instantiate fingerprints from hash table key.
 * @param {String} key
 * @returns {Fingerprints}
 */

Fingerprints.fromKey = function fromKey(key) {
  return new Fingerprints().fromKey(key);
};

/**
 * Write fingerprints to a buffer writer.
 * @param {BufferWriter} bw
 */

Fingerprints.prototype.toWriter = function toWriter(bw) {
  bw.writeHash(this.hash);
  bw.writeU32(this.index);
  return bw;
};

/**
 * Calculate size of fingerprints.
 * @returns {Number}
 */

Fingerprints.prototype.getSize = function getSize() {
  return 36;
};

/**
 * Serialize fingerprints.
 * @returns {Buffer}
 */


/**
 * Inject properties from serialized data.
 * @private
 * @param {Buffer} data
 */


Fingerprints.fromReader = function fromReader(br) {
  return new Fingerprints().fromReader(br);
};

/**
 * Instantiate fingerprints from serialized data.
 * @param {Buffer} data
 * @returns {Fingerprints}
 */

Fingerprints.fromRaw = function fromRaw(data) {
  return new Fingerprints().fromRaw(data);
};

/**
 * Inject properties from json object.
 * @private
 * @params {Object} json
 */

Fingerprints.prototype.fromJSON = function fromJSON(json) {
  assert(json, 'Fingerprints data is required.');
  assert(typeof json.hash === 'string', 'Hash must be a string.');
  for (let k in json) { this[k] = json[k]; }
  return this;
};

/**
 * Convert the fingerprints to an object suitable
 * for JSON serialization. Note that the hash
 * will be reversed to abide by bitcoind's legacy
 * of little-endian uint256s.
 * @returns {Object}
 */

Fingerprints.prototype.toJSON = function toJSON() {
  return {
    hash: util.revHex(this.hash),
    index: this.index
  };
};

/**
 * Instantiate fingerprints from json object.
 * @param {Object} json
 * @returns {Fingerprints}
 */

Fingerprints.fromJSON = function fromJSON(json) {
  return new Fingerprints().fromJSON(json);
};

/**
 * Inject properties from tx.
 * @private
 * @param {TX} tx
 * @param {Number} index
 */

Fingerprints.prototype.fromTX = function fromTX(tx, index) {
  assert(tx);
  assert(typeof index === 'number');
  assert(index >= 0);
  this.hash = tx.hash('hex');
  this.index = index;
  return this;
};

/**
 * Instantiate fingerprints from tx.
 * @param {TX} tx
 * @param {Number} index
 * @returns {Fingerprints}
 */

Fingerprints.fromTX = function fromTX(tx, index) {
  return new Fingerprints().fromTX(tx, index);
};

/**
 * Serialize fingerprints to a key
 * suitable for a hash table.
 * @param {Hash} hash
 * @param {Number} index
 * @returns {String}
 */

Fingerprints.toKey = function toKey(hash, index) {
  assert(typeof hash === 'string');
  assert(hash.length === 64);
  assert(index >= 0);
  return hash + index;
};

/**
 * Convert the fingerprints to a user-friendly string.
 * @returns {String}
 */

Fingerprints.prototype.inspect = function inspect() {
  return `<Fingerprint: ${this.name} / ${this.hash}>`;
};

/**
 * Test an object to see if it is an fingerprints.
 * @param {Object} obj
 * @returns {Boolean}
 */

Fingerprints.isFingerprint = function isFingerprints(obj) {
  return obj instanceof Fingerprints;
};

/*
 * Expose
 */

module.exports = Fingerprints;
