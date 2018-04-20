/* Smart Contract Languages */
const Language = require('./language.js')
const nrg = require('./nrg.js')
const btc = require('./btc.js')
const eth = require('./eth.js')
const lsk = require('./lsk.js')
const neo = require('./neo.js')
const wav = require('./wav.js')

const defaultLanguages = ["nrg","btc","eth","lsk","neo","wav"];
const languagesDict = {
  "nrg": nrg,
  "btc": btc,
  "bitcoin": btc,
  "eth": eth,
  "ethereum": eth,
  "lsk": lsk, 
  "lisk": lsk, 
  "neo": neo, 
  "antshares": neo, 
  "wav": wav,
  "waves": wav
};

class Polyglot {
  constructor (opts) {

    let load = defaultLanguages;
    if(opts) {
      if(opts.load !== null){
        if(typeof opts === 'string'){
          load = [opts];
        } else {
          if(Array.isArray(opts.load) === false){
            opts.load = Array(opts.load); 
          }
          load = opts.load;
        }
      } 
    } 

    for (let l = 0; l < load.length; l++) {
      this[load[l]] = new languagesDict[load[l]]();
    }
  }
}


module.exports = Polyglot
