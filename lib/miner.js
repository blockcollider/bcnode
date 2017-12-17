
var _ = require('lodash');
var child_process = require('child_process');
var fs = require('fs-extra');
var big = require('big.js');
var moment = require('moment');
var async = require('async');
var LinvoDB = require("linvodb3");
var terminate = require('terminate');
var crypto = require('crypto');
var Log = require("./log.js");
var string = require('./utils/strings.js');
var Block = require('./block.js');

//db.findOne({ 
//    blockHash: "0x0cc2134397d9ed49d51f86f3ba54afbc50fa85842683667d108dc2a803d7bad2" }, function(err, doc){
//
//    if(err) { console.trace(err); } else {
//        console.log(doc);
//    }
//
//}); 

function formatPrevBlock(data){

    data.blocks = data.blocks.reduce(function(all, a){

        var l = a.input.split("::").length;

                a.n = l - 1; 

                a.input = a.input.split("::").pop();

                all.push(a);

        return all;

    }, []);

    return data;

}

var ee = require('events').EventEmitter;
var log = new Log();
var offset = 0;

    global._GenesisPath = "./genesis.json";

    global._MiningThreads = 5;

	global._MinerPath = "./miner_data"; 

	LinvoDB.dbPath = global._MinerPath; 

	fs.ensureDirSync(global._MinerPath);

var noPingTimeout = setTimeout(function(){

	log.error("no communication from roverbase exiting...");
	process.exit();

}, 60000);

function readFile(){

    try {
        return require(global._GenesisPath);
    } catch(err) {
        log.error("unable to parse GENESIS file "+global._GenesisPath); 
    }

}

function Miner(opts) { 

    var g = readFile();

	var self = this;

    this.genesis = g; 

	this.coinbase = g.coinbase;

    this.readyToMine = false;

    this.identity = false;

    this.initializing = true;

	this.blockNumber = 0;

    this.bestScore = {}

    this.pids = [];

	this.workers = [];

    this.state = g.blocks.reduce(function(all, k){

        all[k.org] = k

        k.block = false; 

        return all;

    }, {});

	if(opts != undefined){

		Object.keys(opts).map(function(k){
			self[k] = opts[k];
		});

	}

}


