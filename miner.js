
var _ = require('lodash');
var Log = require("./log.js");
var string = require('./strings.js');
var child_process = require('child_process');
var big = require('big.js');
var crypto = require('crypto');

var log = new Log();

    global._GenesisPath = "./genesis.json";
    global._MiningThreads = 4;

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

    this.mining = false;

    this.identity = false;

    this.threads = [];

    this.initializing = true;

    this.state = g.superedges.reduce(function(all, k){

        all[k.org] = k

        k.hash = false; 

        return all;

    }, {});

}


Miner.prototype = {

    start: function() {

        var self = this;

        var start = global._MiningThreads-self.threads.length;
        
        var limit = 1000000;

        var startTimer = new Date();

        var t = 0;

        if(start > 0){

            var count = 0;
            var cycles = 0;

            for(var i = 0; i<start;i++){

                var worker = child_process.fork("./miner_thread.js"); 
                
                worker.on("message", function(msg){

                    var m = msg.split(":");                     

                    if(m[0] == "C"){
                        limit = big(m[2]).times(global._MiningThreads).toFixed(0);
                        console.log(m);
                        count=count+Number(m[2]);
                        cycles=cycles+Number(m[2]);
                    }

                    if(big(count).gte(limit) === true){
                        var elapsed = big(Number(new Date())).minus(Number(startTimer)).div(1000);
                        var hashRate = big(count).div(elapsed).toFixed();
                        console.log("HZ: "+hashRate+" CYC: "+cycles);
                        startTimer = new Date();
                        count = 0; 
                    }


                    if(m[0] == "W"){
                        console.log("Block found!");
                        console.log(m);
                    }

                });

                

                worker.on("exit", function(w){
                    console.log("worker exited");
                }); 

                worker.send({ 
                    type: "work", 
                    data: { 
                        threshold: 0.72,
                        work: [
                            crypto.randomBytes(32).toString('hex'),
                            crypto.randomBytes(32).toString('hex'),
                            crypto.randomBytes(32).toString('hex')
                        ]
                    }
                });

                if(i % 2 == 0){

                    setTimeout(function() {
                        console.log('sending update');
                        worker.send({ 
                            type: "update", 
                            data: { 
                                threshold: 0.5,
                                work: [
                                    crypto.randomBytes(32).toString('hex'),
                                    crypto.randomBytes(32).toString('hex'),
                                    crypto.randomBytes(32).toString('hex')
                                ]
                            }
                        });

                    }, 5000);

                }

            }

        }
            

    },

    processWork: function(){

        var self = this;

        var superedges = Object.keys(self.state);

        var work = superedges.reduce(function(all, a) {

            if(self.state[a].hash != undefined && self.state[a].hash != false){
                all.push(self.state[a].hash);
            }

            return all;

        }, []);

        if(work.length == superedges.length && self.mining == false){

            self.mining = true;

            self.start();

            console.log("Ready to work");
            
        }

        console.log(work);

    },

    setBlock: function(block){

        var self = this;

        var tag = block.id;

        self.genesis.superedges.map(function(edge){

             if(edge.tag == tag){

                console.log("new "+tag+" : "+block.data.blockHash);
                self.state[edge.org].hash = block.data.blockHash;

             }

        });

        console.log(self.state);

    }

}

var miner = new Miner();


var socket = require('socket.io-client')('http://localhost:6600');

    socket.on('connect', function(){
        log.info("miner connected to rover base");
        socket.emit("work", "test work drop");
    });

    socket.on("setup", function(data){
        log.info("collider base recieved "+data.address);
        miner.identity = data;
    });

    socket.on("log", function(data){
        console.log(data);
    });

    socket.on("block", function(block){
        miner.setBlock(block);    
        miner.processWork();
    });


miner.start();

//var test = {
//    id: "btc",
//    type: "block",
//    data: {
//        blockHash: "0000000000000000000541abce378e49488abd794db03e8971273583dab5f10c"
//    }
//}
//
//miner.setBlock(test);



