
//var LinvoDB = require("linvodb3");

// The following two lines are very important
// Initialize the default store to level-js - which is a JS-only store which will work without recompiling in NW.js / Electron
// Set dbPath - this should be done explicitly and will be the dir where each model's store is saved

// should be injected by parent class

//var Doc = new LinvoDB("doc", { /* schema, can be empty */ })

//var doc = new Doc({ a: 5, now: new Date(), test: "this is a string" });
//doc.b = 13; // you can modify the doc 
//doc.save(function(err) { 
//    // Document is saved
//    console.log(doc._id);
//});
//
//

//Doc.find({ b: 13 }, function (err, docs) {
//
//	console.log(docs);
//  // docs is an array containing documents Mars, Earth, Jupiter
//  // If no document is found, docs is equal to []
//});

const LinvoDB = require("linvodb3");
const Shared = require('mmap-object')
const fs = require('fs-extra')
const string = require("./strings.js");
const HASH_FUNCTIONS = 7; // how many hashes do you want?
const ee = require("events").EventEmitter;
const log = global.log;
const async = require('async');
const zstd = require('node-zstd');

const SCHEMAS = {}

global._RemoveBlockTransactions = true;

function Storage(opts) {

	var self = this;

	var options = {
		genesisPath: global._BlockColliderIdentity.identityPath,
		genesisFile: "genesis.json",
		blockPath: global._BlockColliderIdentity.identityPath+"/blocks",
		blockAlloc: 10000,
		hashCycles: 7,
		bloomPath: global._BlockColliderIdentity.identityPath+"/blocks",
		bloomFile: "bloom.bcol",
		db: {}
	}

	if(opts != undefined){
		Object.keys(opts).map(function(k){
			options[k] = opts[k];
		});
	}

	Object.keys(options).map(function(k){
		self[k] = options[k];
	});

    log.info("block storage: "+options.blockPath);

	LinvoDB.dbPath = options.blockPath; 

}

