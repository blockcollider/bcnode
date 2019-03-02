const { readFileSync, writeFileSync } = require('fs')
const FILENAME = './src/script/script.js'

try {
  const contents = readFileSync(FILENAME, 'utf-8')
  const newContents = `/* eslint-disable */\n${contents}`
  writeFileSync(FILENAME, newContents)
} catch (err) {
  console.log(`Unable to process ${FILENAME}`, err)
}
