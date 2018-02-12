/*!
 * digest.js - hash functions for bcoin
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

/**
 * @module crypto.digest
 */

const assert = require('assert');
const crypto = require('crypto');
const secp256k1 = require('secp256k1');
const native = require('../native').binding;
const POOL64 = Buffer.allocUnsafe(64);

/**
 * Hash with chosen algorithm.
 * @param {String} alg
 * @param {Buffer} data
 * @returns {Buffer}
 */

exports.hash = function hash(alg, data) {
  return crypto.createHash(alg).update(data).digest();
};

/**
 * Generate a secp256k1 compatible random key
 * @param {String} alg
 * @param {Buffer} data
 * @returns {Buffer}
 */

exports.randomPrivateKey = function randomPrivateKey() {
  let key;
  do {
    key = crypto.randomBytes(32);
  } while (!secp256k1.privateKeyVerify(key));
  return key;
};

/**
 * Hash with ripemd160.
 * @param {Buffer} data
 * @returns {Buffer}
 */

exports.ripemd160 = function ripemd160(data) {
  return exports.hash('ripemd160', data);
};

/**
 * Hash with sha1.
 * @param {Buffer} data
 * @returns {Buffer}
 */

exports.sha1 = function sha1(data) {
  return exports.hash('sha1', data);
};

/**
 * Hash with sha256.
 * @param {Buffer} data
 * @returns {Buffer}
 */

exports.sha256 = function sha256(data) {
  return exports.hash('sha256', data);
};

/**
 * Hash with sha256 and ripemd160 (OP_HASH160).
 * @param {Buffer} data
 * @returns {Buffer}
 */

exports.hash160 = function hash160(data) {
  return exports.ripemd160(exports.sha256(data));
};

/**
 * Hash with sha256 twice (OP_HASH256).
 * @param {Buffer} data
 * @returns {Buffer}
 */

exports.hash256 = function hash256(data) {
  return exports.sha256(exports.sha256(data));
};

/**
 * Hash left and right hashes with hash256.
 * @param {Buffer} left
 * @param {Buffer} right
 * @returns {Buffer}
 */

exports.root256 = function root256(left, right) {
  const data = POOL64;

  assert(left.length === 32);
  assert(right.length === 32);

  left.copy(data, 0);
  right.copy(data, 32);

  return exports.hash256(data);
};

/**
 * Create an HMAC.
 * @param {String} alg
 * @param {Buffer} data
 * @param {Buffer} key
 * @returns {Buffer} HMAC
 */

exports.hmac = function hmac(alg, data, key) {
  const ctx = crypto.createHmac(alg, key);
  return ctx.update(data).digest();
};

if (native) {
  exports.hash = native.hash;
  exports.hmac = native.hmac;
  exports.ripemd160 = native.ripemd160;
  exports.sha1 = native.sha1;
  exports.sha256 = native.sha256;
  exports.hash160 = native.hash160;
  exports.hash256 = native.hash256;
  exports.root256 = native.root256;
}
