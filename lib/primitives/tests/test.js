
var crypto = require('crypto');
var hash = crypto.createHash("sha256").update("test").digest("hex");
var MTX = require("../mtx.js");
var Output = require("../output.js");
var SubInput = require("../subinput.js");
var SubOutput = require("../suboutput.js");

var sub = new SubOutput();
var out = new Output();

out.stack.addInput(SubInput.fromOptions({
    hash: hash,
    index: 0
}));

out.stack.addOutput(sub);

//console.log(out.getJSON());

const input = {
  prevout: {
    hash: hash,
    index: 0
  }
};

var mtx = new MTX({
    inputs: [input]
});

mtx.addOutput(out);

console.log(mtx);
