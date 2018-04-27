#! /usr/bin/env babel-node

const { generateVersionFile } = require('../lib/helper/version')

if (generateVersionFile) {
  try {
    console.log('Generating .version.json file')
    var version = generateVersionFile()
    console.log(JSON.stringify(version, null, 2))
  } catch (err) {
    console.log('Unable to generate .version.json file', err)
  }
} else {
  console.log('Unable to generate .version.json file')
}
