var swarm = require('discovery-swarm')

var sw = swarm()

sw.listen(9960)

    // take the last 3 blocks of any compatible blockchain and concatentate the first 12 characters
    // listen for peers from the last three of any blocks

sw.join('ubuntu-14.04') // can be any id/name/hash

sw.on('connection', function (connection) {
    console.log(connection);
  console.log('found + connected to peer')
})
