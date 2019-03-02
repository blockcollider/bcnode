const BN = require('bn.js')
const config = require('./config')
const crypto = require('./crypto')
const Unit = require('./unit')
const debug = require('debug')('bcnode:script:stack')
const { dist } = require('../mining/primitives')

const BN_ZERO = new BN(0, 16)
const BN_SCHNACK_NARG_MAX = new BN(128, 16)
const MIN_TAKER_ADDR_LENGTH = 28
const ENABLE_INFINITE_Q = process.env.ENABLE_INFINITE_Q || false
const INFINITE_Q_CASCADES = process.env.INFINITE_Q_CASCADES || false
const INFINITE_Q_MEM_HEIGHT = parseInt(process.env.INFINITE_Q_MEM_HEIGHT, 10) || 2000

function isValidIp (ipaddress: string): boolean {
  if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {
    return true
  }
  return false
}

function getOutpointsOfCallback (callbackKey, outputs) {
  if (callbackKey === undefined || callbackKey === undefined) {
    throw new Error('callbackTxHash data not provided')
  }

  return outputs.reduce((all, output) => {
    var callbackScript = String.fromCharCode.apply(null, output.getOutputScript())
    if (callbackScript.indexOf(callbackKey) === 0) {
      if (all === false) {
        all = []
      }
      all.push(output)
    }
    return all
  }, false)
}

function StackEmptyException () {
  this.toString = () => {
    return 'Attempted to pop from an empty stack.'
  }
}

var serialize = (data) => {
  return data.toString(config.base)
}
var deserialize = (data) => {
  return new BN(data, config.base)
}

class ScriptStack {
  constructor (env) {
    if (env !== undefined) {
      if (env.env !== undefined) {
        this.env = env.env
      } else {
        this.env = env
      }
    } else {
      this.env = false
    }
  }
  // Basic array operations
  push () {
    var serialized = [].map.call(arguments, serialize)
    return Array.prototype.push.apply(this, serialized)
  }
  pop () {
    if (this.length === 0 || this.length == null) {
      throw new StackEmptyException()
    }
    return deserialize(Array.prototype.pop.apply(this))
  }
  peek () {
    var value = this.pop()
    this.push(value)
    return value
  }
  lookback (n) {
    if (!n || n < 2 || n > 5 || n.constructor.name !== 'Number') {
      return this.peek()
    }
    var st = []
    while (n > 0) {
      n--
      st.unshift(this.pop())
    }
    st.map((s) => {
      this.unshift(s)
    })
    return st
  }
  popn (n) {
    if (!n || n < 2 || n > 128 || n.constructor.name !== 'Number') {
      return this.pop()
    }
    var st = []
    while (n > 0) {
      n--
      st.push(this.pop())
    }
    return st
  }

  // Constants
  OP_0 () {
    this.push(0)
  }
  OP_FALSE () {
    this.OP_0()
  }
  OP_1NEGATE () {
    this.OP_1()
    this.OP_NEGATE()
  }
  OP_1 () {
    this.push(1)
  }
  OP_2 () {
    this.push(2)
  }
  OP_3 () {
    this.push(3)
  }
  OP_TRUE () {
    this.OP_1()
  }

  // Stack operations
  OP_IFDUP () {
    var top = this.peek()
    if (top.cmp(BN_ZERO) !== 0) {
      this.push(top)
    }
  }
  OP_DEPTH () {
    this.push(this.length)
  }
  OP_DROP () {
    this.pop()
  }
  OP_2DROP () {
    this.OP_DROP()
    this.OP_DROP()
  }
  OP_DUP (n) {
    n = n || 1

    // Extract top `n` values
    var values = []
    for (var i = 0; i < n; i++) {
      values.push(this.pop())
    }
    values.reverse()

    for (var j = 0; j < 2 * n; j++) {
      this.push(values[j % values.length])
    }
  }
  OP_2DUP () {
    this.OP_DUP(2)
  }
  OP_3DUP () {
    this.OP_DUP(3)
  }
  OP_NIP () {
    var top = this.pop()
    this.pop()
    this.push(top)
  }
  OP_OVER () {
    var top = this.pop()
    var bottom = this.peek()
    this.push(top)
    this.push(bottom)
  }
  OP_PICK () {
    var n = this.pop()
    var temp = []
    for (var i = 0; i < n - 1; i++) {
      temp.push(this.pop())
    }
    var nth = this.peek()
    for (var j = 0; j < n - 1; j++) {
      this.push(temp[j])
    }
    this.push(nth)
  }
  OP_ROLL () {
    var n = this.pop()
    var temp = []
    for (var i = 0; i < n - 1; i++) {
      temp.push(this.pop())
    }
    var nth = this.pop()
    for (var j = 0; j < n - 1; j++) {
      this.push(temp[j])
    }
    this.push(nth)
  }
  OP_ROT () {
    var values = [this.pop(), this.pop(), this.pop()]
    values.reverse()
    for (var i = 0; i < values.length; i++) {
      this.push(values[(i + 1) % values.length])
    }
  }
  OP_SWAP () {
    var values = [this.pop(), this.pop()]
    for (var i = 0; i < values.length; i++) {
      this.push(values[i])
    }
  }
  OP_TUCK () {
    var values = [this.pop(), this.pop()]
    values.reverse()
    for (var i = 0; i < values.length + 1; i++) {
      this.push(values[i % values.length])
    }
  }
  OP_2OVER () {
    var values = [this.pop(), this.pop(), this.pop(), this.pop()]
    values.reverse()
    for (var i = 0; i < values.length + 2; i++) {
      this.push(values[i % values.length])
    }
  }
  OP_2ROT () {
    var values = [this.pop(), this.pop(), this.pop(), this.pop(), this.pop(), this.pop()]
    values.reverse()
    for (var i = 0; i < values.length; i++) {
      this.push(values[(i + 2) % values.length])
    }
  }
  OP_2SWAP () {
    var values = [this.pop(), this.pop(), this.pop(), this.pop()]
    values.reverse()
    for (var i = 0; i < values.length; i++) {
      this.push(values[(i + 2) % values.length])
    }
  }