Storage.prototype = {

	events: new ee(), 

	init: function(cb) {

		var self = this;

		fs.ensureDir(self.blockPath, function(err){

			if(err) { cb(err); } else {

				fs.ensureDir(self.bloomPath, function(err){

					if(err) { cb(err); } else {

						self.genesis = require(self.genesisPath+"/"+self.genesisFile);
						self.writeMap = new Shared.Create(self.bloomPath+"/"+self.bloomFile, self.blockAlloc);
						self.readMap = new Shared.Open(self.bloomPath+"/"+self.bloomFile, self.blockAlloc);
						self.initialized = true;

						cb(null, self);

					}

				});

			}

		});

	},

	getOffsets: function(str){

	  var self = this; 
	  var buffer_size = self.writeMap.max_bucket_count();
	  var a = string.fnv1a(str); 
	  var b = string.fnv1ab(a);
	  var r = [];
	  var i = -1;
	  var x = a % buffer_size; 

	  while (++i < self.hashCycles) {
		r.push(x < 0 ? (x + buffer_size) : x);
		x = (x + b) % buffer_size;
	  }

	  return r;

	},

	removeBloom: function(str){

	  var i = -1;
	  var self = this;
	  var offsets = self.getOffsets(str);

	  while (++i < self.hashCycles) {
		delete self.writeMap[offsets[i]];
	  } 

	  return offsets;

	},

	addBloom: function(str){

	  var i = -1;
	  var self = this;
	  var offsets = self.getOffsets(str);

	  while (++i < self.hashCycles) {
		self.writeMap[offsets[i]] = 1;
	  } 

	  return offsets;

	},

	checkBloom: function(str){

	  var self = this;
	  var i = -1;
	  var offsets = self.getOffsets(str);

	  while (++i < self.hashCycles)
		if (self.writeMap[offsets[i]] != 1)
			return false;
	  return true;

	},

	streamBloom: function(query){

		var self = this;
			self.readMap;

		if(query == undefined){
			for (let key in self.readMap) {
			  if (self.readMap.isData(key)) { 
				  self.events.emit("bloom", {
					k: key,
					v: obj[key]
				  });
			  }
			}
		} else {

			if(query.constructor == String){

				for (let key in self.readMap) {
				  if (self.readMap.isData(key)) { 
					  if(obj[key].indexOf(query) > -1){
						  self.events.emit("bloom", {
							k: key,
							v: obj[key]
						  });
					  }
				  }
				}

			} else {

				var k = query.k;
				var v = query.v;

				for (let key in self.readMap) {
				  if (self.readMap.isData(key)) { 
					  if(key.indexOf(k) > -1 && obj[key].indexOf(v) > -1){
	
						  self.events.emit("bloom", {
							k: key,
							v: obj[key]
						  });

					  }
				  }
				}

			}

		}

		return self.events;

	},

	close: function(cb) {

		var self = this;
			self.writeMap.close(cb);

	},

	update: function(key, value){

		var self = this;

	},

    getPrevBlock: function(block, cb){

        var self = this;

        //fs.writeFile("./backup/"+block.data.blockNumber+".json", JSON.stringify(block.data, null, 2), function(err){

            self.db[block.id].findOne({ blockHash: block.data.prevHash }, function(err, res){

                if(err) { cb(err); } else {

                    if(res) { cb(null, res); } else {

                        log.warn("prev block hash not found"); 

                        cb(null, block);

                    }

                }

            });

        //});

    },

    getBlockForkSolution: function(block, candidates, cb){

        var self = this;

        var notOrphans = candidates.filter(function(c){
            if(c._orphan != undefined && c._orphan === false){
                return c;
            }
        });

        if(notOrphans.length > 0){

            log.warn("block is rejected, other validated");

            cb("block is rejected due to other longer blocks");

        } else {

            block.data._status = "pending";

            candidates = candidates.map(function(c){
                c._status = "pending";
                return c;
            });

            var formatCandidates = candidates.reduce(function(all, c){

                all.push({
                    id: block.id,
                    data: c
                });

                return all;
            }, []);

            function writeBlock(block , cb) {

                var obj = new self.db[block.id](block.data);

                    obj.save(function(err){

                        if(err) { cb(err); } else {

                            cb(null, block);

                        }

                    });

            }

            async.map(formatCandidates, writeBlock, function(err, cs){

                if(err) { cb(err); } else {

                    cb(null, block);

                }

            });

        }

    }, 


    getBlockForkStatus: function(block, cb){

        var self = this;

        self.db[block.id].find({ prevHash: block.data.prevHash }, function(err, res){

            if(err) { cb(err); } else {

                if(res.length > 0){

                    log.warn("set block fork/orphan rebase flag");

                    self.getBlockForkSolution(block, res, cb);

                } else {

                    block.data._status = "done";

                    // Block ok to store, see if pruning orphans is possible
                    
                    self.getPrevBlock(block, function(err, prevBlock){

                        if(prevBlock._status == "pending"){

                            self.db[block.id].find({ prevHash: prevBlock.prevHash }, function(err, res){

                                if(err) { cb(err); } else {

                                    self.db[block.id].remove({ prevHash: prevBlock.prevHash, blockHash: { $ne: prevBlock.blockHash } }, function(err){

                                        if(err) { cb(err); } else {

                                            prevBlock._status = "done";
                                            prevBlock._orphan = false;

                                            prevBlock.save(function(err){

                                                if(err) { cb(err); } else {

                                                    cb(null, block);

                                                }

                                            });

                                        }

                                    });

                                }


                            });


                        } else {

                          cb(null, block);

                        }

                    });

                }

            }

        });

    },

    writeBlock: function(block, cb){

        var self = this;

		if(self[block.id] == undefined){

			var schema = {}

			if(SCHEMAS[block.id] != undefined){
				schema = SCHEMAS[block.id];
			}

			self.db[block.id] = new LinvoDB(block.id, schema);

		}

        var obj = new self.db[block.id](block.data);

            obj.save(function(err){

                if(err) { cb(err); } else {

                    var bloom = self.addBloom(block.data.blockHash);
                    var bloomNumber = self.addBloom(block.id+block.data.blockNumber); // eth4355274

                    cb(null, block, bloom);

                }

            });

    },

    /* Adds a sequence/block/hash object from another data structure or blockchain */
	addBlock: function(block, cb) {
		
		var self = this;

		if(self[block.id] == undefined){

			var schema = {}

			if(SCHEMAS[block.id] != undefined){
				schema = SCHEMAS[block.id];
			}

			self.db[block.id] = new LinvoDB(block.id, schema);

		}

        if(block.id != undefined && block.data != undefined && block.data.tag == undefined){
            block.data.tag = block.id;
        }

        var hasBlock = self.checkBloom(block.data.blockHash);

        if(hasBlock === true){

            log.warn("block already in storage");

            cb(null, block);

        } else {

            self.getPrevBlock(block, function(err, prevBlock){

                if(err) { cb(err); } else {

                    self.getBlockForkStatus(block, function(err, block){

                        if(err) { cb(err); } else {

                            if(block.data.transactions != undefined && global._RemoveBlockTransactions){
                                delete block.data.transactions;
                            }

                            self.writeBlock(block, function(err, block, bloom){

                                if(err) { cb(err); } else {

                                        self.events.emit("blockadded", block); 
                                        self.events.emit("bloomadded", bloom); 

                                        cb(null, block);

                                }

                            });

                        }

                    });

                }

            });

        }

	},

    /* Add transaction to Block (will break merkle) */
    addBlockTransaction: function(blockHash, tx, cb){

    },

    /* Add transaction to TX Pool */
    addTransaction: function(tx, cb){

    }

}


module.exports = Storage;
//var block = require("./utils/unmined_block.json");
//var a = Buffer(JSON.stringify(block));
//
//zstd.compress(a, function(err, out){
//	var hex = out.toString();
//
//	zstd.decompress(new Buffer(hex), function(err, o){
//		if(err) { console.trace(err); } else {
//
//			console.log(o);
//		}
//
//	});
//});

//var storage = new Storage();
//
//	storage.init(function(err){
//
//		console.log(storage.addBloom("test"));
//		console.log(storage.checkBloom("test"));
//		console.log(storage.removeBloom("test"));
//		console.log(storage.checkBloom("test"));
//		storage.streamBloom();
//
//	});



//add(buffer, get_offsets("testing", buffer));
//
//add(buffer, get_offsets("frog", buffer));
//
//
//add(buffer, get_offsets("shirt", buffer));
//
//console.log("check: ", check(readBuffer, get_offsets("testing", readBuffer)));
//console.log("check: ", check(readBuffer, get_offsets("frog", readBuffer)));
//console.log("check: ", check(readBuffer, get_offsets("shirt", readBuffer)));
//console.log("check: ", check(readBuffer, get_offsets("bananc", readBuffer)));


