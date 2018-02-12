/*!
 * cpuminer.js - inefficient cpu miner for bcoin (because we can)
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const assert = require('assert');
const util = require('../utils/util');
const co = require('../utils/co');
const AsyncObject = require('../utils/asyncobject');
const mine = require('./mine');
const Lock = require('../utils/lock');
const Logger = require('../node/logger');

function parse(str) {
    var args = [].slice.call(arguments, 1),
        i = 0;

    return str.replace(/%s/g, function() {
        return args[i++];
    });
}

/**
 * CPU miner.
 * @alias module:mining.CPUMiner
 * @constructor
 * @param {Miner} miner
 * @emits CPUMiner#block
 * @emits CPUMiner#status
 */

function CPUMiner(miner) {
  if (!(this instanceof CPUMiner))
    return new CPUMiner(miner);

  AsyncObject.call(this);

  this.miner = miner;
  this.network = this.miner.network;
  //this.logger = this.miner.logger.context('cpuminer');
 // this.logger = new Logger().context('cpuminer'); 
  this.workers = this.miner.workers;
  this.chain = this.miner.chain;
  this.locker = new Lock();

  this.running = false;
  this.stopping = false;
  this.job = null;
  this.stopJob = null;

  this.logger = {

    	info: function(msg){
			console.log(arguments);
    	},
    	debug: function(msg){
    		console.log(arguments);
    	},
    	warning: function(msg){
    		console.log(arguments);
    	},
        error: function(msg){
    		console.log(arguments);
    	}	
  }

  this._init();
}

Object.setPrototypeOf(CPUMiner.prototype, AsyncObject.prototype);

/**
 * Nonce range interval.
 * @const {Number}
 * @default
 */

CPUMiner.INTERVAL = 0xffffffff / 1500 | 0;

/**
 * Initialize the miner.
 * @private
 */

CPUMiner.prototype._init = function _init() {
  this.chain.on('tip', (tip) => {
    if (!this.job)
      return;

    if (this.job.attempt.prevBlock === tip.prevBlock)
      this.job.destroy();
  });
};

/**
 * Open the miner.
 * @method
 * @alias module:mining.CPUMiner#open
 * @returns {Promise}
 */

CPUMiner.prototype._open = async function _open() {
};

/**
 * Close the miner.
 * @method
 * @alias module:mining.CPUMiner#close
 * @returns {Promise}
 */

CPUMiner.prototype._close = async function _close() {
  await this.stop();
};

/**
 * Start mining.
 * @method
 */

CPUMiner.prototype.start = function start() {
  assert(!this.running, 'Miner is already running.');
  this._start().catch(() => {});
};

/**
 * Start mining.
 * @method
 * @private
 * @returns {Promise}
 */

CPUMiner.prototype._start = async function _start() {
  assert(!this.running, 'Miner is already running.');

  this.running = true;
  this.stopping = false;

  for (;;) {
    this.job = null;

    try {
      this.job = await this.createJob();
    } catch (e) {
      if (this.stopping)
        break;
      this.emit('error', e);
      break;
    }

    if (this.stopping)
      break;

    let block;
    try {
      block = await this.mineAsync(this.job);
    } catch (e) {
      if (this.stopping)
        break;
      this.emit('error', e);
      break;
    }

    if (this.stopping)
      break;

    if (!block)
      continue;

    let entry;
    try {
      entry = await this.chain.add(block);
    } catch (e) {
      if (this.stopping)
        break;

      if (e.type === 'VerifyError') {
        this.logger.warning('Mined an invalid block!');
        this.logger.error(e);
        continue;
      }

      this.emit('error', e);
      break;
    }

    if (!entry) {
      this.logger.warning('Mined a bad-prevblk (race condition?)');
      continue;
    }

    if (this.stopping)
      break;

    // Log the block hex as a failsafe (in case we can't send it).
    this.logger.info('Found block: %d (%s).', entry.height, entry.rhash());
    this.logger.debug('Raw: %s', block.toRaw().toString('hex'));

    this.emit('block', block, entry);
  }

  const job = this.stopJob;

  if (job) {
    this.stopJob = null;
    job.resolve();
  }
};