  // Bitwise logic
  OP_INVERT () {
    this.push(this.pop().not())
  }
  OP_AND () {
    this.push(this.pop().and(this.pop()))
  }
  OP_OR () {
    this.push(this.pop().or(this.pop()))
  }
  OP_XOR () {
    this.push(this.pop().xor(this.pop()))
  }
  OP_EQUAL () {
    var b = this.pop()
    var a = this.pop()
    debug(`comparing ${a.toString(16)}, ${b.toString(16)}, r: ${a.eq(b)}`)
    if (a.eq(b)) {
      this.OP_1()
    } else {
      this.OP_0()
    }
  }
  OP_EQ () {
    var b = this.pop()
    var a = this.pop()
    debug(`comparing ${a.toString(16)}, ${b.toString(16)}, r: ${a.eq(b)}`)
    if (a.neq(b)) {
      this.OP_0()
    }
  }
  // Artithmetic operations
  OP_1ADD () {
    this.push(this.pop().add(1))
  }
  OP_1SUB () {
    this.push(this.pop().sub(1))
  }
  OP_2MUL () {
    this.push(this.pop().mul(2))
  }
  OP_2DIV () {
    this.push(this.pop().div(2))
  }
  OP_NEGATE () {
    this.push(this.pop().mul(-1))
  }
  OP_ABS () {
    this.push(this.pop().abs())
  }
  OP_NOT () {
    if (this.pop().eq(0)) {
      this.OP_1()
    } else {
      this.OP_0()
    }
  }
  OP_0NOTEQUAL () {
    if (this.pop().eq(0)) {
      this.OP_0()
    } else {
      this.OP_1()
    }
  }
  OP_ADD () {
    var b = this.pop()
    var a = this.pop()
    this.push(a.add(b))
  }
  OP_SUB () {
    var b = this.pop()
    var a = this.pop()
    this.push(a.sub(b))
  }
  OP_MUL () {
    this.push(this.pop().mul(this.pop()))
  }
  OP_DIV () {
    var divisor = this.pop()
    var dividend = this.pop()
    this.push(dividend.div(divisor))
  }
  OP_MOD () {
    var divisor = this.pop()
    var dividend = this.pop()
    this.push(dividend.mod(divisor))
  }
  OP_LSHIFT () {
    var numBits = this.pop()
    var value = this.pop()
    this.push(value.shln(numBits))
  }
  OP_RSHIFT () {
    var numBits = this.pop()
    var value = this.pop()
    this.push(value.shrn(numBits))
  }
  OP_BOOLAND () {
    var b = this.pop()
    var a = this.pop()
    if (a.cmp(BN_ZERO) !== 0 && b.cmp(BN_ZERO) !== 0) {
      this.OP_1()
    } else {
      this.OP_0()
    }
  }
  OP_BOOLOR () {
    var b = this.pop()
    var a = this.pop()
    if (a.cmp(BN_ZERO) !== 0 || b.cmp(BN_ZERO) !== 0) {
      this.OP_1()
    } else {
      this.OP_0()
    }
  }
  OP_NUMEQUAL () {
    this.OP_EQUAL()
  }
  OP_NUMNOTEQUAL () {
    var b = this.pop()
    var a = this.pop()
    if (a.cmp(b) !== 0) {
      this.OP_1()
    } else {
      this.OP_0()
    }
  }
  OP_LESSTHAN () {
    var b = this.pop()
    var a = this.pop()
    if (a.cmp(b) < 0) {
      this.OP_1()
    } else {
      this.OP_0()
    }
  }
  OP_GREATERTHAN () {
    var b = this.pop()
    var a = this.pop()
    if (a.cmp(b) > 0) {
      // yes
      this.OP_1()
    } else {
      this.OP_0()
    }
  }
  OP_LESSTHANOREQUAL () {
    var b = this.pop()
    var a = this.pop()
    if (a.cmp(b) <= 0) {
      this.OP_1()
    } else {
      this.OP_0()
    }
  }
  OP_GREATERTHANOREQUAL () {
    var b = this.pop()
    var a = this.pop()
    if (a.cmp(b) >= 0) {
      this.OP_1()
    } else {
      this.OP_0()
    }
  }
  OP_MIN () {
    var b = this.pop()
    var a = this.pop()
    if (a.cmp(b) <= 0) {
      this.push(a)
    } else {
      this.push(b)
    }
  }
  OP_MAX () {
    var b = this.pop()
    var a = this.pop()
    if (a.cmp(b) >= 0) {
      this.push(a)
    } else {
      this.push(b)
    }
  }
  OP_WITHIN () {
    var max = this.pop()
    var min = this.pop()
    var x = this.pop()
    if (x.cmp(min) >= 0 && x.cmp(max) < 0) {
      this.OP_1()
    } else {
      this.OP_0()
    }
  }

