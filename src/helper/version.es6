/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const execSync = require('child_process').execSync
const fs = require('fs')
const path = require('path')

const { objFromFileSync, objToFile } = require('../helper/json')

const logging = require('../logger')
const logger: Object = logging.getLogger(__filename)

const PKG = require('../../package.json')

const VERSION_FILENAME: string = '.version.json'
const VERSION_FILE_PATH: string = path.resolve(__dirname, '..', '..', VERSION_FILENAME)

const DEFAULT_VERSION: Object = {
  git: '<unknown>',
  npm: '<unknown>'
}

export const genarateVersion = () => {
  const cmds = [
    [
      'npm',
      () => PKG.version
    ],
    [
      'git',
      () => {
        return {
          long: execSync('git rev-parse HEAD').toString().trim(),
          short: execSync('git rev-parse --short HEAD').toString().trim()
        }
      }
    ]
  ]

  try {
    return cmds.reduce((acc, el) => {
      const [key, valFn] = el
      acc[key] = valFn()

      return acc
    }, DEFAULT_VERSION)
  } catch (e) {
    logger.warn(`Unable to generate '${VERSION_FILENAME}', reason: ${e.message}`)
    return DEFAULT_VERSION
  }
}

export const getVersion = (path: string = VERSION_FILE_PATH) => {
  if (fs.existsSync(path)) {
    try {
      return readVersionFile(path)
    } catch (e) {
      logger.warn(`Unable to read version from file, path: '${VERSION_FILENAME}', reason: ${e.message}`)
      return DEFAULT_VERSION
    }
  }

  const version = genarateVersion()

  if (version) {
    writeVersionFile(path, genarateVersion())
  }

  return version
}

export const readVersionFile = (path: string = VERSION_FILE_PATH) => {
  return objFromFileSync(path)
}

export function writeVersionFile (path: string = VERSION_FILE_PATH, version: ?Object = null) {
  return objToFile(VERSION_FILE_PATH, version || getVersion(path))
}
