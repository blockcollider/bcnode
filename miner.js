
var _ = require('lodash');
var child_process = require('child_process');
var big = require('big.js');
var async = require('async');
var terminate = require('terminate');
var crypto = require('crypto');
var Log = require("./log.js");
var string = require('./strings.js');
var format = require("./format.js");
var ee = require('events').EventEmitter;
var Block = require('./block.js');

var log = new Log();

    global._GenesisPath = "./genesis.json";
    global._MiningThreads = 2;

function readFile(){

    try {
        return require(global._GenesisPath);
    } catch(err) {
        log.error("unable to parse GENESIS file "+global._GenesisPath); 
    }

}

function Miner() { 

    var g = readFile();

    this.genesis = g; 

	this.coinbase = g.coinbase;

    this.readyToMine = false;

    this.identity = false;

    this.initializing = true;

    this.pids = [];

	this.workers = [];

    this.state = g.edges.reduce(function(all, k){

        all[k.org] = k

        k.block = false; 

        return all;

    }, {});

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

        var start = global._MiningThreads - self.workers.length;
        
        var limit = 1000000;

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

						if(m.type == "pow"){
							
							log.info("block found");
							
							if(self.readyToMine == true) {

								var pids = self.workers.map(function(w){
									return w.pid;
								});

								var pids = _.pull(pids, m.pid);

								async.map(pids, terminate, function(err, s){

									if(err) { log.error(err); } 

									self.pids = [];
									self.workers = [];
									self.readyToMine = false;

									delete self.block;

									socket.emit("pow", m.data);

								});

							} else {

								self.pids = [];
								self.workers = [];
								self.readyToMine = false;

								delete self.block;

								socket.emit("pow", m.data);

							}
						}

						if(m.type == "metric"){
							limit = big(m.cycles).times(global._MiningThreads).toFixed(0);
							count = count + Number(m.cycles);
							cycles = cycles + Number(m.cycles);
						}

						if(big(count).gte(limit) === true){
							var elapsed = big(Number(new Date())).minus(Number(startTimer)).div(1000);
							var hashRate = big(count).div(elapsed).toFixed(2);
							log.info("X:"+self.workers.length+" "+hashRate+"hz");
							startTimer = new Date();
							count = 0; 
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

					self.workers.push(worker);

				}

				self.events.once("update", function(){

					if(self.workers.length > 0){

						var pids = self.workers.map(function(w){
							return w.pid;
						});

						if(pids.length > 0){

							async.map(pids, terminate, function(err){

									self.pids = [];
									self.workers = [];
									self.events.emit("reset");

							});

						} else {

							self.pids = [];
							self.workers = [];
							self.events.emit("reset");

						}

					} else {

						self.pids = [];
						self.workers = [];
						self.events.emit("reset");

					}

				});

			}
            
	  });

    },


    processWork: function(){

        var self = this;


        if(self.block != undefined && self.block.edges.length == self.genesis.edges.length){

			if(self.readyToMine == false){

				log.info("mining collider block "+self.block.input);

				self.readyToMine = true;

				self.start();

			} 

        }

    },

	latestBlock: function(cb){

		// here it should load the last collider chain block hash, for now we will take coinbase

		var self = this;
			self.block = new Block({
				"version": 2,
				"distance": 0.715, 
				"range": 2200,
				"input": "69985e7ced6a0863bc3ecc64b6f10a2272480d3d67d194073a4716102fc20f55" 
			});

		cb();

	}

}



var miner = new Miner();

	//miner.latestBlock(function() { });

var queue = async.queue(function(roverBlock, cb){

	var obj = format.roverBlockToEdgeBlock(roverBlock);

	Object.keys(miner.state).map(function(k){
		if(miner.state[k].tag === obj.tag){
			obj.org = k
		}
	});	

	// This is terrible, refactor
	
	if(miner.block != undefined){

		miner.block.addEdge(obj);    

		if(miner.readyToMine == true){

			miner.events.once("reset", function(){
				miner.workers = [];
				miner.start();
				cb(null, miner.block);
			});

			miner.events.emit("update");

		} else {
			miner.processWork();
		    cb(null, miner.block);
		}


	} else {

		miner.latestBlock(function() { 

			miner.block.addEdge(obj);    

			if(miner.readyToMine == true){

				miner.events.once("reset", function(){
					miner.workers = [];
					miner.start();
					cb(null, miner.block);
				});

				miner.events.emit("update");

			} else {
				miner.processWork();
				cb(null, miner.block);
			}


		});

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

			queue.push(roverBlock, function(err, block){ });

		} catch (err) {
			console.trace(err);
			log.error("unable to parse block");
		}


    });

//miner.start();

//var test = {
//    id: "btc",
//    type: "block",
//    data: {
//        blockHash: "0000000000000000000541abce378e49488abd794db03e8971273583dab5f10c"
//    }
//}
//
//miner.setBlock(test);



