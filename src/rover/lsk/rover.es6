#! /usr/bin/env node

/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const process = require('process')
const logging = require('../../logger')
const Controller = require('./controller').default

const ROVER_TITLE = 'bc-rover-lsk'

const main = () => {
  process.title = ROVER_TITLE

  const controller = new Controller(logging.logger)
  controller.init()
}

main()
