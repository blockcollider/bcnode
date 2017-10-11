
var socket = require("socket.io")(6600);
var time = require("../time.js");
var eth = require('./eth_block.json');
var btc = require('./btc_block.json');

socket.on("connection", function(client){

    console.log("client connected");

    client.on("pow", function(msg){

        console.log("-------------------POW-----------------------");
        console.log(msg);
            
        //console.log(msg);

        //setTimeout(function() {

        socket.emit("block", btc);
        socket.emit("block", eth);

        //}, 2000);

    });

    socket.emit("block", btc);
    socket.emit("block", eth);

    setTimeout(function() {

       socket.emit("block", btc);
       socket.emit("block", eth);

    }, 3000);

});

var pingTimeouts = setInterval(function(){

    time.offset(function(err, offset){

        console.log("ping: "+offset);
        socket.emit("ping", offset);

    });

}, 5000);
