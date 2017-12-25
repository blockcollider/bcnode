/*!
 * tx.js - transaction generator 
 * Copyright (c) 2018, Block Collider LLC. (MIT License)
 * https://github.com/blockcollider/bcnode
 */

'use strict';

var assert = require('assert');
var util = require('../utils/util');


function Tx(options) {

  if (!(this instanceof Tx))
    return new Tx(options);

  this.inputs = [];
  this.outputs = [];	
  this.version = 1;
  this.type = 1;  // 1 = core, 2 = promise, 3 = callback, 66 = rootstock, etc... 

  if(options)
     this.fromOptions(options); 
	
}

Tx.prototype.fromOptions = function fromOptions(options){

    var acceptedTypes = [1,2,3,66];

    if(options.type == null){
      assert(util.isU32(options.version), 'Type must be a uint32.');
    }

    if(acceptedTypes.indexOf(options.type) > -1){
      this.type = options.type;
    }

    if (options.version != null) {
      assert(util.isU32(options.version), 'Version must be a uint32.');
      this.version = options.version;
    }

    if (options.inputs) {
      assert(Array.isArray(options.inputs), 'Inputs must be an array.');
      for (const input of options.inputs)
        this.inputs.push(new Input(input));
    }

    if (options.outputs) {
      assert(Array.isArray(options.outputs), 'Outputs must be an array.');
      for (const output of options.outputs)
        this.outputs.push(new Output(output));
    }

    return this;

}

Tx.fromOptions = function fromOptions(options) {
   return new Tx().fromOptions(options);
};

exports = Tx;
exports.Tx = Tx;

module.exports = exports;


