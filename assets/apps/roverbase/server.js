const express = require('express');
const app = express();
const path = require('path');

module.exports = function main(opts) {
  const defaults = {
    roverBaseGUIPort: 6601,
    roverBaseSocket: "http://0.0.0.0:6600"
  }

  if(!opts) {
    opts = {}
  }

  if(!opts.roverBaseSocket) {
    opts.roverBaseSocket = defaults.roverBaseSocket;
  }

  if(!opts.roverBaseGUIPort) {
    opts.roverBaseGUIPort = defaults.roverBaseGUIPort;
  }

  const socket = require('socket.io-client')(opts.roverBaseSocket);

  socket.on('connect', function(){
    console.log("connected");
  });

  app.get('/roverBaseSocket', function(req, res) {
    res.json({
      roverBaseSocket: opts.roverBaseSocket
    });
  });
}
