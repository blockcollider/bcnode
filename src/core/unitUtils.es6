/*!
 * unitUtils.esq - unit object for nrg
 * Copyright (c) 2018-2019, Block Collider (MIT License).
 * https://github.com/blockcollider/bcnode
 */

'use strict'

const BN = require('bn.js')

const unitMap = {
  'void': '0',
  'boson': '1',
  'kboson': '1000',
  'Kboson': '1000',
  'long': '1000',
  'weibetter': '1000',
  'mboson': '1000000',
  'Mboson': '1000000',
  'mcninch': '1000000',
  'gboson': '1000000000',
  'Gboson': '1000000000',
  'morley': '1000000000',
  'nano': '1000000000',
  'micro': '1000000000000',
  'milli': '1000000000000000',
  'nrg': '1000000000000000000',
  'knrg': '1000000000000000000000',
  'mnrg': '1000000000000000000000000',
  'gnrg': '1000000000000000000000000000',
  'tnrg': '1000000000000000000000000000000'
}

/**
 * Represents an NRG amount (boson internally).
 * @alias module:nrg.Unit
 * @constructor
 * @param {(String|Number)?} value
 * @param {String?} unit
 * @property {Unit} value
 */

function Unit (value, unit) {
  if (!(this instanceof Unit)) { return new Unit(value, unit) }

  this.unit = unit | 'boson'
  this.value = 0

  if (value != null) { this.fromOptions(value, unit) }
}

/**
 * Inject properties from options.
 * @private
 * @param {(String|Number)?} value
 * @param {String?} unit
 * @returns {Unit}
 */

Unit.prototype.fromOptions = function fromOptions (value, unit) {
  if (typeof unit === 'string') { return this.from(unit, value) }

  if (typeof value === 'number') { return this.fromValue(value) }

  return this.toBoson(value)
}

/**
 * Get boson value.
 * @returns {Unit}
 */

Unit.prototype.toValue = function toValue () {
  return this.value
}

/**
 * Returns true if object is string, otherwise false
 *
 * @method isString
 * @param {Object}
 * @return {Boolean}
 */
Unit.prototype.isString = function (object) {
  return typeof object === 'string' ||
        (object && object.constructor && object.constructor.name === 'String')
}

/**
 * Returns value of unit in Boson
 *
 * @method getValueOfUnit
 * @param {String} unit the unit to convert to, default nrg
 * @returns {BigNumber} value of the unit (in Boson)
 * @throws error if the unit is not correct:w
 */
Unit.prototype.getValueOfUnit = function (unit) {
  unit = unit ? unit.toLowerCase() : 'nrg'
  const unitValue = unitMap[unit]
  if (unitValue === undefined) {
    throw new Error('This unit doesn\'t exists, please use the one of the following units' + JSON.stringify(unitMap, null, 2))
  }
  return new BN(unitValue, 10)
}

/**
 * Takes a number of boson and converts it to any other NRG unit.
 *
 * Possible units are:
 *   SI Short   SI Full        Effigy       Other
 * - kwei       femtoether     babbage
 * - mwei       picoether      lovelace
 * - gwei       nanoether      shannon      nano
 * - --         microether     szabo        micro
 * - --         milliether     finney       milli
 * - ether      --             --
 * - kether                    --           grand
 * - mether
 * - gether
 * - tether
 *
 * @method fromBoson
 * @param {Number|String} number can be a number, number string or a HEX of a decimal
 * @param {String} unit the unit to convert to, default nrg
 * @return {String|Object} When given a BN object it returns one as well, otherwise a number
*/
Unit.prototype.fromBoson = function (number, unit) {
  let returnValue = this.toBN(number).div(new BN(this.getValueOfUnit(unit)))
  this.value = this.isBN(number) ? returnValue : returnValue.toString(10)
  return this
}

/**
 * Returns true if object is BigNumber, otherwise false
 *
 * @method isBigNumber
 * @param {Object}
 * @return {Boolean}
 */
Unit.prototype.isBN = function (object) {
  return (object && (object instanceof BN || (object.constructor && object.constructor.name === 'BN')))
}

/**
 * Takes an input and transforms it into an bignumber
 *
 * @method toBN
 * @param {Number|String|BigNumber} a number, string, HEX string or BigNumber
 * @return {BN} BN
*/
Unit.prototype.toBN = function (number) {
  /* jshint maxcomplexity:5 */
  number = number || 0
  if (this.isBN(number)) { return number }

  if (this.isString(number) && (number.indexOf('0x') === 0 || number.indexOf('-0x') === 0)) {
    return new BN(number.replace('0x', ''), 16)
  }

  return new BN(number.toString(10), 10)
}

/**
 * Get boson string or value.
 * @param {Boolean?} num
 * @returns {String|Unit}
 */

Unit.prototype.toBoson = function toBoson (number, unit) {
  let returnValue = this.toBN(number).mul(new BN(this.getValueOfUnit(unit)))
  this.value = this.isBN(number) ? returnValue : returnValue.toString(10)
  return this
}

/**
 * Get nrg string or value.
 * @param {Boolean?} num
 * @returns {String|Unit}
 */

Unit.prototype.toNRG = function toNRG (number) {
  let returnValue = this.toBN(number).mul(new BN(this.getValueOfUnit('nrg')))
  return this.isBN(number) ? returnValue : returnValue.toString(10)
}

/**
 * Inject properties from nrg.
 * @private
 * @param {Number|String} value
 * @returns {Unit}
 */

Unit.prototype.fromNRG = function fromNRG (value) {
  this.value = this.toBoson(value, 'nrg')
  return this
}

/**
 * Inject properties from unit.
 * @private
 * @param {String} unit
 * @param {Number|String} value
 * @returns {Unit}
 */

Unit.prototype.from = function from (unit, value) {
  if (unit === 'boson') {
    return this.fromBoson(value)
  }
  return this.fromBoson(value, unit)
}

/**
 * Instantiate amount from options.
 * @param {(String|Number)?} value
 * @param {String?} unit
 * @returns {Unit}
 */

Unit.fromOptions = function fromOptions (value, unit) {
  return new Unit().fromOptions(value, unit)
}

/**
 * Instantiate amount from boson.
 * @param {Number|String} value
 * @returns {Unit}
 */

Unit.fromBoson = function fromBoson (value) {
  return new Unit().fromBoson(value)
}

/**
 * Instantiate amount from nrg.
 * @param {Number|String} value
 * @returns {Unit}
 */

Unit.fromNRG = function fromNRG (value) {
  return new Unit().fromNRG(value)
}

/**
 * Instantiate amount from unit.
 * @param {String} unit
 * @param {Number|String} value
 * @returns {Unit}
 */

Unit.from = function from (unit, value) {
  return new Unit().from(unit, value)
}

/**
 * Inspect amount.
 * @returns {String}
 */

Unit.prototype.inspect = function inspect () {
  return `<Unit: ${this.toString()}>`
}

/**
 * Safely convert boson to a NRG string.
 * This function explicitly avoids any
 * floating point arithmetic.
 * @param {Unit} value - boson.
 * @returns {String} NRG string.
 */

Unit.nrg = function nrg (value) {
  return this.fromBoson(value, 'nrg')
}

/**
 * Safely convert NRG to a boson string.
 * This function explicitly avoids any
 * floating point arithmetic.
 * @param {Unit} value - boson.
 * @returns {String} NRG string.
 */

Unit.boson = function boson (value) {
  // TODO: how do we want to convert tthis to string
  return this.toBoson(value, 'nrg').toString()
}

module.exports = Unit
