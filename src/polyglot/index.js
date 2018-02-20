/* Smart Contract Languages */
const Language = require('./language.js')
const nrg = require('./nrg.js')
const btc = require('./btc.js')
const eth = require('./eth.js')
const lsk = require('./lsk.js')
const neo = require('./neo.js')
const wav = require('./wav.js')

class Polyglot {
  constructor (opts) {
    this.nrg = new nrg()
    this.btc = new btc()
    this.eth = new eth()
    this.lsk = new lsk()
    this.neo = new neo()
    this.wav = new wav()
  }
}

module.exports = Polyglot
