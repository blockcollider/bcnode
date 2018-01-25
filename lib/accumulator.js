var xor = require('bitwise-xor');
var crypto = require('crypto');
var colors = require('colors');


var list = "123456789";
  list = list.split("");

var fnc = list.map(function(a){
  return crypto.createHash("sha1").update(a).digest("hex");
});

console.log(fnc);

var acc = fnc.reverse().reduce(function(all, a){

    if(all == ""){

      all = xor(new Buffer(a, "hex"), new Buffer(a, 'hex'));

    } else {

      all = xor(new Buffer(all, "hex"), new Buffer(a, 'hex'));

    }
    console.log(all.toString("hex"));

  return all;  

}, "");


function Accumulator(chars) {

    var charsDefault = "0123456789abcdefghijklmnopqrstuvwxyz";

    if(chars != undefined){
        charsDefault = chars;
    }

    this.index = {}

    charsDefault.split("").reduce(function(all, c){

        if(all[c] == undefined){
            all[c] = 0;
        }

        return all;

    }, this.index);

}


Accumulator.prototype = {

    add: function(str) {

        var self = this;
        if(!str || str.length != 40 || str.constructor != String) 
            throw Error("malformed input");

        str.split("").map(function(a){
            self.index[a]+=1;
        });

    },

    serialize: function(){

        var self = this;

        var s = Object.keys(self.index).reduce(function(all, a){

            all+=""+self.index[a];

            return all;

        }, "");

        return s;

    }
         
}


var a = new Accumulator();

fnc.map(function(k){

    a.add(k);

});





//console.log(a);
//console.log(a.serialize());

