'use strict';

/**
 *    DOCUMENT IN FOUR PARTS
 *
 *      PART 1: Difiiculty of the next block [COMPLETE]
 *
 *      PART 2: Mining a block hash [COMPLETE]
 *
 *      PART 3: Blockchain header proofs [IN PROGRESS]
 *
 *      PART 4: Create Block Collider Block Hash  [COMPLETE]
 *
 */
const crypto = require('crypto');
const similarity = require('compute-cosine-similarity');
const _ = require('lodash');
const BN = require('bn.js');

/**
 * FUNCTION: blake(str)
 *   Hashes a given string according to the Blake2b Lite format
 *
 * @param {String} str
 * @returns {String}
 */
function blake(str) {
  // This would be blake2bl found in utils/strings
  return crypto
    .createHash('sha256')
    .update(str)
    .digest('hex');
}

////////////////////////////////////////////////////////////////////////
///////////////////////////
///////////////////////////  PART 1  - Difiiculty of the next block
///////////////////////////
////////////////////////////////////////////////////////////////////////

/**
 * FUNCTION: getExpFactorDiff(t)
 *   Determines the singularity height and difficulty
 *
 * @param {BN|Difficulty} x
 * @param {Number} parentBlockHeight
 * @returns {BN|Difficulty}
 */
function getExpFactorDiff(x, parentBlockHeight) {
  const big1 = new BN(1, 16);
  const big2 = new BN(2, 16);
  const expDiffPeriod = new BN(66000000, 16);
  const periodCount = new BN(parentBlockHeight).add(big1);
  const periodCount = periodCount.div(expDiffPeriod);

  if (periodCount.gt(big2) === true) {
    y = periodCount.sub(big2);
    y = big2.pow(y);
    x = x.add(y);
    return x;
  }
  return x;
}

/**
 * FUNCTION: getDiff(t)
 *   Gets the difficulty of a given blockchain without singularity calculation
 *
 * @param {Number|Epoch} blockTime
 * @param {Number|Epoch} parentTime
 * @param {Number} parentDiff
 * @param {Number} minimumDiff
 * @param {Number} handicap
 * @returns {BN|Difficulty}
 */
function getDiff(blockTime, parentTime, parentDiff, minimumDiff, handicap) {
  // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2.md

  const bigParentTime = new BN(parentTime, 16);
  const bigParentDiff = new BN(parentDiff, 16);
  const bigBlockTime = new BN(blockTime, 16);
  let bigMinDiff = new BN(minimumDiff, 16);
  const bigMinus99 = new BN(-99, 16);
  const big10 = new BN(10, 16);
  const big7 = new BN(7, 16);
  const big5 = new BN(5, 16);
  const big4 = new BN(4, 16);
  const big3 = new BN(3, 16);
  const big2 = new BN(2, 16);
  const big1 = new BN(1, 16);
  const big0 = new BN(0, 16);
  const elapsedTime = bigBlockTime.sub(bigParentTime);
  const periodBounds = elapsedTime.div(big5);
  bigMinDiff = bigMinDiff.div(elapsedTime);

  let x;
  let y;

  x = bigBlockTime.sub(bigParentTime); // Get the window of time between bigBlockTime - bigParentTime
  x = x.div(big5); // Divide this difference by the seconds (in BN)
  x = big1.sub(x); // Move X to a negative / 0 val integer

  if (handicap !== undefined && handicap !== false) {
    x = x.add(new BN(handicap, 16));
  }

  if (x.lt(bigMinus99) === true) {
    x = bigMinus99;
  }

  if (x.eq(big0) === true && elapsedTime.gt(big7) === true) {
    x = x.sub(big1); // Move X to a negative factor
  } else if (x.gt(big0) === true) {
    x = x.mul(big5.sub(elapsedTime)).pow(big3); // Significantly decrease difficulty for slower blocks
  }

  y = bigParentDiff.div(bigMinDiff); // Divide the parent difficulty by the minimum difficulty
  x = x.mul(y); // Multiple the purposed difficulty by the mindiff bound
  x = x.add(bigParentDiff); // Add the previous parents difficulty to the purposed difficulty

  if (x.lt(bigMinDiff) == true) {
    x = bigMinDiff; // Force minimum difficulty
  }

  return x;
}

