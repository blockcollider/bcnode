
const nrg = require("./nrgConverter.js");
const btc = require("./btcConverter.js");
const eth = require("./ethConverter.js");
const lsk = require("./lskConverter.js");
const neo = require("./neoConverter.js");
const wav = require("./wavConverter.js");

class Converter { 

    generator(opts) {

    }

    nrg(v, unit){
        return new nrg(v, unit)          
    }

    btc(v, unit){
        return new btc(v, unit)          
    }

    eth(v, unit){
        return new eth(v, unit)          
    }

    lsk(v, unit){
        return new lsk(v, unit)          
    }

    neo(v, unit){
        return new neo(v, unit)          
    }

    wav(v, unit){
        return new wav(v, unit)          
    }
}


module.exports = new Converter();

