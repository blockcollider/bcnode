
"strict";

var _ = require('lodash');
var crypto = require('crypto');
var distance = require('../distance.js');
var generating = false;
var fuz = require('clj-fuzzy');
var big = require('big.js');
var string = require("../strings.js");

function randomStr() {
  return crypto.randomBytes(32).toString("hex");
}


function Worker(){

    this.threshold = 0.57; 
    this.cycles = 0;
    this.work = [];
    this.startTimer = 0;

}

Worker.prototype = {

    stop: function() {
        this.result = true;
    },
    
    mine: function() {

        var self = this;
            self.cycles++;
            if(self.work.length > 0){

                var val = randomStr(); 
                var test = string.blake2bl(val);
                var variance = 0;
                var list = [];
                
                if(self.cycles >= 2000){
                    var elapsed = big(Number(new Date())).minus(Number(self.startTimer)).div(1000).toFixed(2);
					console.log(elapsed);
                    self.cycles = 1;
                    self.startTimer = new Date();

                }

                for (var i = 0; i < self.work.length; i++) {
                   // var c = distance(self.work[i], val);

	               var c = fuz.metrics.jaro_winkler(self.work[i][1], val);
                
                   if(big(c).lt(self.threshold) === true){
                        return false;
                        break;
                   } else {
                        variance=big(variance).add(c).toFixed();
                   }
                } 
                
                if(big(variance).gt(0) == true){

					var a = self.work.map(function(l){
						return l.join("-");
					});

                    self.result = "W:"+self.threshold+":"+variance+":"+val+":"+self.work.length+":"+self.work.join("+");
                    return variance;
                }

                return false;

            } else {
                return false;
            }
    }

}

var worker = new Worker();

var block = require("./unmined_block.json");

var work = [];

	work.push(block);

	block.e.map(function(b){
		work.push(b.ih);
	});

var hashed = work.map(function(w){
		return [w,string.blake2bl(w)];
	});

	generating = true;
	worker.threshold = 0.7 
	worker.work = hashed;

	worker.startTimer = new Date();

	// TODO: Move this part into node domains

	while(worker.mine() == false) { }

	console.log(worker.result.split(":"));



