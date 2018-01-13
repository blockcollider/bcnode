
/*!
 * txagree.js - agreement data structure for transactions 
 * Copyright (c) 2018, Block Collider LLC. (MIT License)
 * https://github.com/blockcollider/bcnode
 */

'use strict';

const Script = require('../script/script');
const Claimpoint = require("./claimpoint.js");

function TXAgree(options) {

    if (!(this instanceof TXAgree))
        return new TXAgree(options);

	this.prevclaim =  new Claimpoint();
    this.script = new Script();
    this.sequence = 0xffffffff;

    if (options)
		this.fromOptions(options);

}


TXAgree.prototype.fromOptions = function fromOptions(options) {
  assert(options, 'Agreement data is required.');

  if (options.script)
    this.script.fromOptions(options.script);

  return this;

};


exports = TXAgree;
exports.TXAgree = TXAgree;

module.exports = exports;
