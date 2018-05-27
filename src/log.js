/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const winston = require('winston')
const moment = require('moment')
const tsFormat = () =>
  moment()
    .utc()
    .format('YYYYMMDDHHmmss')

function logger (opts: Object) {
  if (opts) {
    return new winston.Logger(opts)
  }

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
      new winston.transports.File({
        filename: 'BLOCKCOLLIDER.log'
      })
    ]
  })
}

module.exports = logger