/**
 * Stop mining.
 * @method
 * @returns {Promise}
 */

CPUMiner.prototype.stop = async function stop() {
  const unlock = await this.locker.lock();
  try {
    return await this._stop();
  } finally {
    unlock();
  }
};

/**
 * Stop mining (without a lock).
 * @method
 * @returns {Promise}
 */

CPUMiner.prototype._stop = async function _stop() {
  if (!this.running)
    return;

  assert(this.running, 'Miner is not running.');
  assert(!this.stopping, 'Miner is already stopping.');

  this.stopping = true;

  if (this.job) {
    this.job.destroy();
    this.job = null;
  }

  await this.wait();

  this.running = false;
  this.stopping = false;
  this.job = null;
};

/**
 * Wait for `done` event.
 * @private
 * @returns {Promise}
 */

CPUMiner.prototype.wait = function wait() {
  return new Promise((resolve, reject) => {
    assert(!this.stopJob);
    this.stopJob = co.job(resolve, reject);
  });
};

/**
 * Create a mining job.
 * @method
 * @param {ChainEntry?} tip
 * @param {Address?} address
 * @returns {Promise} - Returns {@link Job}.
 */

CPUMiner.prototype.createJob = async function createJob(tip, address) {
  const attempt = await this.miner.createBlock(tip, address);
  return new CPUJob(this, attempt);
};

/**
 * Mine a single block.
 * @method
 * @param {ChainEntry?} tip
 * @param {Address?} address
 * @returns {Promise} - Returns [{@link Block}].
 */

CPUMiner.prototype.mineBlock = async function mineBlock(tip, address) {
  const job = await this.createJob(tip, address);
  return await this.mineAsync(job);
};

/**
 * Notify the miner that a new
 * tx has entered the mempool.
 */

CPUMiner.prototype.notifyEntry = function notifyEntry() {
  if (!this.running)
    return;

  if (!this.job)
    return;

  if (util.now() - this.job.start > 10) {
    this.job.destroy();
    this.job = null;
  }
};

/**
 * Hash until the nonce overflows.
 * @param {CPUJob} job
 * @returns {Number} nonce
 */

CPUMiner.prototype.findNonce = function findNonce(job) {
  const data = job.getHeader();
  const target = job.attempt.target;
  const interval = CPUMiner.INTERVAL;

  let min = 0;
  let max = interval;
  let nonce;

  while (max <= 0xffffffff) {
    nonce = mine(data, target, min, max);

    if (nonce !== -1)
      break;

    this.sendStatus(job, max);

    min += interval;
    max += interval;
  }

  return nonce;
};

/**
 * Hash until the nonce overflows.
 * @method
 * @param {CPUJob} job
 * @returns {Promise} Returns Number.
 */

CPUMiner.prototype.findNonceAsync = async function findNonceAsync(job) {
  if (!this.workers)
    return this.findNonce(job);

  const data = job.getHeader();
  const target = job.attempt.target;
  const interval = CPUMiner.INTERVAL;

  let min = 0;
  let max = interval;
  let nonce;

  while (max <= 0xffffffff) {
    nonce = await this.workers.mine(data, target, min, max);

    if (nonce !== -1)
      break;

    if (job.destroyed)
      return nonce;

    this.sendStatus(job, max);

    min += interval;
    max += interval;
  }

  return nonce;
};

/**
 * Mine synchronously until the block is found.
 * @param {CPUJob} job
 * @returns {Block}
 */

CPUMiner.prototype.mine = function mine(job) {
  job.start = util.now();

  let nonce;
  for (;;) {
    nonce = this.findNonce(job);

    if (nonce !== -1)
      break;

    job.updateNonce();

    this.sendStatus(job, 0);
  }

  return job.commit(nonce);
};

/**
 * Mine asynchronously until the block is found.
 * @method
 * @param {CPUJob} job
 * @returns {Promise} - Returns {@link Block}.
 */

CPUMiner.prototype.mineAsync = async function mineAsync(job) {
  let nonce;

  job.start = util.now();

  for (;;) {
    nonce = await this.findNonceAsync(job);

    if (nonce !== -1)
      break;

    if (job.destroyed)
      return null;

    job.updateNonce();

    this.sendStatus(job, 0);
  }

  return job.commit(nonce);
};

