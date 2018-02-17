const bitcoinBlock = require("./bitcoinBlock.js");
const ethereumBlock = require("./ethereumBlock.js");

class Block {
      constructor(opts) {
         this.bitcoin = new bitcoinBlock();
         this.ethereum = new ethereumBlock();
      }
      getBlock(type, height, cb){

        if(type == "eth") type = "ethereum";
        if(type == "btc") type = "bitcoin";
        if(type == "lsk") type = "lisk";
        if(type == "lsk") type = "lisk";

        if(this[type] == undefined) throw Error("type: "+type+" not found");

        return this[type].getBlock(height, cb);

      }
}



const block = new Block();

block.getBlock("ethereum", 1600, function(err, block){

    console.log(block);

});
