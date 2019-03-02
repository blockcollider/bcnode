/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const dns = require('bdns')
const getIP = require('external-ip')()

export const anyDns = async () => {
  try {
    const ip = await dns.getIPv4()
    return Promise.resolve(ip)
  } catch (err) {
    return new Promise((resolve, reject) => {
      getIP((err, ip) => {
        if (err) { reject(err) } else {
          resolve(ip)
        }
      })
    })
  }
}
