#! /usr/bin/env node

/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
const process = require('process')

const Controller = require('./controller').default
const config = require('../../../config/config')

const ROVER_TITLE = 'bc-rover-neo'

/**
 * NEO Rover entrypoint
 */
const main = () => {
  process.title = ROVER_TITLE

  const controller = new Controller(config)
  controller.init()
}

main()
