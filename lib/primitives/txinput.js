
/*!
 * txinput.js - input data structure for transactions 
 * Copyright (c) 2018, Block Collider LLC. (MIT License)
 * https://github.com/blockcollider/bcnode
 */

'use strict';

const Script = require('../script/src/script');
const Outpoint = require('./outpoint');

function TXInput(options) {

    if (!(this instanceof TXInput))
        return new TXInput(options);

    this.script = Script;
    this.sequence = 0xffffffff;
	this.prevClaim;

    if (options)
		this.fromOptions(options);

}


TXInput.prototype.fromOptions = function fromOptions(options) {
  assert(options, 'Input data is required.');

  if (options.script)
    this.script.fromOptions(options.script);

  return this;

};

TXInput.prototype.getType = function getType(coin){

  if (this.isCoinbase())
    return 'coinbase';

  if (coin)
    return coin.getType();

  let type;

  type = this.script.getInputType();

  return Script.typesByVal[type].toLowerCase();

}



exports = TXInput;
exports.TXInput = TXInput;

module.exports = exports;