/**
 * Send a progress report (emits `status`).
 * @param {CPUJob} job
 * @param {Number} nonce
 */

CPUMiner.prototype.sendStatus = function sendStatus(job, nonce) {
  const attempt = job.attempt;
  const tip = util.revHex(attempt.prevBlock);
  const hashes = job.getHashes(nonce);
  const hashrate = job.getRate(nonce);

  this.logger.info(
    'Status: hashrate=%dkhs hashes=%d target=%d height=%d tip=%s',
    Math.floor(hashrate / 1000),
    hashes,
    attempt.bits,
    attempt.height,
    tip);

  this.emit('status', job, hashes, hashrate);
};

/**
 * Mining Job
 * @constructor
 * @ignore
 * @param {CPUMiner} miner
 * @param {BlockTemplate} attempt
 */

function CPUJob(miner, attempt) {
  this.miner = miner;
  this.attempt = attempt;
  this.destroyed = false;
  this.committed = false;
  this.start = util.now();
  this.nonce1 = 0;
  this.nonce2 = 0;
  this.refresh();
}

/**
 * Get the raw block header.
 * @param {Number} nonce
 * @returns {Buffer}
 */

CPUJob.prototype.getHeader = function getHeader() {
  const attempt = this.attempt;
  const n1 = this.nonce1;
  const n2 = this.nonce2;
  const time = attempt.time;
  const root = attempt.getRoot(n1, n2);
  const data = attempt.getHeader(root, time, 0);
  return data;
};

/**
 * Commit job and return a block.
 * @param {Number} nonce
 * @returns {Block}
 */

CPUJob.prototype.commit = function commit(nonce) {
  const attempt = this.attempt;
  const n1 = this.nonce1;
  const n2 = this.nonce2;
  const time = attempt.time;

  assert(!this.committed, 'Job already committed.');
  this.committed = true;

  const proof = attempt.getProof(n1, n2, time, nonce);

  return attempt.commit(proof);
};

/**
 * Mine block synchronously.
 * @returns {Block}
 */

CPUJob.prototype.mine = function mine() {
  return this.miner.mine(this);
};

/**
 * Mine block asynchronously.
 * @returns {Promise}
 */

CPUJob.prototype.mineAsync = function mineAsync() {
  return this.miner.mineAsync(this);
};

/**
 * Refresh the block template.
 */

CPUJob.prototype.refresh = function refresh() {
  return this.attempt.refresh();
};

/**
 * Increment the extraNonce.
 */

CPUJob.prototype.updateNonce = function updateNonce() {
  if (++this.nonce2 === 0x100000000) {
    this.nonce2 = 0;
    this.nonce1++;
  }
};

/**
 * Destroy the job.
 */

CPUJob.prototype.destroy = function destroy() {
  assert(!this.destroyed, 'Job already destroyed.');
  this.destroyed = true;
};

/**
 * Calculate number of hashes computed.
 * @param {Number} nonce
 * @returns {Number}
 */

CPUJob.prototype.getHashes = function getHashes(nonce) {
  const extra = this.nonce1 * 0x100000000 + this.nonce2;
  return extra * 0xffffffff + nonce;
};

/**
 * Calculate hashrate.
 * @param {Number} nonce
 * @returns {Number}
 */

CPUJob.prototype.getRate = function getRate(nonce) {
  const hashes = this.getHashes(nonce);
  const seconds = util.now() - this.start;
  return Math.floor(hashes / Math.max(1, seconds));
};

/**
 * Add a transaction to the block.
 * @param {TX} tx
 * @param {CoinView} view
 */

CPUJob.prototype.addTX = function addTX(tx, view) {
  return this.attempt.addTX(tx, view);
};

/**
 * Add a transaction to the block
 * (less verification than addTX).
 * @param {TX} tx
 * @param {CoinView?} view
 */

CPUJob.prototype.pushTX = function pushTX(tx, view) {
  return this.attempt.pushTX(tx, view);
};

/*
 * Expose
 */

module.exports = CPUMiner;

