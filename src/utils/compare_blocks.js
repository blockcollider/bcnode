
"use strict";

var crypto = require("crypto");
var big = require('big.js');
var cl = require('clj-fuzzy');
var fs = require('fs');
var moment = require('moment');
var distance = require('compute-cosine-distance');

var ws = fs.createWriteStream("results.csv", "utf8");
    var rm = "timestamp,mean,mutations,chest,ticket\n";
    fs.appendFileSync("results.csv", rm);

function randomSha(){
    var text = ""; 
    var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i<64; i++){
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function jw(a,b){
    if(a == null || b == null || a.constructor != String || a.constructor != String) 
        throw Error("Invalid format")
    return cl.metrics.jaro_winkler(a.toLowerCase(),b.toLowerCase());
}

function sha256d(txt){
    if(txt == null || txt.constructor != String) 
        throw Error("Invalid format")
    return crypto.createHash("sha256").update(crypto.createHash("sha256").update(txt.toLowerCase()).digest("hex")).digest("hex");
}

var mutations = 0;

var btcHeaderRaw = "000000000000000001086c9f26a1cf6b3c31df0bf8f7a6db29e71bffa844cb8d"; // Block #482583

var xmrHeaderRaw = "56eab346fecc1b91027432f01ffb668c572bfa2e47bca24ea67356451d40f3a7"; // Block #1379411 

var btcHeader = sha256d(btcHeaderRaw);

var xmrHeader = sha256d(xmrHeaderRaw);

var last = false;

var chest = 0;

function mine(d) {

    mutations++;

    var newHeaderRaw = randomSha();
    var newHeader = sha256d(newHeaderRaw); 
    var btcScore = jw(newHeader, btcHeader);
    var xmrScore = jw(newHeader, xmrHeader);
    var t = [];

    if(btcScore >= d && xmrScore >= d){

        var ticket = 0;
        var e = 0;
        var mean = big(btcScore).add(xmrScore).div(2).toFixed(8);

        t.push(btcScore);
        t.push(xmrScore);
        if(last == false) { last = newHeader } else {
            var r = newHeader.split("").reduce(function(a, t, i){
                if(last[i] == t){
                    a++;
                }
                if(i > 0){
                    if(last[i-1] == newHeader[i]){
                        e++;
                        if(ticket == 0){
                            ticket = big(1).div(i).toFixed(8);
                        } else {
                            ticket = big(ticket).div(i).toFixed(8);
                        }
                    }
                }
                return a;
            }, 0);
            chest = chest + r;
        }

        //console.log("m: "+mean+" mu: "+mutations+" h: "+newHeader+" chest: "+chest+" e: "+ticket);
        console.log("m: "+mean+" mu: "+mutations+" chest: "+chest+" e: "+ticket);

        var rm = [moment().unix(), mean,mutations,chest,ticket];

        fs.appendFileSync("results.csv", rm.join(",")+"\n");


    }
    return t; 

}

console.log("btcHeader: "+btcHeader);
console.log("xmrHeader: "+xmrHeader);

var score = 0;

while(true)
    var r = mine(0.72)







