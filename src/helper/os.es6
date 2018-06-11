/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const os = require('os')

export const getOsInfo = () => {
  return {
    arch: os.arch(),
    cpus: os.cpus(),
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    mem: os.totalmem(),
    network: os.networkInterfaces(),
    type: os.type()
  }
}
