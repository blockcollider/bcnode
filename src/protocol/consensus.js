/*!
 * consensus.js - consensus constants and helpers for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

/**
 * @module protocol/consensus
 */

const assert = require('assert');
const BN = require('bn.js');

/**
 * One NRG in sparks.
 * @const {Amount}
 * @default
 */

exports.COIN = 100000000000;

/**
 * Maximum amount of money in sparks:
 * `9.8billion * 1NRG` (consensus).
 * @const {Amount}
 * @default
 */

exports.MAX_MONEY = 9849998928 * exports.COIN;

/**
 * Defrag chain window 
 * @const {Amount}
 * @default
 */

exports.DEFRAG_RATE = 1000000;

/**
 * Base block subsidy (consensus).
 * @const {Amount}
 * @default
 */

exports.BASE_REWARD = 100 * exports.COIN;

/**
 * Boson reward block subsidy 
 * @const {Amount}
 * @default
 */

exports.BOSON_REWARD = 10000 * exports.COIN;

/**
 * Reward halves every 50m blocks. 
 * 5 seconds 7.9 years
 * 3 seconds 4.8 years
 * 1.5 seconds 2.8 years
 * @const {Amount}
 * @default
 */

exports.BASE_REWARD_INTERVAL = 50000000;

/**
 * Half base block subsidy. Required to
 * calculate the reward properly (with
 * only 32 bit shifts available).
 * @const {Amount}
 * @default
 */

exports.HALF_BASE_REWARD = Math.floor(exports.BASE_REWARD / 2);

/**
 * Half base Boson block subsidy. 
 * @const {Amount}
 * @default
 */

exports.HALF_BOSON_REWARD = Math.floor(exports.BOSON_REWARD / 2);

/**
 * TODO: Refactor for Edit Distance Bonus
 */

exports.MAX_BLOCK_SIZE = 1000000;

/**
 * TODO: Refactor for Edit Distance Bonus 
 * @const {Number}
 * @default
 */

exports.MAX_RAW_BLOCK_SIZE = 4000000;

/**
 * TODO: Refactor for Edit Distance Bonus 
 * @const {Number}
 * @default
 */

exports.MAX_BLOCK_WEIGHT = 4000000;

/**
 * Maximum block sigops (consensus).
 * @const {Number}
 * @default
 */

exports.MAX_BLOCK_SIGOPS = 1000000 / 50;

/**
 * Maximum block sigops cost (consensus).
 * @const {Number}
 * @default
 */

exports.MAX_BLOCK_SIGOPS_COST = 80000;

/**
 * What bits to set in version
 * for versionbits blocks.
 * @const {Number}
 * @default
 */

exports.VERSION_TOP_BITS = 0x20000000;

/**
 * What bitmask determines whether
 * versionbits is in use.
 * @const {Number}
 * @default
 */

exports.VERSION_TOP_MASK = 0xe0000000;

/**
 * Number of blocks before a coinbase
 * spend can occur (consensus). Assumes block time delay is 5 seconds * 500 == 41 minutes.
 * @const {Number}
 * @default
 */

exports.COINBASE_MATURITY = 500;

/**
 * TODO: Remove
 * @const {Number}
 * @default
 */

exports.WITNESS_SCALE_FACTOR = 4;

/**
 * nLockTime threshold for differentiating
 * between height and time (consensus).
 * Tue Nov 5 00:53:20 1985 UTC
 * @const {Number}
 * @default
 */

exports.LOCKTIME_THRESHOLD = 500000000;

/**
 * Highest nSequence bit -- disables
 * sequence locktimes (consensus).
 * @const {Number}
 */

exports.SEQUENCE_DISABLE_FLAG = (1 << 31) >>> 0;

/**
 * Sequence time: height or time (consensus).
 * @const {Number}
 * @default
 */

exports.SEQUENCE_TYPE_FLAG = 1 << 22;

/**
 * Sequence granularity for time (consensus).
 * @const {Number}
 * @default
 */

exports.SEQUENCE_GRANULARITY = 9;

/**
 * Sequence mask (consensus).
 * @const {Number}
 * @default
 */

exports.SEQUENCE_MASK = 0x0000ffff;

/**
 * Max serialized script size (consensus).
 * @const {Number}
 * @default
 */

exports.MAX_SCRIPT_SIZE = 10000;

