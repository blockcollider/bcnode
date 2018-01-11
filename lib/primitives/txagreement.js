
/*!
 * txagreement.js - agreement data structure for transactions 
 * Copyright (c) 2018, Block Collider LLC. (MIT License)
 * https://github.com/blockcollider/bcnode
 */

'use strict';

const Script = require('../script/src/script');
const Claimpoint = require("./claimpoint.js");

function TXAgreement(options) {

    if (!(this instanceof TXAgreement))
        return new TXAgreement(options);

	this.prevclaim =  new Claimpoint();
    this.script = Script;
    this.sequence = 0xffffffff;
    this.value;

    if (options)
		this.fromOptions(options);

}


TXAgreement.prototype.fromOptions = function fromOptions(options) {
  assert(options, 'Agreement data is required.');

  if (options.script)
    this.script.fromOptions(options.script);

  return this;

};


exports = TXAgreement;
exports.TXAgreement = TXAgreement;

module.exports = exports;