Miner.prototype = {

	events: new ee(),

	restart: function(cb){

		var self = this;

		log.info("posting update: "+self.pids);

		var pids = self.workers.map(function(w){
			return w.pid;
		});

		async.map(pids, terminate, function(err, s){

			log.info("restarting...");
			self.pids = [];
			self.workers = [];

			cb(null, s);

		});

	},

    start: function() {

        var self = this;

        if(self.workers.length > 0){

            console.log("STARTING WITH WORKERS: "+self.workers.length);
            process.exit();

        }

        var start = global._MiningThreads - self.workers.length;
        
        var limit = 19900000;

        var startTimer = new Date();

        var t = 0;

		var pids = self.workers.map(function(e){
			return e.pid;
		});

		async.map(pids, terminate, function(err){ 

			if(start > 0){

				log.info("threads: " + start);

				var count = 0;
				var cycles = 0;

				for(var i = 0; i < start; i++){

					var worker = child_process.fork("./miner_thread.js"); 

					worker.on("message", function(m){

						if(self.block == undefined){

                            log.info("block not defined"); 

                            if(worker.connected == true) {

                                worker.send({
                                    type: "exit"
                                });	

                            }

							return; 

						}

						if(m.type == "pow"){
							
							log.info("block found");

							m.data.tag = self.genesis.coinbase.tag;

							Object.keys(self.block).map(function(k){
								m.data[k] = self.block[k];
							});

							m.data.prevHash = self.block.input;
							
							if(self.readyToMine == true) {

								var pids = self.workers.map(function(w){
									return w.pid;
								});

								console.log(pids);

								//var pids = _.pull(pids, m.pid);

								async.map(pids, terminate, function(err, s){

									if(err) { log.error(err); } 

                                    var prevBlock = _.cloneDeep(self.block);

									self.pids = [];
									self.workers = [];
									self.readyToMine = false;
                                    self.prevBlock = formatPrevBlock(prevBlock);

									delete self.block;

                                    delete self.bestScore;
									
									m.data.timestamp = Number(moment().unix()) + offset;

									log.info("block timestamp set: "+m.data.timestamp);

									self.events.emit("pow", m.data);

									socket.emit("pow", m.data);

								});

							} else {

                                var prevBlock = _.cloneDeep(self.block);

								self.pids = [];
								self.workers = [];
								self.readyToMine = false;
                                self.prevBlock = formatPrevBlock(prevBlock);

								delete self.block;
                                delete self.bestScore;

								m.data.timestamp = Number(moment().unix()) + offset;

								log.info("block timestamp set: "+m.data.timestamp);

								self.events.emit("pow", m.data);

								socket.emit("pow", m.data);

							}
						}

						if(m.type == "metric"){
							limit = big(m.cycles).times(global._MiningThreads).toFixed(0);
							count = count + Number(m.cycles);
							cycles = cycles + Number(m.cycles);
						}

						if(big(count).gte(limit) === true){

							try {

							var elapsed = big(Number(new Date())).minus(Number(startTimer)).div(1000);
							var hashRate = big(count).div(elapsed).toFixed(2);
							var start = "X:"+self.workers.length+" "+hashRate+"hz";
                            var rep = {
                                timestamp: moment().utc().format(),
								type: hashRate,
                                hashRate: hashRate,
                                elapsed: elapsed
                            }

							startTimer = new Date();
							count = 0; 
                            socket.emit("metric", rep);

							} catch(err){


							}

						}

					});

					worker.send({ 
						type: "work", 
						data: self.block 
					});

					worker.on("error", function(err){
						console.trace(err);
					});

					worker.on("exit", function(){
						log.info("thread closed");
					});

					//self.events.once("reset", function(){
					self.workers.push(worker);

				}


			}
            
	  });

    },


    processWork: function(){

        var self = this;

        if(self.block != undefined && self.block.blocks.length == self.genesis.blocks.length){

			if(self.readyToMine == false){

				log.info("mining collider block "+self.block.input);

				self.readyToMine = true;

				self.start();

			} 

        }

    },

	latestBlocks: function(cb){

		// here it should load the last collider chain block hash, for now we will take coinbase

		var self = this;

			//////// Needs to pull this block 
			self.block = new Block({
				"version": 2,
				"distance": 0.735, 
				"range": 2200,
				"input": "69985e7ced6a0863bc3ecc64b6f10a2272480d3d67d194073a4716102fc20f55" 
			});

		//if(self.db == undefined){

		//	cb();

		//} else {

		//	async.map(self.genesis.blocks, function(obj, next){

		//		self.db.findOne({ tag: obj.tag }, next);

		//	}, function(err, res){

		//		if(err) { cb(err); } else {

		//			self.db.find({ tag: self.genesis.coinbase.tag }).sort({ n: -1 }).exec(function(err, recent){

		//				if(err) { cb(err);  } else {
		//			
		//					console.log(recent);			
		//					var NRGBlock;

		//					if(recent.length > 0) {

		//						NRGBlock = recent.shift();
		//						NRGBlock.n = NRGBlock.n + 1;

		//						NRGBlock.distance = self.genesis.coinbase.distance;
		//						NRGBlock.range = self.genesis.coinbase.range;

		//						self.block = new Block(NRGBlock);

		//					} else {

		//						self.block = new Block({
		//							tag: self.genesis.coinbase.tag,
		//							input: self.genesis.coinbase.org,
		//							distance: self.genesis.coinbase.distance, 
		//							range: self.genesis.coinbase.range,
		//							n: self.genesis.coinbase.n
		//						});

		//					}


		//					console.log(self.block);

		//					cb(null, recent);	

		//				}
		//				
		//			});

		//		}
		//	
		//	});


		//}

        cb();

	}

}

var miner = new Miner({
	db: new LinvoDB("miner", {}) 
});

