/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const fs = require('fs')
const path = require('path')
const { mergeDeepRight } = require('ramda')

/**
 * Absolute path of config dir
 *
 * @type {string}
 */
export const configDir: string = path.resolve(__dirname, '..', '..', 'config')

/**
 * Name of config file
 * @type {string}
 */
export const configFile: string = 'config.json'

/**
 * Full path to config file
 *
 * @type {string}
 */
export const configPath: string = path.resolve(configDir, configFile)

/**
 * Parsed config data
 *
 * @type {Object}
 */
// $FlowFixMe
const configData: Object = require(configPath)

/**
 * Get config
 * @returns {*}
 */
export const config = (() => {
  let res = configData

  const additionalConfig = process.env.BC_CONFIG
  if (additionalConfig && fs.existsSync(additionalConfig)) {
    try {
      const additional = fs.readFileSync(additionalConfig)
      const obj = JSON.parse(additional.toString())

      if (obj._version !== res._version) {
        // TODO: Inform user that we can not merge config files with different versions
        return res
      }

      res = mergeDeepRight(res, obj)
    } catch (err) {
      throw new Error(`Wrong BC_CONFIG path specified, reason: ${err.message}`)
    }
  }

  return res
})()
