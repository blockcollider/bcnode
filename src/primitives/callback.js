/*!
 * callback.js - transaction type 3
 * Copyright (c) 2018, Block Collider LLC. (MIT License)
 * https://github.com/blockcollider/bcnode
 */

'use strict'

var assert = require('assert')
var util = require('../utils/util')
var CInput = require('./cinput')
var COutput = require('./coutput')

function Callback (options) {
  if (!(this instanceof Callback)) return new Callback(options)

  this.type = 3
  this.root = null // hash of the public key of the signature creating the transaction
  this.inputs = [] // other call back requirements solved
  this.outputs = [] // new conditions to solve
  this.value = 0
  this.expire = 100 // An expiration claim can be made for this transaction can be made for this tx up to 100 after
  this.fiber = '3a'
  this.version = 1

  if (options) this.fromOptions(options)
}

Callback.prototype.fromOptions = function fromOptions (options) {
  if (options.version != null) {
    assert(util.isU32(options.version), 'Version must be a uint32.')
    this.version = options.version
  }

  if (options.expire != null) {
    assert(options.expire < 10000, 'Fiber is invalid.')
    this.expire = options.expire
  }

  if (options.fiber != null) {
    // assert(fiber.valid(options.fiber), 'Fiber is invalid.');
    this.fiber = options.fiber
  }

  if (options.inputs) {
    assert(Array.isArray(options.inputs), 'Inputs must be an array.')
    for (const input of options.inputs) this.inputs.push(new CInput(inputs))
  }

  if (options.outputs) {
    assert(Array.isArray(options.outputs), 'Outputs must be an array.')
    for (const output of options.outputs) this.outputs.push(new COutput(output))
  }

  return this
}

Callback.fromOptions = function fromOptions (options) {
  return new Callback().fromOptions(options)
}

exports = Callback
exports.Callback = Callback

module.exports = exports
