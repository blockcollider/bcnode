
var LinvoDB = require("linvodb3");

// The following two lines are very important
// Initialize the default store to level-js - which is a JS-only store which will work without recompiling in NW.js / Electron
// Set dbPath - this should be done explicitly and will be the dir where each model's store is saved
LinvoDB.dbPath = "./data"; 

var Doc = new LinvoDB("doc", { /* schema, can be empty */ })

//var doc = new Doc({ a: 5, now: new Date(), test: "this is a string" });
//doc.b = 13; // you can modify the doc 
//doc.save(function(err) { 
//    // Document is saved
//    console.log(doc._id);
//});
//
//

Doc.find({ b: 13 }, function (err, docs) {

	console.log(docs);
  // docs is an array containing documents Mars, Earth, Jupiter
  // If no document is found, docs is equal to []
});

