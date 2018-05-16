/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { Command } = require('commander')
const { getOsInfo } = require('../../helper/os')

export const cmd = (program: typeof Command) => {
  // return program.help()
  //
  // if (!program.opts) {
  //   return program.help()
  // }
  //

  if (program.opts().all || program.opts().machine) {
    console.log(JSON.stringify(getOsInfo(), null, 2))
  }
}
