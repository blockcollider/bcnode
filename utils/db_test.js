

const LinvoDB = require("linvodb3");
	  LinvoDB.dbPath = "/Users/mtxodus1/Library/Application Support/.blockcollider/blocks"; 
      

var db = new LinvoDB("eth", {});


db.findOne({ 
    blockHash: "0x0cc2134397d9ed49d51f86f3ba54afbc50fa85842683667d108dc2a803d7bad2" }, function(err, doc){

    if(err) { console.trace(err); } else {
        console.log(doc);
    }

}); 
