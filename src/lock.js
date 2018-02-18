/*jslint node: true */

/*
 * Prevent multiple instances from running 
 */ 

"use strict";

if (global._BlockColliderInit)
    throw Error("Error: Running multiple instances of Block Collider");

global._BlockColliderInit = true;

/*
 * Limit the global event listeners 
 */ 

var EventEmitter = require('events').EventEmitter;

var eventEmitter = new EventEmitter();

eventEmitter.setMaxListeners(20);

module.exports = eventEmitter;