function main() {
  const currentTimestamp = (Date.now() / 1000) << 0;
  const parentColliderBlockTimestamp = currentTimestamp - 12345;

  const chains = ['bc', 'btc', 'eth', 'neo', 'wav', 'lsk'];
  let handicap = 0; // if BC address only, greatly increase difficulty (cataclysmic event)
  const parentColliderBlockDifficulty = new BN(141129464479256, 16); // Assumes parent's difficulty is 141129464479256
  const parentShareDiff = parentColliderBlockDifficulty.div(
    new BN(chains.length, 16),
  );
  const minimumDiff = new BN(11801972029393, 16).div(new BN(chains.length, 16)); // Standard deviation 100M cycles divided by the number of chains
  const blockColliderShareDiff = getDiff(
    currentTimestamp,
    parentColliderBlockTimestamp,
    minimumDiff,
    parentShareDiff,
  );

  const timestampEquality = [
    latestEthBlockTimestamp === parentEthBlockTimestamp,
    latestBtcBlockTimestamp === parentBtcBlockTimestamp,
    latestNeoBlockTimestamp === parentNeoBlockTimestamp,
    latestWavBlockTimestamp === parentWavBlockTimestamp,
    latestLskBlockTimestamp === parentLskBlockTimestamp,
  ];

  const values = [
    getDiff(
      latestEthBlockTimestamp,
      parentEthBlockTimestamp,
      parentShareDiff,
      minimumDiff,
    ),
    getDiff(
      latestBtcBlockTimestamp,
      parentBtcBlockTimestamp,
      parentShareDiff,
      minimumDiff,
    ),
    getDiff(
      latestNeoBlockTimestamp,
      parentNeoBlockTimestamp,
      parentShareDiff,
      minimumDiff,
    ),
    getDiff(
      latestWavBlockTimestamp,
      parentWavBlockTimestamp,
      parentShareDiff,
      minimumDiff,
    ),
    getDiff(
      latestLskBlockTimestamp,
      parentLskBlockTimestamp,
      parentShareDiff,
      minimumDiff,
    ),
  ];

  if (_.every(timestampEquality) === true) {
    // If none of the chains have increased in height
    handicap = 2;
  }

  values.push(blockColliderShareDiff); // Add the Block Collider's chain to the values

  const summedDiff = values.reduce(function(val, share) {
    // Sum each blockchains height
    return val.add(share);
  }, new BN());

  const preExpDiff = getDiff(
    currentTimestamp,
    parentColliderBlockTimestamp,
    summedDiff,
    handicap,
  ); // Calculate the final pre-singularity difficulty adjustment
  const dif = getExpFactorDiff(preExpDiff, blockColliderBlockHeight); // Final difficulty post-singularity calculators
}

////////////////////////////////////////////////////////////////////////
///////////////////////////
///////////////////////////  PART 2 - Mining a Block
///////////////////////////
////////////////////////////////////////////////////////////////////////

/**
 * The Blake2BL hash of the proof of a block
 */
const blockProofs = [
  '9b80fc5cba6238801d745ca139ec639924d27ed004c22609d6d9409f1221b8ce', // BTC
  '781ff33f4d7d36b3f599d8125fd74ed37e2a1564ddc3f06fb22e1b0bf668a4f7', // ETH
  'e0f0d5bc8d1fd6d98fc6d1487a2d59b5ed406940cbd33f2f5f065a2594ff4c48', // LSK
  'ef631e3582896d9eb9c9477fb09bf8d189afd9bae8f5a577c2107fd0760b022e', // WAV
  'e2d5d4f3536cdfa49953fb4a96aa3b4a64fd40c157f1b3c69fb84b3e1693feb0', // NEO
  '1f591769bc88e2307d207fc4ee5d519cd3c03e365fa16bf5f63f449b46d6cdef', // EMB (Block Collider)
];

/**
 * FUNCTION: split(t)
 *    Converts characters of string into ASCII codes
 *
 * @param {String} t
 * @returns {Number|Array}
 */
function split(t) {
  return t.split('').map(function(an) {
    return an.charCodeAt(0);
  });
}

