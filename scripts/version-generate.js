#! /usr/bin/env node

const { genarateVersion } = require('../lib/helper/version')

if (genarateVersion) {
  console.log('Generating .version.json file')
  genarateVersion()
} else {
  console.log('Unable to generate .version.json file')
}
c
