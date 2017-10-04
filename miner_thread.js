
"strict";

var _ = require('lodash');
var crypto = require('crypto');
var distance = require('./distance.js');
var generating = false;
var fuz = require('clj-fuzzy');
var big = require('big.js');
var string = require("./strings.js");


process.on("uncaughtError", function(err){

	console.trace(err);
	log.error("critical error miner");

});

function randomStr() {
  return crypto.randomBytes(32).toString("hex");
}


function Worker(){

    this.cycles = 0;
	this.block = false;
    this.startTimer = 0;
	this.work = [];

}

Worker.prototype = {

    stop: function() {
        this.result = true;
    },
    
    mine: function() {

        var self = this;

            if(self.work.length > 0){

                var val = randomStr(); 
                var test = string.blake2bl(val);
                var variance = 0;

                if(self.cycles >= 100){
                    var elapsed = big(Number(new Date())).minus(Number(self.startTimer)).div(1000);
                    process.send({
						type: "metric",
						pid: process.pid,
						cycles: self.cycles,
						elapsed: elapsed
					});
                    self.cycles = 1;
                    self.startTimer = new Date();
                }

                for (var i = 0; i < self.work.length; i++) {
                   // var c = distance(self.work[i], val);

            	   self.cycles++;
            	   self.periodCycles++;

	               var c = fuz.metrics.jaro_winkler(self.work[i], val);
                
                   if(big(c).lt(self.block.distance) === true){
						variance = 0;
                        return false;
                        break;
                   } else {
                        variance=big(variance).add(c).toFixed();
                   }

                } 

                if(big(variance).gt(0) == true){
                    //worker.result = "W:"+self.block.distance+":"+variance+":"+val+":"+self.work.length+":"+self.work.join("+");
					self.block.proof = val;

                    worker.result = {
						pid: process.pid,
						type: "pow",
						data: self.block
					} 

                    return variance;
                }

                return false;

            } else {
                return false;
            }
    }

}

var worker = new Worker();

process.on("message", function(msg){

    if(msg == "stop"){
        process.exit();
    //} else if(generating == false && msg.type == "work") {
    } else if(msg.type == "work") {

        //generating = true;

		console.log(msg.data);

		worker.block = msg.data;

        worker.startTimer = new Date();

		worker.work = worker.block.edges.map(function(e){

			return string.blake2bl(e.input);

		});

		worker.work.unshift(worker.block.input);

        // TODO: Move this part into node domains

        while(worker.mine() == false) { }

		process.send(worker.result);

		process.exit();

    } else if(msg.type == "update"){

        //Object.keys(msg.data).map(function(k){
        //    worker[k] = msg.data[k];
        //});

    }

});

