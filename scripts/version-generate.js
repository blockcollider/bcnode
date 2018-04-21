#! /usr/bin/env node

const { getVersion } = require('../src/helper/version')

if (getVersion) {
  console.log('Generating .version.json file')
  getVersion()
} else {
  console.log('Unable to generate .version.json file')
}
