#! /usr/bin/env babel-node

const { getVersion } = require('../src/helper/version')

if (getVersion) {
  try {
    console.log('Generating .version.json file')
    getVersion()
  } catch (err) {
    console.log('Unable to generate .version.json file', err)
  }
} else {
  console.log('Unable to generate .version.json file')
}
