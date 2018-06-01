
/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const debug = require('debug')('bcnode:app:helpers')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const process = require('process')

// See https://stackoverflow.com/questions/19275776/node-js-how-to-get-the-os-platforms-user-data-folder
// const APP_DATA_ROOT = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library/Preferences') : '/var/local')
const APP_DATA_ROOT = process.env.HOME

export const APP_DIR_NAME = '.bc'
export const APP_DIR_PATH = path.resolve(APP_DATA_ROOT, APP_DIR_NAME)

export const PUBLIC_KEY_FILE = 'key.public.txt'
export const PUBLIC_KEY_PATH = path.resolve(APP_DIR_PATH, PUBLIC_KEY_FILE)

export const PRIVATE_KEY_FILE = 'key.private.txt'
export const PRIVATE_KEY_PATH = path.resolve(APP_DIR_PATH, PRIVATE_KEY_FILE)

export const ensureAppDataDir = (dataDirPath = APP_DIR_PATH) => {
  debug(`App Data path '${dataDirPath}'`)
  if (!fs.existsSync(dataDirPath)) {
    mkdirp.sync(dataDirPath)
  }
}

export const getPublicKey = (keyPath: string = PUBLIC_KEY_PATH): ?string => {
  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath)
      .toString()
      .trim()
  }

  return undefined
}

export const getPrivateKey = (keyPath: string = PRIVATE_KEY_PATH): ?string => {
  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath)
      .toString()
      .trim()
  }

  return undefined
}
