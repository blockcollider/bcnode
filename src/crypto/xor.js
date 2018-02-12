/* eslint no-bitwise: "off" */

/**
 * @author Thomas Champagne
 * @description Simple mixing symetric cryptography node module based on XOR
 * @see https://en.wikipedia.org/wiki/XOR_cipher
 */

const cryptoXor = {};

/**
* @description Encode XOR method
* @param {string} plainString - Plain text data to be encoded
* @param {string} key - Crypt key used to XOR plainString
* @returns {string} Cypher text
*/

cryptoXor.encode = function encode(plainString, key) {
  var cypher = '';
  var i;
  var keyPointer;
  var dec;
  var hex;
  for (i = 0; i < plainString.length; i += 1) {
    // Find ascii code from key to be "xor"
    keyPointer = i % key.length;
    // Convert char to int ASCII and "xor crypt" with int ASCII
    dec = (plainString[i]).charCodeAt(0) ^ (key[keyPointer]).charCodeAt(0);
    dec = parseInt(dec);
    // HEX convert
    hex = dec.toString(16);
    // '0' Padding
    hex = ('00' + hex).slice('-2');
    // Append to cypher string
    cypher += hex;
  }
  return cypher;
};

/**
 * @description Decode XOR method
 * @param {string} cypherString - Cypher string to be decoded
 * @param {string} key - Crypt key used to XOR cypherString
 * @returns {string} Plain text
 */

cryptoXor.decode = function decode(cypherString, key) {
  var plainText = '';
  var cypherArray = [];
  var i;
  var hex;
  var dec;
  var keyPointer;
  var asciiCode;
  // Group cypher by 2 hex char (16bits) into array
  for (i = 0; i < cypherString.length; i += 2) {
    cypherArray.push(cypherString[i] + cypherString[i + 1]);
  }
  // XOR Decrypt with provided cypher text and key
  for (i = 0; i < cypherArray.length; i += 1) {
    hex = cypherArray[i];
    dec = parseInt(hex, 16);
    keyPointer = i % key.length;
    asciiCode = dec ^ (key[keyPointer]).charCodeAt(0);
    plainText += String.fromCharCode(asciiCode);
  }
  return plainText;
};

module.exports = cryptoXor;
