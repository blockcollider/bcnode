
const CODE = "91c646ef-c3fd-4dd0-9dc9-eba5c5600549" // code we found on github
const blockexplorer = require('blockchain.info/blockexplorer').usingNetwork(3)


class Bitcoin {

    getBlock(height, cb) {
      try {

          blockexplorer.getBlockHeight(height, { apiCode: CODE }).then(function(data){
              const block = data.blocks[0];
              cb(null, block);
          });
      } catch(err) {
            cb(err);
      }

    }

}

module.exports = Bitcoin;