/**
 * FUNCTION: dist(t)
 *    Converts cosine similary to cos distance
 *
 * @param {String} t
 * @returns {Number|Array}
 */
function dist(x, y, clbk) {
  let s;
  if (arguments.length > 2) {
    s = similarity(x, y, clbk);
  } else {
    s = similarity(x, y);
  }
  return s !== null ? 1 - s : s;
}

/**
 * FUNCTION: distance(a,b)
 *    Returns summed distances between two strings broken into of 8 bits
 *
 * @param {Hash} a
 * @param {Hash} b
 * @returns {Number}
 */
function distance(a, b) {
  const ac = _.chunk(split(a), 32);
  const bc = _.chunk(split(b), 32);

  const value = bc.reduce(function(all, bd, i) {
    return all + dist(bd, ac.pop());
  }, 0);

  return Math.floor(value * 1000000000000000); // TODO: Move to safe MATH
}

/**
 * FUNCTION: mine(work)
 *    Finds the mean of the distances from a provided set of hashed header proofs
 *
 * @param {Array} work
 * @returns {Object} dist,nonce
 */
function mine(work) {
  const nonce = String(Math.random());
  const nonceHash = blake(nonce); // SHA256 for demo only, move to  BLAKE2BL
  const mean = Math.floor(
    work.reduce(function(acc, a) {
      return acc + distance(a, nonceHash);
    }, 0) / work.length,
  );

  return {
    dist: mean,
    nonce: nonce,
  };
}

/**
 * FUNCTION: benchmark(work, seconds)
 *    Return the lowest distance threshold discovered during a period of seconds.
 *
 * @param {Array} work
 * @param {Number} seconds
 * @returns {Number}
 */
function benchmark(work, seconds) {
  const time = ((Date.now() / 1000) << 0) + seconds; // t0
  let best = false;

  while (((Date.now() / 1000) << 0) <= time) { // t1 > t0
    if (!best) {
      best = mine(work);
    } else {
      let candidate = mine(work);
      if (candidate.dist < best.dist) {
        best = candidate;
      }
    }
  }

  return best;
}

const bestDistance = benchmark(blockProofs); // Simulate mining and return the best score

////////////////////////////////////////////////////////////////////////
///////////////////////////
///////////////////////////  PART 3 - Blockchain Header Proofs
///////////////////////////
////////////////////////////////////////////////////////////////////////

/*
 * It will look like this:
 *
 *      function createBlockProof(blockchainFingerprint, rawBlock, callback)
 *
 * Where the fingerprint for Ethereum is "bbe5c469c469cec1f8c0b01de640df724f3d9053c23b19c6ed1bc6ee0faf5160"
 * as seen in bcnode/src/utils/templates/blockchain_fingerprints.json
 *
 */

////////////////////////////////////////////////////////////////////////
///////////////////////////
///////////////////////////  PART 4 - Create Block Collider Block Hash
///////////////////////////
////////////////////////////////////////////////////////////////////////

/**
 * Merkle root is created from:
 * - The transactions
 * - Miner public address
 * - Prev block collider block hash
 */
const merkleRoot =
  '2a0a02a1c21cfb827cdc5d7164d27f039953eb8dae76611b2fa11c9c94211989';

const hashes = [
  '9b80fc5cba6238801d745ca139ec639924d27ed004c22609d6d9409f1221b8ce', // BTC
  '781ff33f4d7d36b3f599d8125fd74ed37e2a1564ddc3f06fb22e1b0bf668a4f7', // ETH
  'e0f0d5bc8d1fd6d98fc6d1487a2d59b5ed406940cbd33f2f5f065a2594ff4c48', // LSK
  'ef631e3582896d9eb9c9477fb09bf8d189afd9bae8f5a577c2107fd0760b022e', // WAV
  'e2d5d4f3536cdfa49953fb4a96aa3b4a64fd40c157f1b3c69fb84b3e1693feb0', // NEO
];

hashes.push(merkleRoot); // Add the merkle root to the

const work = hashes.reduce(function(x, a) {
  return x.xor(new BN(Buffer.from(a, 'hex')));
}, new BN());

console.log(work.toString(16));

const BlockColliderBlockHash = blake(work.toString()); // Blake2bl of XOR'ed chains

main()
