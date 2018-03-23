
const assert = require('assert');
const Script = require("./script/script");
const Opcode = require("./script/opcode");
const Stack = require("./script/stack");
const ethUtils = require("ethereumjs-util");
const crypto = require("crypto");
const Web3 = require("web3");
//const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545")); 

const Fingerprints = require("./primitives/fingerprints");
const Polyglot = require("./polyglot"); 
const BN = require("bn.js");

const raw = require("./utils/templates/blockchain_fingerprints");
const poly = new Polyglot('eth');

function toHex(str) {
 var hex = ''
 for(var i=0;i<str.length;i++) {
  hex += ''+str.charCodeAt(i).toString(16)
 }
 return hex
}

//web3.personal.unlockAccount(web3.eth.accounts[0], "password");
//let addr = web3.eth.accounts[0];
let addr = "0x368ce4aee1a00606278e15677262c7b29e108de8"; 


let msgBuff = new Buffer("Freedom through cryptography.");
let msg = "0x" + msgBuff.toString("hex");
let signature = "0xa899e75a22f8968ca104abc69e152739de1df02c364d1419280df259ad67b8a31ede7df1047c1d31403b7e503ff4a691f60f95b0f323e2c0b653d6823404785c1b"
//let signature = web3.personal.sign(msg, addr, "password")

console.log(signature)

const valid = poly.eth.validSignature(addr, msgBuff, signature);

console.log(valid);

//let newSignature = web3.personal.ecRecover(msg, "0x0de65e88c79a9bed302377c6a94cae3c5dedba397d2f2237b3f532d9deaaa2a14654f66732dda2a7a4fc0578f93698e8568fd24cbf5035522e095f1050986f541c");





const fp = Fingerprints.fromBlocks(raw[1].fingerprint);


const num = new BN(9999999)

const input = new Script([
        Opcode.fromInt(1),
        Opcode.fromInt(2),
        Opcode.fromSymbol("hashblake")
      ]);

const output = new Script([
	Opcode.fromInt(2),
	Opcode.fromInt(5)
]);

//const output = new Script([
//	Opcode.fromInt(2),
//	Opcode.fromSymbol('equal'),
//	Opcode.fromSymbol('if'),
//	Opcode.fromInt(3),
//	Opcode.fromSymbol('else'),
//	Opcode.fromInt(4),
//	Opcode.fromSymbol('endif'),
//	Opcode.fromInt(5)
//]);

const stack = new Stack();

input.execute(stack);
output.execute(stack);

//assert.deepEqual(stack.items, [[1], [3], [5]]);


