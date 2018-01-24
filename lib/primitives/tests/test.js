
var crypto = require('crypto');
var hash = crypto.createHash("sha256").update("test").digest("hex");
var MTX = require("../mtx.js");
var Output = require("../output.js");


var out = new Output();

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
