/*!
 * output.js - output object for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const assert = require('assert');
const util = require('../utils/util');
const strings = require('../utils/strings');
const Converter = require('../utils/converter');
const Script = require('../script/script');
const Opcode = require('../script/opcode');
const Address = require('./address');
const Stack = require("./stack");
const Amount = Converter.nrg;

/**
 * Represents a transaction output.
 * @alias module:primitives.Output
 * @constructor
 * @param {NakedOutput} options
 * @property {Amount} value - Value in satoshis.
 * @property {Script} script
 */

function Output(options) {
  if (!(this instanceof Output))
    return new Output(options);

  this.version = 1;
  this.value = 0;
  this.script = new Script();
  //this.stack = new Stack();
  this.stack = false; 

  if (options)
    this.fromOptions(options);
}

/**
 * Inject properties from options object.
 * @private
 * @param {NakedOutput} options
 */

Output.prototype.fromOptions = function fromOptions(options) {
  assert(options, 'Output data is required.');
  if (options.version) {
    this.version = options.version;
  }

  if (options.value) {
    //TODO: Review implications of change.
    // uint64 limit removed for 9.8 billion
    //assert(util.isU64(options.value), 'Value must be a uint64.');
    this.value = options.value;
  }

  if (options.script)
    this.script.fromOptions(options.script);

  if (options.address)
    this.script.fromAddress(options.address);

  if (options.stack)
    this.stack = options.stack;

  return this;
};

/**
 * Instantiate output from options object.
 * @param {NakedOutput} options
 * @returns {Output}
 */

Output.fromOptions = function fromOptions(options) {
  return new Output().fromOptions(options);
};

/**
 * Add one or more stacks to a give transaction 
 * @private
 * @param {NakedOutput} options
 */

Output.prototype.setStack = function setStack(stack) {
  assert(stack, 'Stack data is required');

  if(!(stack instanceof Stack)){ 
    this.stack = new Stack(stack);
  } else {
    this.stack = stack;
  }

  this.script.pushOp("hashblake");
  this.script.pushData(strings.blake2blBuffer(this.stack.hash()));
  this.script.pushOp("verifystack");

  return this;

};

/**
 * Inject properties from script/value pair.
 * @private
 * @param {Script|Address} script
 * @param {Amount} value
 * @returns {Output}
 */

Output.prototype.fromScript = function fromScript(script, value) {
  if (typeof script === 'string')
    script = Address.fromString(script);

  if (script instanceof Address)
    script = Script.fromAddress(script);

  assert(script instanceof Script, 'Script must be a Script.');
  assert(util.isU64(value), 'Value must be a uint64.');

  this.script = script;
  this.value = value;

  return this;
};

Output.prototype.format = function format(coin) {
  if(this.stack && this.stack.outputs.length > 0) {
      return {
        type: this.getType(),
        value: Amount(this.value).toNRG(),
        stack: this.stack.format(),
        script: this.script,
        address: this.getAddress()
      }
  } else if(this.stack == false) {
      return {
        type: this.getType(),
        value: Amount(this.value).toNRG(),
        stack: new Stack(),
        script: this.script,
        address: this.getAddress()
      }
  } else {
    return this;
  }
};

/**
 * Instantiate output from script/value pair.
 * @param {Script|Address} script
 * @param {Amount} value
 * @returns {Output}
 */

Output.fromScript = function fromScript(script, value) {
  return new Output().fromScript(script, value);
};

/**
 * Clone the output.
 * @returns {Output}
 */

Output.prototype.clone = function clone() {
  const output = new Output();
  output.value = this.value;
  output.script.inject(this.script);
  return output;
};

/**
 * Test equality against another output.
 * @param {Output} output
 * @returns {Boolean}
 */

Output.prototype.equals = function equals(output) {
  assert(Output.isOutput(output));
  return this.value === output.value
    && this.script.equals(output.script);
};

/**
 * Compare against another output (BIP69).
 * @param {Output} output
 * @returns {Number}
 */

Output.prototype.compare = function compare(output) {
  assert(Output.isOutput(output));

  const cmp = this.value - output.value;

  if (cmp !== 0)
    return cmp;

  return this.script.compare(output.script);
};

/**
 * Get the script type as a string.
 * @returns {ScriptType} type
 */

Output.prototype.getType = function getType() {
  return Script.typesByVal[this.script.getType()].toLowerCase();
};

/**
 * Get the address.
 * @returns {Address} address
 */

Output.prototype.getAddress = function getAddress() {
  return this.script.getAddress();
};

/**
 * Get the address hash.
 * @param {String?} enc
 * @returns {Hash} hash
 */

