/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const config = require('../../../config/config')

const { Command } = require('commander')

export const cmd = (program: typeof Command) => {
  if (program.opts().show) {
    console.log(JSON.stringify(config, null, 2))
    return
  }

  return program.help()
}
