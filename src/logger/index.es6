/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type Logger from 'winston'
const { resolve, sep } = require('path')
const winston = require('winston')
const { is, merge } = require('ramda')
require('winston-daily-rotate-file')

const LOG_DIR = resolve(__dirname, '..', '..', '_logs')
const logPath = `${LOG_DIR}/bcnode`
const tsFormat = () => new Date().toISOString()

const LOG_LEVEL = process.env.BC_LOG || 'info'

const format = options => {
  const ts = options.timestamp()
  const level = options.level.toUpperCase()
  const msg = undefined !== options.message ? options.message : ' '
  const meta =
    options.meta && Object.keys(options.meta).length
      ? '\n\t' + JSON.stringify(options.meta, null, 2)
      : ''

  return `${ts} ${level}\t${msg} ${meta}`
}

const logger = new winston.Logger({
  transports: [
    // Console
    new winston.transports.Console({
      timestamp: tsFormat,
      formatter: format,
      level: LOG_LEVEL
    }),

    // File
    new winston.transports.DailyRotateFile({
      filename: logPath,
      timestamp: tsFormat,
      datePattern: '-yyyyMMddHH.log',
      json: false,
      formatter: format,
      level: LOG_LEVEL,
      maxFiles: 10
    })

    // // File error
    // new winston.transports.DailyRotateFile({
    //   filename: `${logPath}`,
    //   timestamp: tsFormat,
    //   datePattern: '-yyyyMMddHH.log',
    //   json: false,
    //   formatter: format,
    //   level: LOG_LEVEL
    // })
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: `${logPath}-exceptions.log`,
      json: false,
      formatter: (options) => {
        const msg = {
          msg: options.message,
          date: options.meta.date,
          stack: options.meta.stack
        }
        return JSON.stringify(msg, null, 2)
      }
    })
  ],
  exitOnError: false
})

const pathToLogPrefix = (path, topLevelDir = 'lib') => {
  const parts = path.split(sep)
  const sliceAt = parts.indexOf(topLevelDir)
  return parts.slice(sliceAt + 1, parts.length).join('.').replace(/^\.|\.js$/g, '').toLowerCase()
}

class LoggingContext {
  /* eslint-disable no-undef */
  _parent: Logger;
  _prefix: string;
  _metadata: Object;
  /* eslint-enable */
  constructor (logger: Logger, prefix: string, metadata: ?Object) {
    this._parent = logger

    // Trim '.' on start or end of the prefix
    this._prefix = prefix ? (prefix.replace(/^\.|\.$/g, '') + ' ') : ''
    this._metadata = metadata || {}

    // Generate convenience log methods based on what the parent has
    if (this._parent && this._parent.levels && is(Object, this._parent.levels)) {
      Object.keys(this._parent.levels).forEach((level) => {
        // $FlowFixMe TODO fix in better way
        this[level] = function () {
          // build argument list (level, msg, ... [string interpolate], [{metadata}], [callback])
          const args = [level].concat(Array.prototype.slice.call(arguments))
          this.log.apply(this, args)
        }
      })
    }
  }

  close (id: any) {
    return this._parent.close(id)
  }

  log (level: string, name: string) {
    // Stolen procesing code from Winston itself
    const args = Array.prototype.slice.call(arguments, 2) // All args except level and name

    const callback = typeof args[args.length - 1] === 'function' ? args.pop() : null
    let meta = {}
    const nonMeta = []

    for (let i = 0; i < args.length; i += 1) {
      if (is(Object, args[i])) {
        meta = merge(meta, args[i])
      } else {
        nonMeta.push(args[i])
      }
    }

    this._parent.log.apply(this._parent, [level, this._prefix + name]
      .concat(nonMeta)
      .concat([merge(meta, this._metadata), callback]))
  }
}

export const getLogger = (path: string, meta: ?Object): Logger => {
  return new LoggingContext(logger, pathToLogPrefix(path), meta)
}
