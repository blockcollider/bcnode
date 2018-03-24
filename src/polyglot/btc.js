const Message = require("bitcore-message");

class Bitcoin {
  constructor (opts) {

        const options = {}

        if(opts) {
        for (let o in opts) { options[o] = opts[o]; }
        }

    }

  generator () {}

  createToken () {}

  validSignature (addr, msg, signature) {

        if(Buffer.isBuffer(addr) === true){
             addr = addr.toString();
        }

        if(Buffer.isBuffer(msg) === true){
             msg = msg.toString();
        }
        
        if(Buffer.isBuffer(signature) === true){
             signature = signature.toString();
        }

        try { 
          return Message(msg).verify(addr, signature);
        } catch(err) { 
          console.trace(err);
          return Message(msg).verify(addr, signature);
        }

  }
}

module.exports = Bitcoin
