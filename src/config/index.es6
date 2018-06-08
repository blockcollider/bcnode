const path = require('path')

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
export const configPath: string = process.env.BC_CONFIG || path.resolve(configDir, configFile)

/**
 * Parsed config data
 *
 * @type {Object}
 */
const configData: Object = require(configPath)

/**
 * Get config
 * @returns {*}
 */
export const config = configData