  // Crypto
  OP_RIPEMD160 () {
    this.push(crypto.ripemd160(this.pop()))
  }
  OP_SHA1 () {
    this.push(crypto.sha1(this.pop()))
  }
  OP_SHA256 () {
    this.push(crypto.sha256(this.pop()))
  }
  OP_HASH160 () {
    this.push(crypto.ripemd160(crypto.sha256(this.pop())))
  }
  OP_HASH256 () {
    this.push(crypto.sha256(crypto.sha256(this.pop())))
  }
  OP_BLAKE2BL () {
    const h = this.pop()
    debug(`OP_BLAKE2BL(): raw: ${h.toString(16)}, h: ${crypto.blake2bl(h)}`)
    this.push(crypto.blake2bl(h))
  }
  /* BLAKE2BL with slicing 32 */
  OP_BLAKE2BLS () {
    const h = this.pop()
    debug(`OP_BLAKE2BLS(): raw: ${h.toString(16)}, h: ${crypto.blake2bls(h)}`)
    this.push(crypto.blake2bls(h))
  }
  /* alias compressed for hashing once with BLAKE2BL and once with BLAKE2BLS */
  OP_BLAKE2BLC () {
    const h = this.pop()
    const bl = crypto.blake2bl(h)
    const blc = crypto.blake2bls(bl)
    debug(`OP_BLAKE2BLC(): raw: ${h.toString(16)}, hash: ${blc}`)
    this.push(blc)
  }
  /*
   * [dateFrom:MMDDYYYY] [dateTo:MMDDYYYY] [type:VOLUME|RATE] [rateType:TGCR|BGCR|SOFR] OP_RATEMARKET
   * VCLYSPUL_YLNPVUHS
   */
  OP_RATEMARKET () {
    // Rates types onto loan market call TGCR, BGCR, SOFR
    // Must be paired with OP_HTTPSTATUS
    // REF: http://markets.newyorkfed.org/api/
    // 1 - Default
    debug(`OP_RATEMARKET()`)
  }
  /*
   * [callbackOutHash] [callbackOutIndex] [takerToAddress] [takeFromAddress] OP_TAKERPAIR
   */
  OP_TAKERPAIR () {
    var callbackHash = this.pop()
    var callbackIndex = this.pop()
    var from = this.pop()
    var to = this.pop()
    var fl = from.length
    var tol = to.length

    if (this.env.CALLBACK_TX === undefined || this.env.CALLBACK_TX === false) {
      this.OP_0()
      return
    }

    if (fl < MIN_TAKER_ADDR_LENGTH || tol < MIN_TAKER_ADDR_LENGTH) {
      this.OP_0()
    } else {
      this.OP_1()
    }

    // TODO: add a test here to confirm that are possible addresses
  }
  // takes a
  OP_DATATOHASH () {
    const threshold = this.pop() // optional / 0
    const hashingAlgorithm = this.pop() // optional / 0
    const ownersAddress = this.pop()
    const hexToSumWithOwners = this.pop()
    const hashOfSum = this.pop()
    let summedHash = false
    let selectedHash
    if (hashingAlgorithm === '0' || hashingAlgorithm === 'blake2blcnoschnorr') {
      selectedHash = crypto.blake2blc
    } else if (hashingAlgorithm === 'blake2blnoschnorr') {
      selectedHash = crypto.blake2bl
    } else if (hashingAlgorithm === 'blake2blsnoschnorr') {
      selectedHash = crypto.blake2bls
    } else if (hashingAlgorithm === 'sha1noschnorr') {
      selectedHash = crypto.sha1
    } else if (hashingAlgorithm === 'sha256noschnorr') {
      selectedHash = crypto.sha256
    } else if (hashingAlgorithm === 'ripemd160noschnorr') {
      selectedHash = crypto.ripemd160
    } else {
      // hashing algorithm not supported
      this.OP_0()
      return this.OP_VERIFY()
    }

    summedHash = selectedHash(new BN(ownersAddress, 'hex').add(new BN(hexToSumWithOwners, 'hex').add(new BN(hashingAlgorithm)).add(new BN(threshold))).toString('hex'))
    // if there is a provided threshold the solution does not include the sum of the hash
    // only the hexToSumWithOwners
    if (threshold !== '0') {
      if (new BN(selectedHash(hexToSumWithOwners)).cmp(new BN(hashOfSum))) {
        if (new BN(dist(summedHash, hashOfSum)).lte(new BN(threshold))) {
          this.push(ownersAddress)
        } else {
          this.OP_0()
          return this.OP_VERIFY()
        }
      } else {
        this.OP_0()
        return this.OP_VERIFY()
      }
      // var distance = dist(hash, comparison)
    } else {
      if (summedHash === false) {
        this.OP_0()
        return this.OP_VERIFY()
      }
      debug(`OP_DATATOHASH(): raw: ${summedHash.toString(16)}, h: ${hashOfSum}`)
      if (new BN(summedHash).cmp(new BN(hashOfSum)) !== 0) {
        // failed
        this.OP_0()
      } else {
        // if success push owners address back onto stash
        this.push(ownersAddress)
      }
    }
  }
  /*
   * [humanReadable] [set] OP_X
   */
  OP_X () { // MSC2010 + VANITY address support
    const set = this.pop()
    const hash = this.pop()
    debug(`OP_X(): title: ${hash}`)
    if (this.env.X[set] !== undefined) {
      if (this.env.X[set][hash] !== undefined) {
        this.push(this.env.X[set][hash])
      } else {
        // failed to find value for key in category
        this.OP_0()
      }
    } else {
      // failed to find category
      this.OP_0()
    }
  }
  /*
   * [order type] OP_ORDTYPE
   */
  OP_ORDTYPE () {
    // FIX2 implementation, requires OP_FIX2 operating context
    // REF: https://www.onixs.biz/fix-dictionary/4.3/tagNum_40.html
    // 1 - Default
    debug(`OP_ORDTYPE()`)
  }
  /*
   * ALPHA: [blockHeightExpiration] [dnsProvider] [httpAddress] [expectedStatus] OP_HTTPSTATUS
   */
  OP_HTTPSTATUS () {
    debug(`OP_HTTPSTATUS()`)
  }
  /*
   * ALPHA: [blockHeightExpiration] [blakeAssert] [dnsProvider] [httpAddress] [selector] [0|expected value] OP_HTTPSELECT
   */
  OP_HTTPSELECT () {
    debug(`OP_HTTPSELECT()`)
  }
  /*
   * [distanceAlgorithm] [minimumDistance] [lowerBound] [upperBound] OP_MYLX
   */
  OP_MYLX () {
    // Min yearly linked cross
    debug(`OP_MYLX()`)
  }
  /*
   * [signature] [minimumDistance] OP_NONCELOCKBLC
   * evaluates the work submitted in the nonce field as evidence of the lock
   */
  OP_NONCELOCKBL () {
    // uses
    // combining the hash and signature of the
    // hash the concatentaion of outpoint.getHash() + outPoint.getHash() + outPoint.getIndex() using compressed blake
    // first 40 characters of the
    var data = this.env.INPUT_TX.getNonce()
    var address = data.slice(0, 42) // public key payment address
    var work = data.slice(42) // remaining work to be evaluated against the distance
    var hash = crypto.blake2bl(data)

    var threshold = this.pop() // minimum threshold to be achieved
    var signature = this.pop() // signs the data provided
    // var comparison = crypto.blake2bl(this.outpoint.getHash() + outpoint.getIndex())
    // var distance = dist(hash, comparison)
    // if (comparison < distance) {
    //    this.OP_0()
    // } else {
    //    if signature(hash) {
    //      this.OP_1()
    //    } else {
    //      this.OP_0()
    //    }
    // }
    debug(`OP_NONCELOCKBLC()`)
  }
  /*
   * [takerToAddress] [takeFromAddress] [fromChain] [toChain] [toMakerAddress] [buyUnits] [sellUnits] OP_MAKERCOLL
   */
  OP_MAKERCOLL () {
    /*
     * !! GET TRANSACTION MAKER TAKER
     * Get the callback hash
     * The porvided takerpair must be found in an input as well as provided by the spending transaction
     *  this.OP_0() // failed
     *  this.OP_1() // NA
     *  this.OP_2() // taker & maker pass
     *  this.OP_3() // maker succeed, taker failed
     *  this.OP_4() // taker succeed, maker failed
     */
    // comment example maker wants to buy 1 BTC with 10 ETH
    var sellUnits = this.pop() // 10 ETH -> sends 10 units
    var buyUnits = this.pop() // 1 btc -> gets 1 unit

    var makerToAddress = this.pop() // btcAddress -> at this address
    var denomChain = this.pop().toLowerCase() // btc -> from this blockchain
    var numerChain = this.pop().toLowerCase() // eth -> paying from this blockchain
    var takerFromAddress = this.pop() // btc address
    var takerToAddress = this.pop() // eth address
    debug(`OP_MAKERCOLL(): makerDepositAddress: ${makerToAddress}, denomChain: ${denomChain}, numerChain: ${numerChain}, takerDenomAddress: ${takerFromAddress}, takerNumerAddress: ${takerToAddress}`)
    /*
     *  TAKER: FALSE, MAKER: FALSE
     */
    if (this.env.MARKED_TXS.length < 0) {
      this.OP_0()
      return
    }
    var nrgCollateral = this.env.OUTPUT_TX.getValue() // 600 NRG
    var nrgUnit = this.env.OUTPUT_TX.getUnit() // 60
    var rateAmount = Unit.div(buyUnits, sellUnits)
    var amountMakerSends = new BN(rateAmount)
    var makerSuccess = false
    var takerSuccess = false
    // 1 btc or greater value sent BY taker
    var takerAmountSent = this.env.MARKED_TXS.reduce((sum, mtx) => {
      if (mtx.getFromAddr() === takerFromAddress && // confirm value is coming from maker address
          mtx.getToAddr() === makerToAddress && // confirm value is being sent to maker address
          mtx.getId() === denomChain) { // enforce it is on the correct chain
        return sum.add(new BN(mtx.getValue()))
      }
      return sum
    }, new BN(0))
    // 10 eth or greater value recieved BY taker
    var takerAmountRecieved = this.env.MARKED_TXS.reduce((sum, mtx) => {
      if (mtx.getToAddr() === takerToAddress &&
           mtx.getId() === numerChain) {
        return sum.add(new BN(mtx.getValue()))
      }
      return sum
    }, new BN(0))

    if (takerAmountSent.gte(new BN(buyUnits))) {
      takerSuccess = true
    }
    if (takerAmountRecieved.gte(new BN(sellUnits))) {
      makerSuccess = true
    }
    // !!! IMPORTANT !!!
    //  Taker is approved or denied first (so that maker cannot send value to his/her own address for a better cross
    /*
     * TAKER: FALSE, MAKER: FALSE
     */
    if (!takerSuccess && !makerSuccess) {
      this.OP_0()
    /*
     * TAKER: TRUE, MAKER: TRUE
     */
    } else if (takerSuccess && makerSuccess) {
      this.OP_2()
    /*
     * TAKER: FALSE, MAKER: TRUE
     */
    } else if (!takerSuccess && makerSuccess) {
      this.OP_3()
    /*
     * TAKER: TRUE, MAKER: FALSE
     */
    } else if (takerSuccess && !makerSuccess) {
      this.OP_4()
    /*
     * Catch all fail
     */
    } else {
      this.OP_0()
    }
  }
  OP_PROMISE () {
    // !! OP_PROMISE CANNOT USE OP_NOOP !!!
    // remove args (use in async context load)
    var partialSignature = this.pop()
    var promiseRProof = this.pop()
    var blockchainOfChallenge = this.pop()
    var blockchainTxIdWatch = this.pop()
    debug(`OP_PROMISE(): partialSignature: ${partialSignature} promiseRProof: ${promiseRProof} blockchainOfChallenge: ${blockchainOfChallenge} blockchainTxIdWatch: ${blockchainTxIdWatch}`)
  }
  OP_SCHNACK () { // always stored with 5 arguments
    // !! OP_SCHNACK CANNOT USE OP_NOOP !!!
    // remove args (use in async context load)
    var version = new BN(this.pop(), 16) // Default 0
    //   reserved = 2
    //   reserved = 3
    //   reserved = 4
    //   callbackSchnack = 5
    //   darkSchnack = 6
    var optionalHashedR = this.pop() // Default 0
    var msg = this.pop() // message or reference to callback id initating
    var nArgs = new BN(this.pop(), 16) // number of args to pop to create the combined public, defaul 0
    var combinedPublicKeyHash = this.pop()

    if (this.env.CALLBACK_TX !== undefined && this.env.CALLBACK_TX !== false && version.eq(new BN(5))) {
      // callbackSchnorr must have callback
      this.OP_0()
    }

    if (version.eq(new BN(5)) === true) {
      var args = this.popn(nArgs)
      // first argument should be combined signature
      var combinedSignatures = args.unshift()
      // var combinedPubKey = crypto.schnorrRecoverPublicKey(combinedSignatures, msg)
      var combinedKey = crypto.schnorrCombinePublicKeys(args)
      var valid = crypto.verify(msg, combinedSignatures, combinedKey)
      if (valid === true) {
        args.forEach((a) => {
          this.push(a)
          this.push('OP_CALLBACK')
          this.OP_CALLBACK()
        })
      } else {
        // signature failed
        this.OP_0()
      }
    } else if (version.eq(new BN(6)) === true) {
      // darkSchnorr disabled 
      this.OP_0()
    } else {
      this.OP_0()
    }
  }
  /*
   * [nextHash] [previousHash] [dataBytes] [dataHash] [networkAddress] OP_Q
   */
  OP_Q () {
    if (!ENABLE_INFINITE_Q) {
      return
    }
    // if the latest block does not exist ignore the operation
    if (this.env.LATEST_BLOCK === false) {
      return
    }

    // if the referenced block does not exist ignore the operation
    if (this.env.OUTPOINT_TX_BLOCK === false) {
      return
    }

    // if block height is below INIFINITE_Q memory ignore
    if (new BN(this.env.OUTPOINT_TX_BLOCK.getHeight()).lt(new BN(this.env.LATEST_BLOCK.getHeight()).minus(new BN(INFINITE_Q_MEM_HEIGHT)))) {
      return
    }
    // optional next hash otherwise 0
    var nextHash = this.pop()
    // optional previous hash otherwise 0
    var previousHash = this.pop()
    // number of bytes in expected hash 0 if unknown
    var dataBytes = this.pop()
    // hash of data
    var dataHash = this.pop()
    // if data hash is '0' network address is key
    var networkAddress = this.pop()
    var query = `${nextHash}:${previousHash}:${dataHash}`
    // if the dataHash is not provided assume the network address is the key
    if (dataHash === '0' || dataHash === 'NA') {
      query = `${nextHash}:${previousHash}:${networkAddress}`
    }
    debug(`OP_Q(): bytes: ${dataBytes} dataHash: ${txHashIndex} networkAddress: ${networkAddress} previousHash: ${previousHash} query: ${query}`)
    // OVERNET buffer '0020R01'
    // TODO add module for option Redis plugin
    // IF CASCADES broadcast the query response data to any connnected peers which have not recieved it or sent it
    // ELSE IF its a valid ip send the message directly, if not
    // ELSE broadcast over DHT
    if (INFINITE_Q_CASCADES) {
      // TODO: post to rpc outpoint for broadcast to all peers (who have not recieved it or sent it)

    } else if (isValidIp(networkAddress) === true) {
      // otherwise broadcast query response on DHT

    } else {

    }
  }
  OP_CALLBACK () {
    // !! OP_CALLBACK CANNOT USE OP_NOOP !!!
    // remove args (use in async context load)

    if (this.env.INPUT_TX === undefined || this.env.INPUT_TX === false) {
      // fail if callback cannot get complete current operating context of the transaction
      this.OP_0()
    }

    var txHashIndex = this.pop()
    var txHash = this.pop()
    var txKey = txHash + ' ' + txHashIndex

    if (this.env.CALLBACK_LOCAL_OUTPUTS === false) {
      var outputs = getOutpointsOfCallback(txKey, this.env.INPUT_TX.getOutputsList())
      if (outputs === false) {
        this.OP_0()
      } else {
        this.env.CALLBACK_LOCAL_OUTPUTS = outputs
        var callbackOutputsTotalValue = outputs.reduce((all, tx) => {
          all = all.add(new BN(tx.getValue()))
          return all
        }, new BN(0))

        var txOutPointValue = this.env.CALLBACK_TX.getOutputsList()[txHashIndex].getValue()
        if (new BN(callbackOutputsTotalValue).lt(new BN(txOutPointValue))) {
          // spending monoid outputs required the full tx value
          this.OP_0()
        }
      }
    }
    debug(`OP_CALLBACK(): tx: ${txHash} index: ${txHashIndex}`)
  }
  OP_MONOID () {
    // OP_MONOID can only be placed in a script once at the head.
    // the user SPENDING this transaction is about to create a script with 'op_callback'

    if (this.env.INPUT_TX === undefined || this.env.INPUT_TX === false) {
      // cannot verify callbacks placed in outputs unless tranasction exists
      return this.OP_0()
    }

    var txHashIndex = this.env.OUTPOINT_INDEX.getValue().toString(16)
    var txHash = this.env.OUTPOINT_TX.getOutputsList()[txHashIndex].getHash().toString('hex')
    var txOutPointValue = this.env.OUTPOINT_TX.getOutputsList()[txHashIndex].getValue()
    var txKey = txHash + ' ' + txHashIndex

    var outputs = getOutpointsOfCallback(txKey, this.env.INPUT_TX.getOutputsList())

    if (outputs === false) {
      this.OP_0()
    } else {
      this.env.CALLBACK_LOCAL_OUTPUTS = outputs
      var callbackOutputsTotalValue = outputs.reduce((all, tx) => {
        all = all.add(new BN(tx.getValue()))
        return all
      }, new BN(0))

      if (new BN(callbackOutputsTotalValue).lt(new BN(txOutPointValue))) {
        // spending monoid outputs required the full tx value
        this.OP_0()
        return
      }
    }
    // assert only one monoid used in input outpoints
    // flag for tx set
    debug(`OP_MONOID()`)
  }
  OP_MONAD (script) {
    // moves logic to outputs and sets morphism locks on values in and out
    console.log('assert one and only one output has the matching script')

    if (this.env.INPUT_TX === null || this.env.INPUT_TX === false) {
      // cannot verify callbacks placed in outputs unless tranasction exists
      return this.OP_0()
    }

    let foundMonad = false
    const outputs = this.env.INPUT_TX.getOutputsList()
    const hasOnlyOneMonad = outputs.reduce((all, output) => {
      const st = output.getOutputScript().toString('hex').replace('OP_MONAD ', '').replace(' OP_ENDMONAD', '')
      if (st === script && foundMonad === false) {
        foundMonad = true
        all = true
      } else if (st === script && foundMonad === true) {
        // fail -> duplicate monadic outputs found
        all = false
      }
    }, false)
    debug(`OP_MONAD() has only one: ${hasOnlyOneMonad}`)
    if (!hasOnlyOneMonad) {
      this.OP_0()
    } else {
      // otherwise pass through the stack
      this.OP_1()
    }
  }
  // sets transaction as custom operation noting changes to be monitored
  OP_MARK () {
    var expire = this.pop()
    var blockchain = this.pop()
    var address = this.pop()
    debug(`OP_MARK`)
  }
  OP_ENVOUTPOINTUNIT () {
    // loads the environment variable if available from the injected script
    debug(`OP_ENVOUTPOINTUNIT`)
    var index = this.pop()
    if (this.env !== undefined &&
      this.env.OUTPOINT_TX !== undefined &&
      this.env.OUTPOINT_TX !== false) {
      var outpoint = this.env.OUTPOINT_TX.getOutputsList()[index]
      this.push(outpoint.getUnit())
    } else {
      this.OP_0()
    }
  }
  OP_ENVOUTPOINTVALUE () {
    // loads the environment variable if available from the injected script
    debug(`OP_ENVOUTPOINTVALUE`)
    var index = this.pop()
    if (this.env !== undefined &&
      this.env.OUTPOINT_TX !== undefined &&
      this.env.OUTPOINT_TX !== false) {
      var outpoint = this.env.OUTPOINT_TX.getOutputsList()[index]
      this.push(outpoint.getValue())
    } else {
      this.OP_0()
    }
  }
  OP_ENVOUTPOINTVCLYSPUL () {
    // loads the environment variable if available from the injected script
    debug(`OP_ENVOUTPOINTVCLYSPUL`)
    if (this.env !== undefined &&
      this.env.OUTPOINT_TX !== undefined &&
      this.env.OUTPOINT_TX !== false) {
      this.push(this.env.OUTPOINT_TX.getVclyspul())
    } else {
      this.OP_0()
    }
  }
  OP_ENVOUTPOINTLOCKTIME () {
    // loads the environment variable if available from the injected script
    debug(`OP_ENVOUTPOINTLOCKTIME`)
    if (this.env !== undefined &&
      this.env.OUTPOINT_TX !== undefined &&
      this.env.OUTPOINT_TX !== false) {
      this.push(this.env.OUTPOINT_TX.getLockTime())
    } else {
      this.OP_0()
    }
  }
  OP_ENVOUTPOINTNONCE () {
    // loads the environment variable if available from the injected script
    debug(`OP_ENVOUTPOINTNONCE`)
    if (this.env !== undefined &&
      this.env.OUTPOINT_TX !== undefined &&
      this.env.OUTPOINT_TX !== false) {
      this.push(this.env.OUTPOINT_TX.getNonce())
    } else {
      this.OP_0()
    }
  }
  OP_ENVOUTPOINTHASH () {
    // loads the environment variable if available from the injected script
    debug(`OP_ENVOUTPOINTHASH`)
    if (this.env !== undefined &&
      this.env.OUTPOINT_TX !== undefined &&
      this.env.OUTPOINT_TX !== false) {
      this.push(this.env.OUTPOINT_TX.getHash())
    } else {
      this.OP_0()
    }
  }
  OP_CHECKSIG () {
    // Parse public key
    var pubKey = crypto.processPubKey(this.pop())

    // Parse signature
    var signature = crypto.processSignature(this.pop())

    // Message to verify
    var msg = this.pop()
    debug(`OP_CHECKSIG(): pk: ${pubKey.toString('hex')}, sig: ${signature.toString('hex')}, msg: ${msg}`)

    // Verify signature
    if (crypto.verifySignature(msg, signature, pubKey)) {
      debug(`OP_CHECKSIG(): valid`)
      this.OP_1()
    } else {
      debug(`OP_CHECKSIG(): INVALID`)
      this.OP_0()
    }
  }
  /* OP_DEPSET: Deposit Settlement
   * Compares the outpoint block height with the input block or latest block HEIGHT
   */
  OP_DEPSET () {
    /* env object delvered
     * {
     *   SCRIPT
     *   LATEST_BLOCK
     *   OUTPOINT_TX_BLOCK
     *   CALLBACK_LOCAL_OUTPUTS
     *   CALLBACK_TX
     *   CALLBACK_TX_BLOCK
     *   INPUT_TX_BLOCK
     *   INPUT_TX
     *   OUTPOINT_TX
     *   OUTPOINT_OWNER
     * }
     */
    // if no environment is added to async op code
    if (!this.env) {
      this.OP_0()
    } else {
      var args = this.popn(3)
      var heights = args.reduce((all, a) => {
        if (a !== undefined && a.length > 0) {
          a = a.replace(/\D/g, '')
          if (a.length > 0) {
            all.push(new BN(a))
          }
        }
        return all
      }, [])

      // fail is stack does not provide three valid arguments
      if (heights.length !== 3) {
        debug(`OP_DEPSET(): INVALID`)
        this.OP_0()
      }

      var shift = heights.pop()
      var deposit = heights.pop().add(shift)
      var settle = heights.pop().add(shift)

      // if callback switch operating context to callback block
      var startBlock = this.env.CALLBACK_TX_BLOCK !== false ? this.env.CALLBACK_TX_BLOCK : this.env.OUTPOINT_TX_BLOCK
      var currentBlock = this.env.INPUT_TX_BLOCK !== false ? this.env.INPUT_TX_BLOCK : this.env.LATEST_BLOCK

      if (currentBlock.getHash() === this.env.LATEST_BLOCK.getHash()) {
        debug(`OP_DEPSET(): Using the latest block as current context of transaction`)
      }

      if (startBlock === false) {
        // FALSE the deposit settlement restriction without a startblock
        debug(`OP_DEPSET(): '0' FALSE no start block or outpoint block provided`)
        this.OP_0()
      } else if (new BN(currentBlock.getHeight()).gte(new BN(startBlock.getHeight()).add(settle)) === true) {
        debug(`OP_DEPSET(): '1' TRUE deposit settlment restrictions lifted`)
        this.OP_1()
      } else if (new BN(currentBlock.getHeight()).gte(new BN(startBlock.getHeight()).add(deposit)) === true) {
        debug(`OP_DEPSET(): '3' SETTLE transaction operating within settlement window`)
        // SETTLE: Return '3' the transction is in the settlement window
        this.OP_3()
      } else if (new BN(currentBlock.getHeight()).gt(new BN(startBlock.getHeight()).add(shift)) === true) {
        debug(`OP_DEPSET(): '2' DEPOSIT transaction operating within deposit window`)
        // DEPOSIT: Return '2' the transction is in the deposit window
        this.OP_2()
      } else if (new BN(currentBlock.getHeight()).lte(new BN(startBlock.getHeight()).add(shift)) === true) {
        debug(`OP_DEPSET(): '0' FALSE transaction operating before deposit settlement windows`)
        // FALSE: Return '0' the deposit settlement restriction
        this.OP_0()
      } else {
        // FALSE: Catch all fail
        this.OP_0()
      }
    }
  }