miner.events.once("update", function(){

    if(miner.workers.length > 0){

        var pids = miner.workers.map(function(w){
            return w.pid;
        });

        if(pids.length > 0){

            async.map(pids, terminate, function(err){

                    miner.pids = [];
                    miner.workers = [];
                    miner.events.emit("reset");

            });

        } else {

            miner.pids = [];
            miner.workers = [];
            miner.events.emit("reset");

        }

    } else if(miner.pids.length > 0) {

        async.map(pids, terminate, function(err){

                miner.pids = [];
                miner.workers = [];
                miner.events.emit("reset");

        });


    } else {

        miner.pids = [];
        miner.workers = [];
        miner.events.emit("reset");

    }

});
var socket = require('socket.io-client')('http://localhost:6600');

	socket.on('connect', function(){
		log.info("miner connected to rover base");
	});

	socket.on('disconnect', function(){
		miner.events.emit("update");
		log.info("miner connected to rover base");
	});

	socket.on("setup", function(data){
		log.info("collider base recieved "+data.address);
		miner.identity = data;
	});

	socket.on("block", function(roverBlock){

		try { 

			var obj = format.roverBlockToEdgeBlock(roverBlock);

			queue.push(obj, function(err, block){ });

		} catch (err) {
			console.trace(err);
			log.error("unable to parse block");
		}

	});

	socket.on("ping", function(oset){

		clearTimeout(noPingTimeout);

		noPingTimeout = setTimeout(function(){
			log.error("no communication from roverbase exiting...");
			process.exit();
		}, 30000);

	});


		//miner.latestBlock(function() { });

		miner.events.on("pow", function(data){
			
			var doc = new miner.db(data);

				doc.save(function(err){

					if(err) { 
						log.error(err);
					}

				});

		});

	var queue = async.queue(function(obj, cb){

		Object.keys(miner.state).map(function(k){
			if(miner.state[k].tag === obj.tag){
				obj.org = k
			}
		});	

		// This is terrible, refactor

		//if(obj._id === undefined){

		//	var list = obj.input.split("::");
		//	var i = obj.n-1;

		//	async.map(list, function(input, next){

		//		i++;

		//		var m = _.cloneDeep(obj);

		//			m.n = i;

		//			m.input = input;

		//		var block = new miner.db(m);

		//			block.save(function(err){
		//				if(err) { console.trace(err); } else {
		//					next();
		//				}
		//			});

		//	}, function(err, res){


		//	});


		//}


		if(miner.block != undefined){

            if(miner.prevBlock != undefined){

                var add = miner.prevBlock.blocks.filter(function(b){

                    if(b.tag != obj.tag){
                        return b;
                    }

                });

                for(var i = 0; i<add.length; i++){
			        miner.block.addBlock(add[i], miner.readyToMine);    
                }

            } else {

			    miner.block.addBlock(obj, miner.readyToMine);    

            }


			if(miner.readyToMine == true){

                 
				////miner.events.once("reset", function(){
				//	miner.workers = [];
				//	miner.start();
				////});

				//miner.events.emit("update");
				cb(null, miner.block);

			} else {
				miner.processWork();
				cb(null, miner.block);
			}


		} else {

			log.info("creating working block");

			miner.latestBlocks(function() { 

                if(miner.prevBlock != undefined){

                    var add = miner.prevBlock.blocks.filter(function(b){

                        if(b.tag != obj.tag){
                            return b;
                        }

                    });

                    for(var i = 0; i<add.length; i++){
                        miner.block.addBlock(add[i], miner.readyToMine);    
                    }


                } else {

				    miner.block.addBlock(obj);    

                }


                console.log(miner.block.blocks);

				if(miner.readyToMine == true){

					//miner.events.once("reset", function(){
						//miner.workers = [];
						//miner.start();
					//});

				    cb(null, miner.block);
					//miner.events.emit("update");

				} else {
					miner.processWork();
					cb(null, miner.block);
				}


			});

		}


	});

	log.info("miner using genesis: "+global._GenesisPath);

	miner.latestBlocks(function(err, blocks) {

			//queue.push(blocks, function(err){ 

			//});

	});






