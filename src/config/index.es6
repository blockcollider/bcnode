const path = require('path')

/**
 * Absoulute path of config dir
 */
export const configDir = path.resolve(__dirname, '..', '..', 'config')

/**
 * Name of config file
 * @type {string}
 */
export const configFile = 'config.json'

/**
 * Full path to config file
 */
export const configPath = path.resolve(configDir, configFile)

/**
 * Parsed config data
 */
const configData = require(configPath)

/**
 * Get config
 * @returns {*}
 */
export default function config () {
  return configData
}
