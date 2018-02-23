const path = require('path')

export const configDir = path.resolve(__dirname, '..', '..', 'config')

export const configFile = 'config.json'

export const configPath = path.resolve(configDir, configFile)

const configData = require(configPath)

export default function config () {
  return configData
}
