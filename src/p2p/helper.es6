/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const fs = require('fs')
const PeerInfo = require('peer-info')

export const generateP2PKey = (path: ?string = null) : Promise<*> => {
  return new Promise((resolve, reject) => {
    PeerInfo.create((err, peerInfo) => {
      if (err) {
        return reject(err)
      }

      const obj = peerInfo.id.toJSON()
      if (!path) {
        return resolve(obj)
      }

      const json = JSON.stringify(obj, null, 2)
      fs.writeFile(path, json, (err) => {
        if (err) {
          return reject(err)
        }

        return resolve(peerInfo)
      })
    })
  })
}
