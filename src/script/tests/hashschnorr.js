
const schnorr = require('../../crypto/schnorr');
const Opcode = require('../opcode');
const digest = require('../../crypto/digest');
const Stack = require('../stack');
const Script = require('../script');
const common = require('../common');
const crypto = require('crypto');
const BN = require("bn.js");

const pk = crypto.randomBytes(32);

const id = digest.sha1("test");

const input = new Script([]);

const output = new Script([]);

const stack = new Stack();

input.pushData(pk);
input.pushData(id);

output.pushSym("HASHSCHNORR");

input.execute(stack);
output.execute(stack);






