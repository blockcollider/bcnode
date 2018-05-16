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

const BC_DEBUG = process.env.BC_DEBUG
const DEBUG_ENABLED = BC_DEBUG === 'true' || BC_DEBUG === '1'

const DEBUG_DIR = path.resolve(__dirname, '..', '..', '_debug')

/**
 * Creates _debug directory if does not exists
*/
export function ensureDebugDir (force: boolean = false) {
  if (!isDebugEnabled() && (!force)) {
    return
  }

  if (!fs.existsSync(DEBUG_DIR)) {
    fs.mkdirSync(DEBUG_DIR)
  }
}

/**
 * Checks if is debug enabled, BC_DEBUG=true
 */
export function isDebugEnabled () {
  return DEBUG_ENABLED
}

/**
 * Ensures that debug full dir path exists
 */
export function ensureDebugPath (relativePath: string) {
  const fullPath = path.resolve(DEBUG_DIR, relativePath)
  const fullDir = path.dirname(fullPath)
  if (!fs.existsSync(fullDir)) {
    mkdirp.sync(fullDir)
  }
  return fullPath
}

/**
 * Saves object in JSON format into DEBUG_DIR
 * @param relativePath path relative to DEBUG_DIR
 * @param obj Object to be saved
 */
export function debugSaveObject (relativePath: string, obj: Object) {
  if (!isDebugEnabled()) {
    return
  }

  const fullPath = ensureDebugPath(relativePath)

  const writeObj = () => {
    const json = JSON.stringify(obj, null, 2)
    fs.writeFile(fullPath, json, () => {})
  }

  writeObj()
}
