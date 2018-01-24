
/*!
 * txagree.js - agreement data structure for transactions 
 * Copyright (c) 2018, Block Collider LLC. (MIT License)
 * https://github.com/blockcollider/bcnode
 */

'use strict';

const Script = require('../script/script');
const Outpoint = require("./suboutpoint.js");

function SubInput(options) {

    if (!(this instanceof SubInput))
        return new SubInput(options);

	this.prevSubOuput =  new Outpoint();
    this.script = new Script();
    this.sequence = 0xffffffff;

    if (options)
		this.fromOptions(options);

}


SubInput.prototype.fromOptions = function fromOptions(options) {
  assert(options, 'Agreement data is required.');

  if (options.script)
    this.script.fromOptions(options.script);

  return this;

};


exports = SubInput;
exports.SubInput = SubInput;;

module.exports = exports;
