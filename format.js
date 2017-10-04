

var Format = {

    roverBlockToEdgeBlock: function(block){

          var edge = {}
              edge.tag = block.id;
              edge.n = block.data.blockNumber;
              edge.input = block.data.blockHash;
              edge.ph = block.data.prevHash;

          return edge;

    }

}


module.exports = Format;
