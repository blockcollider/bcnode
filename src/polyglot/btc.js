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

        if(Buffer.isBuffer(msg) === false){
             msg = new Buffer(msg);
        }

        const sig = ethUtils.fromRpcSig(signature);
        const prefix = new Buffer("\x19Ethereum Signed Message:\n");
        const prefixedMsg = ethUtils.sha3(
            Buffer.concat([prefix, new Buffer(String(msg.length)), msg])
            );
        const pub = ethUtils.ecrecover(prefixedMsg, sig.v, sig.r, sig.s);
        const addrBuf = ethUtils.pubToAddress(pub);
        const derivedPubAddr  = ethUtils.bufferToHex(addrBuf);

        console.log("derived: "+derivedPubAddr);

    if(addr === derivedPubAddr){
      return true;
    } 
    return false;
  }
}

module.exports = Bitcoin
