const pt = require('prompt')
const Crypt = require('./crypt.js')
const crypt = new Crypt()
const colors = require('colors/safe')
const fs = require('fs-extra')
const string = require('./utils/strings.js')
const bitcoin = require('bitcoinjs-lib')
const keythereum = require('keythereum')
const ICAP = require('ethereumjs-icap')
const Log = require('./log.js')
const Output = require('./primitives/output')

let log

if (!global.log) {
  log = new Log()
} else {
  log = global.log
}

function generateDirectAddress () {
  return crypt.createSecPrivateKey()
}

function Account (opts) {
  var options = {
    path: './',
    file: 'accounts.json'
  }
  if (opts !== undefined) {
    Object.keys(opts).map(function (k) {
      this[k] = opts[k]
    })
  } else {
    Object.keys(options).map(function (k) {
      this[k] = options[k]
    })
  }
  // TODO: Temporary addition
  this.uxto = [new Output()]
}

Account.prototype = {
  createColliderBase: function (cb) {
    var self = this
    self.createAddress(cb)
  },

  unlockColliderBase: function (cb) {
    var self = this
    var identity = self.path + '/identity.json'

    self.unlockAccount(identity.base.publicKey, cb)
  },

  unlockAccount: function (publicKey, cb, colliderBase) {},

  createAddress: function (cb) {
    var self = this
    pt.message = colors.green('BlockCollider')

    pt.delimiter = colors.grey(':')

    pt.start()

    pt.get(
      [
        {
          properties: {
            password: {
              description: 'Password to secure collider base on disk',
              delimiter: colors.grey('>'),
              hidden: true,
              required: true,
              conform: function (value) {
                if (
                  value !== undefined &&
                  value.length > 3 &&
                  value !== 'password' &&
                  value !== 'pass'
                ) {
                  return true
                }
              }
            }
          }
        }
      ],
      function (err, result) {
        if (err) {
          console.trace(err)
        }

        pt.get(
          [
            {
              properties: {
                hideKey: {
                  description:
                    ' Print and save your private key? (WARNING: less secure)',
                  type: 'boolean',
                  delimiter: colors.grey('>'),
                  default: false,
                  required: true
                }
              }
            }
          ],
          function (err, hidePrivateKey) {
            pt.stop()

            if (err) {
              cb(err)
            } else {
              log.info('generating keys')

              var params = {
                keyBytes: 32,
                ivBytes: 16
              }

              var options = {
                kdf: 'pbkdf2',
                cipher: 'aes-128-ctr',
                kdfparams: {
                  c: 262144,
                  dklen: 32,
                  prf: 'hmac-sha256'
                }
              }

              keythereum.create(params, function (dk) {
                dk.privateKey = generateDirectAddress()

                keythereum.dump(
                  result.password,
                  dk.privateKey,
                  dk.salt,
                  dk.iv,
                  options,
                  function (keyObject) {
                    var privateKey = dk.privateKey
                    var publicKey = crypt.createSecPublicKey(privateKey)
                    var publicKeyHash = bitcoin.crypto.hash160(
                      new Buffer(publicKey, 'hex')
                    )
                    var addr = bitcoin.address.toBase58Check(
                      publicKeyHash,
                      bitcoin.networks.bitcoin.pubKeyHash
                    )

                    try {
                      var account = {
                        publicKey: publicKey.toString('hex'),
                        address: ICAP.fromAddress('0x' + keyObject.address),
                        longAddress: '0x' + keyObject.address,
                        shortAddress: addr,
                        ePrivateKey: crypt.encrypt(privateKey, result.password),
                        networkSig: crypt.signSec(
                          string.blake2bl(self.networkKey),
                          privateKey
                        )
                      }

                      fs.ensureDir(global.path + '/keypairs', function (err) {
                        if (err) {
                          cb(err)
                        } else {
                          fs.writeFile(
                            global.path +
                              '/keypairs/' +
                              account.address +
                              '.json',
                            JSON.stringify(keyObject),
                            'utf8',
                            function (err) {
                              if (err) {
                                cb(err)
                              } else {
                                if (hidePrivateKey.hideKey == false) {
                                  console.log('Private Key: ' + privateKey)
                                  global.privateKey = privateKey
                                }

                                cb(null, account)
                              }
                            }
                          )
                        }
                      })
                    } catch (err) {
                      log.error('unable to create keys rerunning')

                      self.createAccount(cb)
                    }
                  }
                )
              })
            }
          }
        )
      }
    )
  },

  storeAccount: function (obj, cb) {
    var self = this

    fs.pathExists(file, (err, exists) => {
      if (err) {
        cb(err)
      } else {
        var accounts = {}
        var file = self.path + '/' + self.file

        if (exists == true) {
          accounts = require(file)
        }

        accounts[obj.publicKey] = obj

        fs.writeFile(file, JSON.stringify(accounts), 'utf8', function (err, s) {
          if (err) {
            cb(err)
          } else {
            cb(null, obj)
          }
        })
      }
    })
  },

  createAccount: function (cb) {
    var self = this

    self.createAddress(function (err, account) {
      if (err) {
        cb(err)
      } else {
        self.storeAccount(account, cb)
      }
    })
  },

  importAccount: function () {},

  getAccounts: function () {},

  removeAccount: function () {}
}

module.exports = Account
