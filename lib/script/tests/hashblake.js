
const schnorr = require('../../crypto/schnorr');
const Opcode = require('../opcode');
const digest = require('../../crypto/digest');
const hashes = require("../../crypto/hashes");
const Stack = require('../stack');
const Script = require('../script');
const common = require('../common');
const BN = require("bn.js");

const id = digest.sha1("test");

const input = new Script([]);

const output = new Script([]);

const stack = new Stack();

input.pushData(id);

output.pushSym("HASHBLAKE");

input.execute(stack);

output.execute(stack);

console.log(stack);