/**
 * Max stack size during execution (consensus).
 * @const {Number}
 * @default
 */

exports.MAX_SCRIPT_STACK = 1000;

/**
 * Max script element size (consensus).
 * @const {Number}
 * @default
 */

exports.MAX_SCRIPT_PUSH = 520;

/**
 * Max opcodes executed (consensus).
 * @const {Number}
 * @default
 */

exports.MAX_SCRIPT_OPS = 201;

/**
 * Max `n` value for multisig (consensus).
 * @const {Number}
 * @default
 */

exports.MAX_MULTISIG_PUBKEYS = 20;

/**
 * The date bip16 (p2sh) was activated (consensus).
 * @const {Number}
 * @default
 */

exports.BIP16_TIME = 1333238400;

/**
 * Convert a compact number to a big number.
 * Used for `block.bits` -> `target` conversion.
 * @param {Number} compact
 * @returns {BN}
 */

exports.fromCompact = function fromCompact(compact) {
  if (compact === 0)
    return new BN(0);

  const exponent = compact >>> 24;
  const negative = (compact >>> 23) & 1;

  let mantissa = compact & 0x7fffff;
  let num;

  if (exponent <= 3) {
    mantissa >>>= 8 * (3 - exponent);
    num = new BN(mantissa);
  } else {
    num = new BN(mantissa);
    num.iushln(8 * (exponent - 3));
  }

  if (negative)
    num.ineg();

  return num;
};

/**
 * Convert a big number to a compact number.
 * Used for `target` -> `block.bits` conversion.
 * @param {BN} num
 * @returns {Number}
 */

exports.toCompact = function toCompact(num) {
  if (num.isZero())
    return 0;

  let exponent = num.byteLength();
  let mantissa;

  if (exponent <= 3) {
    mantissa = num.toNumber();
    mantissa <<= 8 * (3 - exponent);
  } else {
    mantissa = num.ushrn(8 * (exponent - 3)).toNumber();
  }

  if (mantissa & 0x800000) {
    mantissa >>= 8;
    exponent++;
  }

  let compact = (exponent << 24) | mantissa;

  if (num.isNeg())
    compact |= 0x800000;

  compact >>>= 0;

  return compact;
};

/**
 * Verify proof-of-work.
 * @param {Hash} hash
 * @param {Number} bits
 * @returns {Boolean}
 */

exports.verifyPOW = function verifyPOW(hash, bits) {
  const target = exports.fromCompact(bits);

  if (target.isNeg() || target.isZero())
    return false;

  const num = new BN(hash, 'le');

  if (num.gt(target))
    return false;

  return true;
};

/**
 * Verify proof-of-distance.
 * @param {Hash} hash
 * @param {Number} bits
 * @returns {Boolean}
 */

exports.verifyPOD = function verifyPOD(hash, bits) {
  const target = exports.fromCompact(bits);

  if (target.isNeg() || target.isZero())
    return false;

  const num = new BN(hash, 'le');

  if (num.gt(target))
    return false;

  return true;
};

/**
 * Verify proof-of-edit-distance.
 * @param {Proof} hash
 * @param {Base Hash} hash
 * @returns {Boolean}
 */

exports.verifyPOED = function verifyPOED(work, data) {
  return true;
};

/**
 * Calculate block subsidy.
 * Fix shift
 * @param {Number} height - Reward era by height.
 * @returns {Amount}
 */

exports.getReward = function getReward(height, interval) {
  assert(height >= 0, 'Bad height for reward.');

  if(!interval)
        interval = exports.BASE_REWARD_INTERVAL;

  let halvings = Math.floor(height / interval);

  if (halvings >= 100)
    return 0;

  if (halvings === 0)
    return exports.BASE_REWARD;

  let reward = ((exports.BASE_REWARD / exports.COIN) >>> halvings); 

  return reward * exports.COIN; 

};

/**
 * Test version bit.
 * @param {Number} version
 * @param {Number} bit
 * @returns {Boolean}
 */

exports.hasBit = function hasBit(version, bit) {
  const TOP_MASK = exports.VERSION_TOP_MASK;
  const TOP_BITS = exports.VERSION_TOP_BITS;
  const bits = (version & TOP_MASK) >>> 0;
  const mask = 1 << bit;
  return bits === TOP_BITS && (version & mask) !== 0;
};