Output.prototype.getHash = function getHash(enc) {
  const addr = this.getAddress();

  if (!addr)
    return null;

  return addr.getHash(enc);
};

/**
 * Convert the input to a more user-friendly object.
 * @returns {Object}
 */

Output.prototype.inspect = function inspect() {
  return {
    type: this.getType(),
    value: Amount(this.value).toNRG(),
    stack: this.stack,
    script: this.script,
    address: this.getAddress()
  };
};

/**
 * Convert the output to an object suitable
 * for JSON serialization.
 * @returns {Object}
 */

Output.prototype.toJSON = function toJSON() {
  return this.getJSON();
};

/**
 * Convert the output to an object suitable
 * for JSON serialization.
 * @param {Network} network
 * @returns {Object}
 */

Output.prototype.getJSON = function getJSON(network) {
  let addr = this.getAddress();

  //network = Network.get(network);

  //if (addr)
  //  addr = addr.toString(network);

  return {
    value: this.value,
    stack: this.stack.getJSON(),
    script: this.script.toJSON(),
    address: addr
  };
};

/**
 * Calculate the dust threshold for this
 * output, based on serialize size and rate.
 * @param {Rate?} rate
 * @returns {Amount}
 */

Output.prototype.getDustThreshold = function getDustThreshold(rate) {
  const scale = consensus.WITNESS_SCALE_FACTOR;

  if (this.script.isUnspendable())
    return 0;

  let size = this.getSize();

  if (this.script.isProgram()) {
    // TODO: Adjust to factor in read costs of stacks
    // 75% segwit discount applied to script size.
    size += 32 + 4 + 1 + (107 / scale | 0) + 4;
  } else {
    size += 32 + 4 + 1 + 107 + 4;
  }

  return 3 * policy.getMinFee(size, rate);
};

/**
 * Calculate size of serialized output.
 * @returns {Number}
 */

Output.prototype.getSize = function getSize() {
  return 8 + this.script.getVarSize();
};

/**
 * Test whether the output should be considered dust.
 * @param {Rate?} rate
 * @returns {Boolean}
 */

Output.prototype.isDust = function isDust(rate) {
  return this.value < this.getDustThreshold(rate);
};

/**
 * Inject properties from a JSON object.
 * @private
 * @param {Object} json
 */

Output.prototype.fromJSON = function fromJSON(json) {
  assert(json, 'Output data is required.');
  assert(util.isU64(json.value), 'Value must be a uint64.');
  this.value = json.value;
  this.script.fromJSON(json.script);
  return this;
};

/**
 * Instantiate an Output from a jsonified output object.
 * @param {Object} json - The jsonified output object.
 * @returns {Output}
 */

Output.fromJSON = function fromJSON(json) {
  return new Output().fromJSON(json);
};

/**
 * Write the output to a buffer writer.
 * @param {BufferWriter} bw
 */

Output.prototype.toWriter = function toWriter(bw) {
  bw.writeI64(this.value);
  bw.writeVarBytes(this.script.toRaw());

  if(this.stack && this.stack.outputs.length > 0){

    bw.writeVarint(this.stack.outputs.length);
    for (const output of this.stack.outputs)
      output.toWriter(bw);

  } 

  return bw;

};

/**
 * Serialize the output.
 * @param {String?} enc - Encoding, can be `'hex'` or null.
 * @returns {Buffer|String}
 */

Output.prototype.toRaw = function toRaw() {
  const size = this.getSize();
  return this.toWriter(new StaticWriter(size)).render();
};

/**
 * Inject properties from buffer reader.
 * @private
 * @param {BufferReader} br
 */

Output.prototype.fromReader = function fromReader(br) {
  this.value = br.readI64();
  this.script.fromRaw(br.readVarBytes());
  return this;
};

/**
 * Inject properties from serialized data.
 * @private
 * @param {Buffer} data
 */

Output.prototype.fromRaw = function fromRaw(data) {
  return this.fromReader(new BufferReader(data));
};

/**
 * Instantiate an output from a buffer reader.
 * @param {BufferReader} br
 * @returns {Output}
 */

Output.fromReader = function fromReader(br) {
  return new Output().fromReader(br);
};

/**
 * Instantiate an output from a serialized Buffer.
 * @param {Buffer} data
 * @param {String?} enc - Encoding, can be `'hex'` or null.
 * @returns {Output}
 */

Output.fromRaw = function fromRaw(data, enc) {
  if (typeof data === 'string')
    data = Buffer.from(data, enc);
  return new Output().fromRaw(data);
};

/**
 * Test an object to see if it is an Output.
 * @param {Object} obj
 * @returns {Boolean}
 */

Output.isOutput = function isOutput(obj) {
  return obj instanceof Output;
};

/*
 * Expose
 */

module.exports = Output;
