/* eslint no-bitwise: "off" */
/* eslint no-var: "off" */
/* eslint no-param-reassign: "off" */

const keccak = require('keccak/js');
const crypto = require('crypto');
const secp256k1 = require('secp256k1');
const uuid = require('node-uuid');
const btoa = require('btoa');
const avon = require('avon');
const ICAP = require('ethereumjs-icap');

function stringError(str, msg) {
  if (str === undefined || str.constructor !== String) return Error(msg);
  return null;
}

const strings = {
  isHex(str) {
    if (str.length % 2 === 0 && str.match(/^[0-9a-f]+$/i)) return true;
    return false;
  },

  isBase64(str) {
    var index;
    if (str.length % 4 > 0 || str.match(/[^0-9a-z+\/=]/i)) return false;
    index = str.indexOf('=');
    if (index === -1 || str.slice(index).match(/={1,2}/)) return true;
    return false;
  },

  str2buf(str, enc) {
    if (!str || str.constructor !== String) return str;
    if (!enc && strings.isHex(str)) enc = 'hex';
    if (!enc && strings.isBase64(str)) enc = 'base64';
    return Buffer.from(str, enc);
  },

  swapOrder(str) {
    var split = str.split('').reverse();
    var x = '';
    for (var i = 0; i < split.length; i += 2) {
      x += split[i + 1] + split[i];
    }
    return x;
  },

  blake2b_base(str,  outputStyle) {
    if (str === undefined || str.constructor !== String) {
      return Error('failed to create blake2b of string');
    }
    // here should set some hard flag for if machine architecture is 64 bit / multi core
    // avon.ALGORITHMS.B  // avon.ALGORITHMS.BP
    const result = avon.sumBuffer(new Buffer(str), avon.ALGORITHMS.BP);
    // don't repeat yourself -- allow multiple output styles
    switch (outputStyle) {
      case 'hex':
        return result.toString('hex');
      case 'lite':
        return result.toString('hex').slice(64, 128);
      case 'light-sha1':
        return result.toString('hex').slice(88, 128);
      default:
        return result;
    }
  },

  blake2bb(str) { return strings.blake2b_base(str); },
  blake2b(str) { return strings.blake2b_base(str, 'hex'); },
  blake2bl(str) { return strings.blake2b_base(str, 'lite'); },
  blake2bls(str) { return strings.blake2b_base(str, 'lite-sha1'); },

  blake2bBuffer(buf) {
    return avon.sumBuffer(buf, avon.ALGORITHMS.B).toString('hex');
  },

  blake2s(str) {
    // here should set some hard flag for if machine architecture is 64 bit / multi core
    // avon.ALGORITHMS.S  // avon.ALGORITHMS.SP
    return stringError(str, 'failed to create blake2s of string') ||
      avon.sumBuffer(new Buffer(str), avon.ALGORITHMS.SP).toString('hex');
  },

  privateKeyToAddress(priv) {
    var privateKeyBuffer, publicKey;
    privateKeyBuffer = this.str2buf(priv);
    if (privateKeyBuffer.length < 32) {
      privateKeyBuffer = Buffer.concat([
        Buffer.alloc(32 - privateKeyBuffer.length, 0),
        privateKeyBuffer,
      ]);
    }
    publicKey = secp256k1.publicKeyCreate(privateKeyBuffer, false).slice(1);
    return '0x' + keccak('keccak256').update(publicKey).digest().slice(-20).toString('hex');
  },

  addressToIcap: ICAP.fromAddress,

  keccak(str) {
    return stringError(str, 'failed to create keccak256 of string') ||
      keccak('keccak256').update(str).digest('hex');
  },

  doubleSha(str) {
    return stringError(str, 'failed to create sha of string') ||
      crypto.createHash('sha256').update(crypto.createHash('sha256').update(str).digest('hex')).digest('hex');
  },

  sha(str) {
    return stringError(str, 'failed to create sha of string') ||
      crypto.createHash('sha1').update(str).digest('hex');
  },

  sha256(str) {
    return stringError(str, 'failed to create sha of string') ||
      crypto.createHash('sha256').update(str).digest('hex');
  },

  uuid: uuid.v4,

  randomSha() {
    return crypto.createHash('sha1').update(uuid.v4()).digest('hex');
  },

  stringToUint(string) {
    var string = btoa(unescape(encodeURIComponent(string))),
      charList = string.split(''),
      uintArray = [];
    for (var i = 0; i < charList.length; i++) {
      uintArray.push(charList[i].charCodeAt(0));
    }
    return new Uint8Array(uintArray);
  },

  uintToString(uintArray) {
    var encodedString = String.fromCharCode.apply(null, uintArray),
      decodedString = decodeURIComponent(escape(atob(encodedString)));
    return decodedString;
  },

  randomHash(howMany, chars) {
    chars = chars
      || 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789';
    var rnd = crypto.randomBytes(howMany),
      value = new Array(howMany),
      len = chars.length;
    for (var i = 0; i < howMany; i++) {
      value[i] = chars[rnd[i] % len];
    }
    return value.join('');
  },

  fnv1a(v) {
    var n = v.length,
      a = 2166136261,
      c,
      d,
      i = -1;
    while (++i < n) {
      c = v.charCodeAt(i);
      if (d = c & 0xff000000) {
        a ^= d >> 24;
        a += (a << 1) + (a << 4) + (a << 7) + (a << 8) + (a << 24);
      }
      if (d = c & 0xff0000) {
        a ^= d >> 16;
        a += (a << 1) + (a << 4) + (a << 7) + (a << 8) + (a << 24);
      }
      if (d = c & 0xff00) {
        a ^= d >> 8;
        a += (a << 1) + (a << 4) + (a << 7) + (a << 8) + (a << 24);
      }
      a ^= c & 0xff;
      a += (a << 1) + (a << 4) + (a << 7) + (a << 8) + (a << 24);
    }
    a += a << 13;
    a ^= a >> 7;
    a += a << 3;
    a ^= a >> 17;
    a += a << 5;
    return a & 0xffffffff;
  },

  fnv1ab(a) {
    a += (a << 1) + (a << 4) + (a << 7) + (a << 8) + (a << 24);
    a += a << 13;
    a ^= a >> 7;
    a += a << 3;
    a ^= a >> 17;
    a += a << 5;
    return a & 0xffffffff;
  },
};

module.exports = strings;
