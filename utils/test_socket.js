
var socket = require("socket.io")(6600);
var eth = require('./eth_block.json');
var btc = require('./btc_block.json');

socket.on("connection", function(client){

    console.log("client connected");

    client.on("pow", function(msg){
        console.log("-------------------WORK-----------------------");

        console.log(msg);

        setTimeout(function() {

            socket.emit("block", btc);
            socket.emit("block", eth);

        }, 2000);

    });

    socket.emit("block", btc);
    socket.emit("block", eth);
    socket.emit("block", btc);
    socket.emit("block", btc);
    socket.emit("block", btc);
    socket.emit("block", btc);
    socket.emit("block", btc);
    socket.emit("block", eth);
    socket.emit("block", eth);
    socket.emit("block", eth);
    socket.emit("block", eth);
    socket.emit("block", eth);

    setTimeout(function() {

        socket.emit("block", btc);
        socket.emit("block", eth);

    }, 9000);

});
