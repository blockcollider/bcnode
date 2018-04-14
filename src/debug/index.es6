/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
*/

const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const process = require('process')

const DEBUG_ENABLED = process.env.BC_DEBUG === 'true'
const DEBUG_DIR = path.resolve(__dirname, '..', '..', '_debug')

export function ensureDebugDir () {
  if (!isDebugEnabled()) {
    return
  }

  if (!fs.existsSync(DEBUG_DIR)) {
    fs.mkdirSync(DEBUG_DIR)
  }
}

export function isDebugEnabled () {
  return DEBUG_ENABLED
}

export function debugSaveObject (relativePath: string, obj: Object) {
  if (!isDebugEnabled()) {
    return
  }

  const fullPath = path.resolve(DEBUG_DIR, relativePath)

  const writeObj = () => {
    const json = JSON.stringify(obj, null, 2)
    fs.writeFile(fullPath, json, () => {})
  }

  const fullDir = path.dirname(fullPath)
  if (!fs.existsSync(fullDir)) {
    mkdirp(fullDir, (err) => {
      if (!err) {
        writeObj()
      }
    })
  } else {
    writeObj()
  }
}
