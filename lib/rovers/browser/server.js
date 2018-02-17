
const express = require('express');
const app = express();
const path = require('path');
const socket = require('socket.io-client')('http://0.0.0.0:6600');

socket.on('connect', function(){
    console.log("connected");
});

socket.on("setup", function(data){
    console.log(data);
});

app.use(express.static('public'))

app.get('/', function(req, res) {
   res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(6601, function(err){
    if(err) { console.trace("unable to connect to port"); }
});

