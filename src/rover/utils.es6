const crypto = require('crypto')

export function getPrivateKey () {
  return crypto.randomBytes(32)
}
