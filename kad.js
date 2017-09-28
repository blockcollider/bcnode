
const { Transform } = require('stream');
const kad = require('kad');
const Discovery = require('./discovery.js'); 
const Crypt = require("./crypt.js");
const string = require("./strings.js");
 
const node = kad({
  identity: string.sha("gold"),
  transport: new kad.UDPTransport(),
  storage: require('levelup')('kad_storage.db'),
  contact: { hostname: 'localhost', port: 9901 }
});

var discovery = new Discovery();

var crypt = new Crypt();

var peers = [];

var scan = discovery.start({
        id: "localhost:9901" 
    });

    scan.on("connection", function(peer){

        peer.write(crypt.writeStr("i*localhost*9901"));
           
        //console.log(Object.getPrototypeOf(peer));
        peers.push(peer);

    });
 
node.listen(9901);

node.rpc.serializer.prepend(new Transform({
  transform: function(data, encoding, callback) {
		console.log(data);
  },
  objectMode: true
}));

node.rpc.deserializer.append(new Transform({
  transform: function(data, encoding, callback) {
		console.log(data);
  },
  objectMode: true
}));


setInterval(function(){

    node.iterativeStore(string.sha("town"), "music3", function(err, nodes){

        console.log(nodes);

    });

}, 5000);


setInterval(function(){

   // node.iterativeFindValue(string.sha("house"), function(err, nodes){

   //     console.log(nodes);

   // });

}, 9000);