  OP_CHECKSIGNOPUBKEY () {
    // Parse signature
    var signature = crypto.processSignature(this.pop())
    debug(`OP_CHECKSIGNOPUBKEY(): sig: ${signature.toString('hex')}`)

    // Message to verify
    var msg = this.pop()
    debug(`OP_CHECKSIGNOPUBKEY(): msg: ${msg.toString('hex')}`)

    // Recover public key from signature
    var pubKey = crypto.pubKeyFromSignature(msg, signature)
    debug(`OP_CHECKSIGNOPUBKEY(): pubKey: ${pubKey.toString('hex')}`)
    var verifiedStatus = crypto.verifySignature(msg, signature, pubKey)
    debug(`OP_CHECKSIGNOPUBKEY(): verifiedStatus: ${verifiedStatus}`)

    if (verifiedStatus) {
      debug(`OP_CHECKSIGNOPUBKEY(): valid`)
      this.OP_1()
    } else {
      debug(`OP_CHECKSIGNOPUBKEY(): INVALID`)
      this.OP_0()
    }
  }

  OP_CHECKSIGNODATA () {
    // Parse signature
    var signature = crypto.processSignature(this.pop())
    var output
    // Message to verify
    var msg = this.env.OUTPOINT_HASH + ' ' + this.env.OUTPOINT_INDEX
    debug('------------------')
    debug(msg)

    // Recover public key from signature
    var pubKey = crypto.pubKeyFromSignature(msg, signature)
    if (crypto.verifySignature(msg, signature, pubKey)) {
      debug(`OP_CHECKSIGNODATA(): valid`)
      this.OP_1()
    } else {
      debug(`OP_CHECKSIGNODATA(): INVALID`)
      this.OP_0()
    }
  }
  OP_CHECKSCHNORRSIG () {
    debug(`OP_CHECKSCHNORRSIG()`)
    this.OP_0()
  }
  OP_CHECKMULTISIG () {
    // Extract public keys
    var numPubKeys = this.pop()
    var pubKeys = []
    var i = 0
    while (numPubKeys.cmp(i) === 1) {
      pubKeys.push(crypto.processPubKey(this.pop()))
      i++
    }

    // Extract signatures
    var numSignatures = this.pop()
    var signatures = []
    i = 0
    while (numSignatures.cmp(i) === 1) {
      signatures.push(crypto.processSignature(this.pop()))
      i++
    }

    // Match keys against signatures. Note that any public key that
    // fails a comparison is then removed, in accordance with the spec.
    for (i = 0; i < signatures.length; i++) {
      var matched = -1
      for (var j = 0; j < pubKeys.length; j++) {
        if (crypto.verifySignature(signatures[i], pubKeys[j])) {
          matched = j
          break
        }
      }

      if (matched === -1) {
        this.OP_0()
        return
      } else {
        // Remove used public keys
        pubKeys = pubKeys.splice(matched + 1)
      }

      var remainingSignatures = signatures.length - (i + 1)
      if (pubKeys.length < remainingSignatures) {
        this.OP_0()
        break
      }
    }

    // If all checks passed, push `true`
    this.OP_1()
  }

