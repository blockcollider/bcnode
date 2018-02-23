const path = require('path')
const winston = require('winston')
require('winston-daily-rotate-file')

const logDir = path.resolve(__dirname, '..', '..', 'logs')

const logPath = `${logDir}/bcnode`

const tsFormat = () => (new Date()).toISOString()

const format = (options) => {
  const ts = options.timestamp()
  const level = options.level.toUpperCase()
  const msg = (undefined !== options.message ? options.message : '')
  const meta = (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta, null, 2) : '')

  return `${ts} ${level}\t${msg} ${meta}`
}

export const logger = (function init () {
  return new (winston.Logger)({
    transports: [
      // Console
      new (winston.transports.Console)({
        colorize: true,
        timestamp: tsFormat,
        formatter: format
      }),

      // File
      new (winston.transports.DailyRotateFile)({
        filename: logPath,
        timestamp: tsFormat,
        datePattern: '-yyyyMMddHH.log',
        json: false,
        formatter: format
      })

      // new (winston.transports.File)({
      //   name: 'info-file',
      //   filename: 'filelog-info.log',
      //   level: 'info'
      // }),
      //
      // new (winston.transports.File)({
      //   name: 'error-file',
      //   filename: 'filelog-error.log',
      //   level: 'error'
      // })
    ]
  })
})()
