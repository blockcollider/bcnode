
var c = require("../protocol/consensus");;

var tx = require("./mtx.js")();

// https://raw.githubusercontent.com/bitcoin/bitcoin/master/contrib/seeds/nodes_main.txt

var Input = require("./input");
var Output = require("./output");
var Stack = require("../script/stack");
var Script = require("../script/script");
var Opcode = require("../script/opcode");

var rawOpCode = "OP_DUP OP_HASH160 1d49a01be3ed863a717bad24d8c3a7760e20de20 OP_EQUALVERIFY OP_CHECKSIG";

const input = new Script([
	Opcode.fromInt(1),
	Opcode.fromInt(2)
]);

var output = new Script([
    Opcode.fromSymbol("dup"),
    Opcode.fromInt(2),
    Opcode.fromSymbol("equal")
]);


//const stack = new Stack();
const stack = new Stack();

input.execute(stack);
output.execute(stack);

console.log(stack);




//var output = new Output({ script: script });
//
//var input = new Input();
//


//tx.addInput(input);
//tx.addOutput(output);