  // Terminals
  OP_VERIFY () {
    var top = this.pop()
    debug(`OP_VERIFY() top ${top}`)
    var neq = (top.cmp(BN_ZERO) === 0)
    if (neq) {
      throw new Error('OP_VERIFY() did not verify')
    }

    return !neq
  }
  OP_EQUALVERIFY () {
    this.OP_EQUAL()
    return this.OP_VERIFY()
  }
  OP_MINUNITVALUE () {
    if (this.env === undefined || this.env === false || this.env.INPUT_TX === false) {
      this.OP_0()
    } else {
      var base = this.pop()
      var inputTx = this.env.INPUT_TX

      if (inputTx === undefined || inputTx === false) {
        this.OP_0()
      } else if (this.env.CALLBACK_TX === undefined || this.env.CALLBACK_TX === false) {
        // MINUNITVALUE must have a referenced callback
        this.OP_0()
      } else {
        var txHashIndex = this.env.OUTPOINT_INDEX.getValue().toString(16)
        var txHash = this.env.OUTPOINT_TX.getOutputsList()[txHashIndex].getHash().toString('hex')
        var txOutPointValue = this.env.OUTPOINT_TX.getOutputsList()[txHashIndex].getValue()
        var txOutPointUnit = this.env.OUTPOINT_TX.getOutputsList()[txHashIndex].getUnit()
        var txKey = txHash + ' ' + txHashIndex + ' OP_CALLBACK'

        var callbackOutputs = getOutpointsOfCallback(txKey, this.env.INPUT_TX.getOutputsList())
        // TODO: Run safe math tests and limit UNIT field size
        var minimum = new BN(txOutPointUnit).mul(new BN(base))
        if (minimum.gte(txOutPointValue) === true) {
          this.OP_0()
        }
      }
    }
  }
  OP_CHECKSIGVERIFY () {
    this.OP_CHECKSIG()
    return this.OP_VERIFY()
  }
  OP_CHECKMULTISIGVERIFY () {
    this.OP_CHECKMULTISIG()
    return this.OP_VERIFY()
  }
  OP_CHECKSIGNOPUBKEYVERIFY () {
    debug(`OP_CHECKSIGNOPUBKEYVERIFY() before call`)
    this.OP_CHECKSIGNOPUBKEY()
    return this.OP_VERIFY()
  }
  OP_CHECKSIGNODATAVERIFY () {
    debug(`OP_CHECKSIGNODATAVERIFY() before call`)
    this.OP_CHECKSIGNODATA()
    return this.OP_VERIFY()
  }
  OP_EMERGENCY () {
    const expirationHeight = this.pop()
    const eventSetKey = this.pop()
    const eventKey = this.pop()
    let contextBlock
    if (this.env.INPUT_TX_BLOCK !== false) {
      // if this is being evaluated in the past look at it in point in time block height context
      contextBlock = this.env.INPUT_TX_BLOCK
    } else {
      contextBlock = this.env.LATEST_BLOCK
    }
    // all emergency
    if (contextBlock.getHeight() >= expirationHeight) {
      this.OP_0()
    } else {
      this.OP_1()
    }
    // select the Emergency Services and determine if 3rd party operation has been added
    if (this.env.X[9][eventSetKey] !== undefined && this.env.X[9][eventSetKey][eventKey] !== undefined) {
      if (typeof this.env.X[9][eventSetKey][eventKey] === 'function') {
        // evaluate the locally designated operation
        return this.env.X[9][eventSetKey][eventKey]()
      } else if (this.env.X[9][eventSetKey][eventKey] === true) {
        this.OP_1()
      } else {
        this.OP_0()
      }
    }
  }
  OP_RETURN () {
    return false
  }
}

module.exports = ScriptStack
