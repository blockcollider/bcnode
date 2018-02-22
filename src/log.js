const winston = require('winston')
const moment = require('moment')
const tsFormat = () =>
  moment()
    .utc()
    .format('YYYYMMDDHHmmss')

function logger (opts) {
  if (opts == undefined) {
    return new winston.Logger({
      transports: [
        new winston.transports.Console({
          timestamp: tsFormat,
          formatter: function (options) {
            return (
              options.timestamp() +
              ' [' +
              options.level.toUpperCase() +
              '] \t' +
              (undefined !== options.message ? options.message : '') +
              (options.meta && Object.keys(options.meta).length
                ? '\n\t' + JSON.stringify(options.meta)
                : '')
            )
          },
          colorize: true
        }),
        new winston.transports.File({ filename: 'BLOCKCOLLIDER.log' })
      ]
    })
  } else {
    return new winston.Logger(opts)
  }
}

module.exports = logger
