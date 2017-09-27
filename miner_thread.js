
"strict";

var avon = require('avon');
var _ = require('lodash');
var crypto = require('crypto');
var distance = require('./distance.js');
var generating = false;
var fuz = require('clj-fuzzy');
var big = require('big.js');

function randomStr() {
  return crypto.randomBytes(32).toString("hex");
}


function Worker(){

    this.threshold = 0.75; 
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
                var test = crypto.createHash("sha256").update(val).digest('hex');
                var variance = 0;
                var list = [];
                
                if(self.cycles >= 2000){
                    var elapsed = big(Number(new Date())).minus(Number(self.startTimer)).div(1000);
                    process.send("C:"+process.pid+":"+self.cycles+":"+elapsed);
                    self.cycles = 1;
                    self.startTimer = new Date();
                }

                for (var i = 0; i < self.work.length; i++) {
                   // var c = distance(self.work[i], val);

	               var c = fuz.metrics.jaro_winkler(self.work[i], val);
                
                   if(big(c).lt(self.threshold) === true){
                        return false;
                        break;
                   } else {
                        variance=big(variance).add(c).toFixed();
                   }
                } 
                
                if(big(variance).gt(0) == true){
                    worker.result = "W:"+self.threshold+":"+variance+":"+val+":"+worker.work.join("+");
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
    } else if(generating == false && msg.type == "work") {

        generating = true;
        worker.threshold = msg.data.threshold;
        worker.work = msg.data.work;

        worker.startTimer = new Date();

        // TODO: Move this part into node domains

        while(worker.mine() == false) { }

    } else if(msg.type == "update"){

        Object.keys(msg.data).map(function(k){
            miner[k] = msg.data[k];
        });

    }

});

