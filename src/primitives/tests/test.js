
var crypto = require('crypto');
var hash = crypto.createHash("sha256").update("test").digest("hex");
var MTX = require("../mtx.js");
var Output = require("../output.js");
var SubInput = require("../subinput.js");
var SubOutput = require("../suboutput.js");
var Script = require("../../script/script");

//var script = new Script();
//    script.pushSym("HASH160");

var subInput = {
    prevout: {
        hash: hash,
        index: 0
    }
}

var output = new Output();
var subOutput = new SubOutput();

    subOutput.script.pushSym("HASH160");

output.stack.addInput(subInput);

output.stack.outputs.push(subOutput);

console.log(subOutput);

const input = {
  prevout: {
    hash: hash,
    index: 0
  }
};

var mtx = new MTX({
    inputs: [input]
});

mtx.outputs.push(output);

//console.log(mtx.outputs[0].stack.outputs[0]);
